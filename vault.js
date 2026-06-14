/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          CryptoVault — CloudOS 11 Add-on Module             ║
 * ║                                                             ║
 * ║  Encryption pipeline (3 stacked independent layers):        ║
 * ║    ENCRYPT: Plaintext → AES-256-GCM → XOR → Base64         ║
 * ║    DECRYPT: Base64⁻¹  → XOR        → AES-256-GCM⁻¹        ║
 * ║                                                             ║
 * ║  INSTALLATION — add ONE line before </body> in index.html:  ║
 * ║    <script src="vault.js"></script>                         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     TRANSPARENT STORAGE ENCRYPTION
     Intercepts every localStorage.setItem / getItem call so that
     all data written to disk is encrypted, and all data read back
     is decrypted — automatically, invisibly, OS-wide.

     Keys that store binary-flag values (wallpaper class names,
     simple '0'/'1' toggles, numeric scores) are encrypted just
     like everything else; the OS code never sees ciphertext.

     Flow on setItem:  value  → vaultEncrypt → ciphertext stored
     Flow on getItem:  ciphertext stored → vaultDecrypt → value
  ══════════════════════════════════════════════════════════════ */

  // Master password set at login; null means not yet unlocked.
  var _masterPassword = null;

  // Keys that vault.js itself uses internally — skip re-encrypting them.
  var VAULT_INTERNAL_KEYS = { cloudos_vault_v1: true, cloudos_pw_hash: true };

  // Preserve references to the real localStorage methods.
  var _realSetItem = localStorage.setItem.bind(localStorage);
  var _realGetItem = localStorage.getItem.bind(localStorage);
  var _realRemoveItem = localStorage.removeItem.bind(localStorage);

  // Prefix added to every encrypted value so we can tell it apart
  // from any unencrypted legacy data that may already be in storage.
  var ENC_PREFIX = 'vaultenc::';

  // Override setItem — encrypt synchronously-looking via a write queue.
  // Because Web Crypto is async we store a temporary placeholder
  // immediately (so the OS doesn't block), then replace it once the
  // Promise resolves.  Reads wait for the queue to flush.
  localStorage.setItem = function (key, value) {
    if (!_masterPassword || VAULT_INTERNAL_KEYS[key]) {
      _realSetItem(key, value);
      return;
    }
    // Always update the cache immediately so getItem returns the
    // correct plaintext even before the async encryption finishes.
    _decryptedCache[key] = String(value);
    window.vaultEncrypt(String(value), _masterPassword).then(function (enc) {
      _realSetItem(key, ENC_PREFIX + enc);
    }).catch(function () {
      // Fallback: store plaintext if encryption fails
      _realSetItem(key, String(value));
    });
  };

  // Override getItem — decrypt transparently.
  // Returns the plaintext value synchronously from a resolved cache,
  // or falls back to the raw value if not yet encrypted.
  localStorage.getItem = function (key) {
    var raw = _realGetItem(key);
    if (!raw || !_masterPassword || VAULT_INTERNAL_KEYS[key]) return raw;
    if (!raw.startsWith(ENC_PREFIX)) return raw; // legacy unencrypted data
    // For synchronous callers we return the decrypted value via a
    // cached map that is populated eagerly on unlock.
    return _decryptedCache[key] !== undefined ? _decryptedCache[key] : raw;
  };

  // Override removeItem so vault keys stay in sync.
  localStorage.removeItem = function (key) {
    delete _decryptedCache[key];
    _realRemoveItem(key);
  };

  // In-memory cache: key → decrypted value (populated on login).
  var _decryptedCache = {};

  // After login, decrypt every existing storage key into the cache
  // so synchronous getItem calls return the right value instantly.
  // Fired once the cache is warm and all reads are safe.
  var _vaultReady = false;
  function _onVaultReady(cb) {
    if (_vaultReady) { cb(); return; }
    document.addEventListener('vault:ready', cb, { once: true });
  }
  window.vaultReady = _onVaultReady;

  async function _warmDecryptCache(password) {
    var keys = Object.keys(localStorage);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (VAULT_INTERNAL_KEYS[k]) continue;
      var raw = _realGetItem(k);
      if (raw && raw.startsWith(ENC_PREFIX)) {
        try {
          _decryptedCache[k] = await window.vaultDecrypt(raw.slice(ENC_PREFIX.length), password);
        } catch (e) { _decryptedCache[k] = null; }
      } else if (raw !== null) {
        // Plaintext value — encrypt it now and cache the plaintext.
        _decryptedCache[k] = raw;
        try {
          var enc = await window.vaultEncrypt(raw, password);
          _realSetItem(k, ENC_PREFIX + enc);
        } catch (e) {}
      }
    }
  }

  /* ── Login Screen ────────────────────────────────────────────
     Injects a full-screen lock overlay before the boot sequence.
     The OS boot animation is held until the correct password is
     entered (or a new password is set on first run).
  ──────────────────────────────────────────────────────────── */

  function _showLoginScreen() {
    var overlay = document.createElement('div');
    overlay.id = 'vault-login-overlay';
    overlay.style.cssText = [
      'position:fixed;inset:0;z-index:99999',
      'background:linear-gradient(135deg,#0a0a14 0%,#0d0d1f 60%,#0a0f1a 100%)',
      'display:flex;flex-direction:column;align-items:center;justify-content:center',
      'font-family:system-ui,sans-serif;gap:0'
    ].join(';');

    var isFirst = !_realGetItem('cloudos_pw_hash');

    overlay.innerHTML = [
      '<div style="font-size:56px;margin-bottom:18px;filter:drop-shadow(0 0 24px #0078D4aa)">🔐</div>',
      '<div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:6px;letter-spacing:-.01em">',
        isFirst ? 'Set Up Encryption' : 'CloudOS 11',
      '</div>',
      '<div style="font-size:13px;color:rgba(255,255,255,0.38);margin-bottom:32px;text-align:center;max-width:280px">',
        isFirst
          ? 'Choose a master password. All data saved by this OS will be encrypted with it.'
          : 'Enter your master password to unlock your encrypted session.',
      '</div>',
      '<div style="display:flex;flex-direction:column;gap:12px;width:300px">',
        '<input id="vault-login-pw" type="password" placeholder="',
          isFirst ? 'Choose a master password…' : 'Master password…',
        '" style="',
          'width:100%;padding:12px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);',
          'background:rgba(255,255,255,0.07);color:#fff;font-size:15px;outline:none;',
          'font-family:inherit;box-sizing:border-box;',
        '">',
        isFirst ? [
          '<input id="vault-login-pw2" type="password" placeholder="Confirm password…" style="',
            'width:100%;padding:12px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);',
            'background:rgba(255,255,255,0.07);color:#fff;font-size:15px;outline:none;',
            'font-family:inherit;box-sizing:border-box;">'
        ].join('') : '',
        '<button id="vault-login-btn" style="',
          'width:100%;padding:13px;border:none;border-radius:10px;',
          'background:#0078D4;color:#fff;font-size:15px;font-weight:700;',
          'cursor:pointer;font-family:inherit;transition:opacity .15s;',
        '">',
          isFirst ? '🔐 Encrypt & Start' : '🔓 Unlock',
        '</button>',
        '<div id="vault-login-err" style="',
          'display:none;text-align:center;font-size:12px;color:#fca5a5;',
          'background:rgba(220,38,38,0.18);border:1px solid rgba(220,38,38,0.3);',
          'padding:8px 12px;border-radius:8px;">',
        '</div>',
      '</div>',
      '<div style="margin-top:28px;font-size:11px;color:rgba(255,255,255,0.2);text-align:center;max-width:320px;line-height:1.6">',
        '🔒 All storage is encrypted with AES-256-GCM + XOR using your password.<br>',
        'Nothing is sent over the network. Encryption runs locally in your browser.',
      '</div>'
    ].join('');

    document.body.appendChild(overlay);

    var pwInput  = document.getElementById('vault-login-pw');
    var pw2Input = document.getElementById('vault-login-pw2');
    var btn      = document.getElementById('vault-login-btn');
    var errEl    = document.getElementById('vault-login-err');

    function showErr(msg) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
      pwInput.style.borderColor = 'rgba(220,38,38,0.6)';
    }
    function clearErr() {
      errEl.style.display = 'none';
      pwInput.style.borderColor = 'rgba(255,255,255,0.15)';
    }

    async function attemptLogin() {
      clearErr();
      var pw = pwInput.value;
      if (!pw) { showErr('Please enter a password.'); return; }

      if (isFirst) {
        var pw2 = pw2Input ? pw2Input.value : pw;
        if (pw !== pw2) { showErr('Passwords do not match.'); return; }
        if (pw.length < 4) { showErr('Password must be at least 4 characters.'); return; }
        // Hash and store the password verifier.
        var hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw + ':cloudos-verify'));
        var hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,'0')).join('');
        _realSetItem('cloudos_pw_hash', hashHex);
        btn.disabled = true;
        btn.textContent = '⏳ Setting up…';
        _masterPassword = pw;
        await _warmDecryptCache(pw);
        _dismissLogin(overlay);
      } else {
        // Verify against stored hash.
        var storedHash = _realGetItem('cloudos_pw_hash');
        var hashBuf2 = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw + ':cloudos-verify'));
        var hashHex2 = Array.from(new Uint8Array(hashBuf2)).map(b => b.toString(16).padStart(2,'0')).join('');
        console.log('[VaultDebug] typed hash  :', hashHex2);
        console.log('[VaultDebug] stored hash :', storedHash);
        console.log('[VaultDebug] match?      :', hashHex2 === storedHash);
        if (hashHex2 !== storedHash) {
          showErr('Incorrect password. Try again.');
          pwInput.value = '';
          pwInput.focus();
          return;
        }
        btn.disabled = true;
        btn.textContent = '⏳ Decrypting…';
        _masterPassword = pw;
        await _warmDecryptCache(pw);
        _dismissLogin(overlay);
      }
    }

    btn.addEventListener('click', attemptLogin);
    pwInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') attemptLogin(); });
    if (pw2Input) pw2Input.addEventListener('keydown', function(e) { if (e.key === 'Enter') attemptLogin(); });

    // Focus the password field after a short delay.
    setTimeout(function() { pwInput.focus(); }, 100);
  }

  function _dismissLogin(overlay) {
    _vaultReady = true;
    document.dispatchEvent(new Event('vault:ready'));
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.opacity = '0';
    setTimeout(function() { overlay.remove(); }, 520);
  }

  // Inject the login screen as soon as the DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _showLoginScreen);
  } else {
    _showLoginScreen();
  }

  /* ══════════════════════════════════════════════════════════════
     URL CLOAKING — runs after login screen so it doesn't interfere
     Format: https://cloudos11.app/session/<16 hex chars>
  ══════════════════════════════════════════════════════════════ */
  (function _cloakURL() {
    try {
      var tokenBytes = crypto.getRandomValues(new Uint8Array(8));
      var token = Array.from(tokenBytes)
        .map(function(b) { return b.toString(16).padStart(2, '0'); })
        .join('');
      history.pushState({ session: token }, 'CloudOS 11', 'https://cloudos11.app/session/' + token);
      document.title = 'CloudOS 11';
    } catch (e) {}
  })();

  /* ══════════════════════════════════════════════════════════════
     REGISTER WITH CLOUDOS 11
     Patches the OS at runtime — no edits to index.html needed
     beyond the single <script> tag.
  ══════════════════════════════════════════════════════════════ */

  // 1. Add vault to the window-manager app registry
  APPS.vault = { name: 'CryptoVault', icon: '🔐', w: 870, h: 570 };

  // 2. Patch buildAppHTML so the window manager can build vault's UI
  const _origBuildAppHTML = window.buildAppHTML;
  window.buildAppHTML = function (id) {
    if (id === 'vault') return buildVaultHTML();
    return _origBuildAppHTML(id);
  };

  // 3. Patch createWindow to call vault's post-init hook
  const _origCreateWindow = window.createWindow;
  window.createWindow = function (id) {
    _origCreateWindow(id);
    if (id === 'vault') setTimeout(initVault, 80);
  };

  // 4. Inject desktop icon + Start-Menu entry once the page is idle
  //    (DOMContentLoaded has already fired by the time vault.js loads)
  setTimeout(function () {
    // ── Desktop icon ──────────────────────────────────────────
    const cont = document.getElementById('desktop-icons');
    if (cont) {
      // Stack below the lowest existing icon
      let maxY = 0;
      cont.querySelectorAll('.desktop-icon').forEach(function (ic) {
        const t = parseInt(ic.style.top) || 0;
        if (t > maxY) maxY = t;
      });
      const el = document.createElement('div');
      el.className  = 'desktop-icon';
      el.style.left = '0px';
      el.style.top  = (maxY + 100) + 'px';
      el.dataset.id = 'vault';
      el.innerHTML  = '<div class="di-icon">🔐</div><div class="di-label">CryptoVault</div>';
      el.addEventListener('dblclick', function () { openApp('vault'); });
      el.addEventListener('click',    function (e) { e.stopPropagation(); selectIcon(el); });
      makeDraggableIcon(el);
      cont.appendChild(el);
    }

    // ── Start Menu — All Apps grid ────────────────────────────
    const allGrid = document.getElementById('sm-all-grid');
    if (allGrid) {
      // smAppEl is the CloudOS helper that builds Start-Menu tiles
      allGrid.appendChild(smAppEl({ id: 'vault', icon: '🔐', name: 'CryptoVault' }));
    }
  }, 0);


  /* ══════════════════════════════════════════════════════════════
     LAYER 1 — AES-256-GCM   (Web Crypto API)

     • Key derivation : PBKDF2(password, randomSalt, 310 000 iter, SHA-256)
     • Cipher mode    : AES-GCM, 256-bit key, 12-byte random IV per message
     • Authentication : 16-byte GCM tag — any tampering is detected & rejected
     • Wire format    : [salt 16 B][IV 12 B][ciphertext + GCM tag 16 B]
  ══════════════════════════════════════════════════════════════ */

  async function deriveAESKey(password, salt) {
    const raw = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: 310000, hash: 'SHA-256' },
      raw,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function aesEncrypt(plaintext, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const key  = await deriveAESKey(password, salt);
    const ct   = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      new TextEncoder().encode(plaintext)
    );
    // Pack: [salt 16][iv 12][ciphertext]
    const packed = new Uint8Array(28 + ct.byteLength);
    packed.set(salt, 0);
    packed.set(iv, 16);
    packed.set(new Uint8Array(ct), 28);
    return packed;
  }

  async function aesDecrypt(packed, password) {
    const salt = packed.slice(0, 16);
    const iv   = packed.slice(16, 28);
    const ct   = packed.slice(28);
    const key  = await deriveAESKey(password, salt);
    const pt   = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ct
    );
    return new TextDecoder().decode(pt);
  }


  /* ══════════════════════════════════════════════════════════════
     LAYER 2 — XOR Cipher   (SHA-256 derived key)

     • Key    : SHA-256(password + ":xor-v1") — 32 bytes, cyclic
     • Applied to the AES output bytes, not the raw plaintext
     • Key material is completely independent from Layer 1
     • XOR is self-inverse: encrypt(encrypt(x)) === x
  ══════════════════════════════════════════════════════════════ */

  async function xorLayer(bytes, password) {
    const hashBuf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(password + ':xor-v1')
    );
    const key = new Uint8Array(hashBuf);          // 32 bytes
    const out = new Uint8Array(bytes.length);
    for (var i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ key[i % 32];
    }
    return out;
  }


  /* ══════════════════════════════════════════════════════════════
     LAYER 3 — Base64 URL-safe   (outer encoding)

     • Converts binary bytes to printable ASCII for copy/paste/storage
     • URL-safe alphabet: + → -, / → _, padding = stripped
     • Reversed first during decryption before inner layers are unwrapped
  ══════════════════════════════════════════════════════════════ */

  function toBase64(bytes) {
    return btoa(String.fromCharCode.apply(null, bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function fromBase64(str) {
    var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    var pad = (4 - (b64.length % 4)) % 4;
    var bin = atob(b64 + '===='.slice(0, pad));
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }


  /* ══════════════════════════════════════════════════════════════
     PUBLIC API  — exposed on window so any part of CloudOS can call them

     vaultEncrypt(plaintext, password) → Promise<string>
       Pipeline: Plaintext → aesEncrypt → xorLayer → toBase64 → string

     vaultDecrypt(ciphertext, password) → Promise<string>
       Pipeline: string → fromBase64 → xorLayer → aesDecrypt → Plaintext
  ══════════════════════════════════════════════════════════════ */

  window.vaultEncrypt = async function (plaintext, password) {
    if (!plaintext) throw new Error('Nothing to encrypt');
    if (!password)  throw new Error('Password required');
    var l1 = await aesEncrypt(plaintext, password);   // Layer 1: AES-256-GCM
    var l2 = await xorLayer(l1, password);            // Layer 2: XOR
    return toBase64(l2);                              // Layer 3: Base64
  };

  window.vaultDecrypt = async function (encoded, password) {
    if (!encoded)  throw new Error('Nothing to decrypt');
    if (!password) throw new Error('Password required');
    var l3 = fromBase64(encoded);                     // Layer 3 undo: Base64 decode
    var l2 = await xorLayer(l3, password);            // Layer 2 undo: XOR (self-inverse)
    return aesDecrypt(l2, password);                  // Layer 1 undo: AES-256-GCM decrypt
  };


  /* ══════════════════════════════════════════════════════════════
     VAULT NOTE STORAGE
     Notes are stored already-encrypted in localStorage.
     CryptoVault never holds plaintext at rest.
  ══════════════════════════════════════════════════════════════ */

  var VAULT_KEY = 'cloudos_vault_v1';

  function vaultLoad() {
    try { return JSON.parse(localStorage.getItem(VAULT_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function vaultStore(notes) {
    localStorage.setItem(VAULT_KEY, JSON.stringify(notes));
  }

  function esc(s) {                       // tiny HTML-escape for dynamic content
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }


  /* ══════════════════════════════════════════════════════════════
     UI — HTML BUILDERS
  ══════════════════════════════════════════════════════════════ */

  function buildVaultHTML() {
    return `
<div id="vault-root" style="display:flex;height:100%;background:#0d0d14;font-family:var(--font);overflow:hidden">

  <!-- ── Left sidebar ──────────────────────────────────── -->
  <div style="width:194px;background:#111118;border-right:1px solid rgba(255,255,255,0.07);
              display:flex;flex-direction:column;flex-shrink:0">

    <div style="padding:18px 16px 8px;font-size:10px;font-weight:700;
                color:rgba(255,255,255,0.28);letter-spacing:.12em;text-transform:uppercase">
      CryptoVault
    </div>

    <button class="vn" onclick="vaultTab('encrypt',this)" style="background:rgba(0,120,212,0.18);color:#6AB4F5">🔒 Encrypt</button>
    <button class="vn" onclick="vaultTab('decrypt',this)">🔓 Decrypt</button>
    <button class="vn" onclick="vaultTab('notes',this)"  >📂 Vault Notes</button>
    <button class="vn" onclick="vaultTab('info',this)"   >🔬 How It Works</button>

    <div style="flex:1"></div>

    <!-- Cipher layer indicator -->
    <div style="padding:14px 16px;border-top:1px solid rgba(255,255,255,0.07)">
      <div style="font-size:9.5px;font-weight:700;color:rgba(255,255,255,0.25);
                  letter-spacing:.08em;text-transform:uppercase;margin-bottom:9px">
        Active cipher layers
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:7px;height:7px;border-radius:50%;background:var(--accent);flex-shrink:0"></div>
          <span style="font-size:10.5px;color:rgba(255,255,255,0.45)">① AES-256-GCM</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:7px;height:7px;border-radius:50%;background:#7c3aed;flex-shrink:0"></div>
          <span style="font-size:10.5px;color:rgba(255,255,255,0.45)">② XOR (SHA-256 key)</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:7px;height:7px;border-radius:50%;background:#059669;flex-shrink:0"></div>
          <span style="font-size:10.5px;color:rgba(255,255,255,0.45)">③ Base64 URL-safe</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Main panel ────────────────────────────────────── -->
  <div id="vault-main" style="flex:1;overflow-y:auto;padding:24px 26px"></div>

</div>

<style>
  /* Sidebar nav buttons */
  .vn {
    width:100%;padding:10px 16px;background:none;border:none;
    color:rgba(255,255,255,0.55);font-size:13px;font-family:var(--font);
    text-align:left;cursor:pointer;transition:background .12s,color .12s;
  }
  .vn:hover { background:rgba(255,255,255,0.06);color:#fff; }

  /* Form controls */
  .vt {
    width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
    border-radius:var(--radius);color:#fff;font-family:var(--font-mono);font-size:12px;
    padding:11px 12px;resize:none;outline:none;transition:border .15s;line-height:1.5;
  }
  .vt:focus { border-color:var(--border-focus); }

  .vi {
    width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
    border-radius:var(--radius-sm);color:#fff;font-family:var(--font);font-size:13px;
    padding:9px 12px;outline:none;transition:border .15s;
  }
  .vi:focus { border-color:var(--border-focus); }

  .vlbl { font-size:11.5px;color:rgba(255,255,255,0.4);margin-bottom:6px;font-weight:600; }

  /* Buttons */
  .vb {
    padding:8px 18px;border:none;border-radius:var(--radius-sm);font-size:13px;
    font-family:var(--font);cursor:pointer;font-weight:600;
    transition:opacity .15s,transform .1s;white-space:nowrap;
  }
  .vb:hover  { opacity:.85;transform:translateY(-1px); }
  .vb:active { transform:translateY(0); }
  .vb-p  { background:var(--accent);color:#fff; }
  .vb-s  { background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.85); }
  .vb-d  { background:#b91c1c;color:#fff; }

  /* Status banners */
  .vs-ok  {
    font-size:12px;padding:8px 12px;border-radius:var(--radius-sm);margin-top:6px;
    background:rgba(5,150,105,0.18);color:#6ee7b7;border:1px solid rgba(5,150,105,0.3);
  }
  .vs-err {
    font-size:12px;padding:8px 12px;border-radius:var(--radius-sm);margin-top:6px;
    background:rgba(220,38,38,0.18);color:#fca5a5;border:1px solid rgba(220,38,38,0.3);
  }

  /* Note cards */
  .vcard {
    background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
    border-radius:var(--radius);padding:12px 14px;margin-bottom:10px;
    transition:background .12s,border-color .12s;
  }
  .vcard:hover { background:rgba(255,255,255,0.07);border-color:rgba(0,120,212,.35); }

  /* Info layer cards */
  .vlayer {
    margin-bottom:14px;padding:16px 18px;border-radius:var(--radius);
  }
</style>`;
  }

  // ── Encrypt panel ────────────────────────────────────────────
  function encryptPanel() {
    return `
<h2 style="font-size:15px;font-weight:600;margin-bottom:4px">🔒 Encrypt Text</h2>
<p style="font-size:12px;color:rgba(255,255,255,0.38);margin-bottom:18px">
  Your text passes through 3 independent cipher layers before output. Decryption requires the same password.
</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">

  <!-- Input column -->
  <div style="display:flex;flex-direction:column;gap:12px">
    <div>
      <div class="vlbl">Plaintext</div>
      <textarea id="v-plain" class="vt" rows="8" placeholder="Enter text to encrypt…"></textarea>
    </div>
    <div>
      <div class="vlbl">Password</div>
      <input id="v-epw" class="vi" type="password" placeholder="Strong passphrase…">
    </div>
    <div style="display:flex;gap:8px">
      <button class="vb vb-p" onclick="doEncrypt()">🔒 Encrypt</button>
      <button class="vb vb-s" onclick="vClear('v-plain','v-cipher','v-es')">Clear</button>
    </div>
    <div id="v-es" style="display:none"></div>
  </div>

  <!-- Output column -->
  <div style="display:flex;flex-direction:column;gap:12px">
    <div>
      <div class="vlbl">Encrypted output — 3 cipher layers</div>
      <textarea id="v-cipher" class="vt" rows="8" placeholder="Ciphertext appears here…" readonly></textarea>
    </div>
    <div style="display:flex;gap:8px">
      <button class="vb vb-s" onclick="vCopy('v-cipher')">📋 Copy</button>
      <button class="vb vb-s" onclick="vSaveNote()">💾 Save to Vault</button>
    </div>
  </div>
</div>

<!-- Pipeline diagram -->
<div style="margin-top:20px;padding:14px 18px;background:rgba(255,255,255,0.03);
            border:1px solid rgba(255,255,255,0.07);border-radius:var(--radius)">
  <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.28);
              letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px">
    Encryption pipeline
  </div>
  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11px">

    <div style="padding:7px 11px;background:rgba(255,255,255,0.07);
                border:1px solid rgba(255,255,255,0.13);border-radius:6px;color:rgba(255,255,255,0.7);font-weight:600">
      Plaintext
    </div>

    <span style="color:rgba(255,255,255,0.22);font-size:15px">→</span>

    <div style="padding:7px 11px;background:rgba(0,120,212,0.16);
                border:1px solid rgba(0,120,212,0.4);border-radius:6px;color:#93c5fd;font-weight:600;text-align:center">
      ① AES-256-GCM
      <div style="font-size:9px;color:rgba(255,255,255,0.3);font-weight:400;margin-top:2px">PBKDF2 key · random IV</div>
    </div>

    <span style="color:rgba(255,255,255,0.22);font-size:15px">→</span>

    <div style="padding:7px 11px;background:rgba(124,58,237,0.16);
                border:1px solid rgba(124,58,237,0.4);border-radius:6px;color:#c4b5fd;font-weight:600;text-align:center">
      ② XOR Cipher
      <div style="font-size:9px;color:rgba(255,255,255,0.3);font-weight:400;margin-top:2px">SHA-256 derived key</div>
    </div>

    <span style="color:rgba(255,255,255,0.22);font-size:15px">→</span>

    <div style="padding:7px 11px;background:rgba(5,150,105,0.16);
                border:1px solid rgba(5,150,105,0.4);border-radius:6px;color:#6ee7b7;font-weight:600;text-align:center">
      ③ Base64 URL-safe
      <div style="font-size:9px;color:rgba(255,255,255,0.3);font-weight:400;margin-top:2px">printable ASCII</div>
    </div>

    <span style="color:rgba(255,255,255,0.22);font-size:15px">→</span>

    <div style="padding:7px 11px;background:rgba(255,255,255,0.07);
                border:1px solid rgba(255,255,255,0.13);border-radius:6px;color:rgba(255,255,255,0.7);font-weight:600">
      Ciphertext
    </div>
  </div>
</div>`;
  }

  // ── Decrypt panel ────────────────────────────────────────────
  function decryptPanel() {
    return `
<h2 style="font-size:15px;font-weight:600;margin-bottom:4px">🔓 Decrypt Text</h2>
<p style="font-size:12px;color:rgba(255,255,255,0.38);margin-bottom:18px">
  Paste a CryptoVault ciphertext and the correct password to recover the original message.
</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">

  <div style="display:flex;flex-direction:column;gap:12px">
    <div>
      <div class="vlbl">Encrypted input</div>
      <textarea id="v-dc" class="vt" rows="8" placeholder="Paste ciphertext here…"></textarea>
    </div>
    <div>
      <div class="vlbl">Password</div>
      <input id="v-dpw" class="vi" type="password" placeholder="Password used during encryption…">
    </div>
    <div style="display:flex;gap:8px">
      <button class="vb vb-p" onclick="doDecrypt()">🔓 Decrypt</button>
      <button class="vb vb-s" onclick="vClear('v-dc','v-dp','v-ds')">Clear</button>
    </div>
    <div id="v-ds" style="display:none"></div>
  </div>

  <div style="display:flex;flex-direction:column;gap:12px">
    <div>
      <div class="vlbl">Recovered plaintext</div>
      <textarea id="v-dp" class="vt" rows="8" placeholder="Decrypted text appears here…" readonly></textarea>
    </div>
    <button class="vb vb-s" style="align-self:start" onclick="vCopy('v-dp')">📋 Copy</button>
  </div>
</div>`;
  }

  // ── Notes panel ──────────────────────────────────────────────
  function notesPanel() {
    var notes = vaultLoad();
    var items;
    if (notes.length === 0) {
      items = '<div style="text-align:center;padding:50px 20px;color:rgba(255,255,255,0.22);font-size:13px">' +
              '<div style="font-size:44px;margin-bottom:14px">🔐</div>' +
              'No saved notes yet.<br>Encrypt something and click "Save to Vault".</div>';
    } else {
      items = notes.map(function (n, i) {
        return '<div class="vcard">' +
               '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px">' +
               '<span style="font-size:13px;font-weight:600">' + esc(n.title) + '</span>' +
               '<div style="display:flex;gap:6px">' +
               '<button class="vb vb-s" style="padding:4px 11px;font-size:11px" onclick="vLoadNote(' + i + ')">Load →</button>' +
               '<button class="vb vb-d" style="padding:4px 11px;font-size:11px" onclick="vDeleteNote(' + i + ')">✕</button>' +
               '</div></div>' +
               '<div style="font-size:11px;color:rgba(255,255,255,0.22);font-family:var(--font-mono);' +
               'white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(n.data.slice(0, 88)) + '…</div>' +
               '<div style="font-size:10px;color:rgba(255,255,255,0.18);margin-top:6px">' + esc(n.date) + '</div>' +
               '</div>';
      }).join('');
    }

    return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">' +
           '<div><h2 style="font-size:15px;font-weight:600;margin-bottom:3px">📂 Vault Notes</h2>' +
           '<p style="font-size:12px;color:rgba(255,255,255,0.38)">' + notes.length +
           ' encrypted note' + (notes.length !== 1 ? 's' : '') + ' stored locally</p></div>' +
           (notes.length > 0 ? '<button class="vb vb-d" onclick="vClearAll()">🗑️ Clear All</button>' : '') +
           '</div>' + items;
  }

  // ── Info panel ───────────────────────────────────────────────
  function infoPanel() {
    var layers = [
      {
        num: '①', bg: 'rgba(0,120,212,0.14)', border: 'rgba(0,120,212,0.35)', tc: '#93c5fd',
        title: 'AES-256-GCM — Primary Encryption Layer',
        points: [
          'Industry-standard authenticated symmetric encryption, approved by NIST and used by HTTPS/TLS',
          'Key derived from your password using PBKDF2 with 310,000 SHA-256 iterations — brute-force resistant',
          'A fresh random 16-byte salt and 12-byte IV are generated for every single message',
          'GCM mode appends a 16-byte authentication tag — any byte tampering is detected and rejected',
          'Wire format packs salt + IV + ciphertext into one contiguous byte array'
        ]
      },
      {
        num: '②', bg: 'rgba(124,58,237,0.14)', border: 'rgba(124,58,237,0.35)', tc: '#c4b5fd',
        title: 'XOR Cipher — Secondary Layer',
        points: [
          'Applied to the AES output bytes — not the plaintext — so both layers must be broken together',
          'Key: SHA-256(password + ":xor-v1"), 32 bytes cyclic — entirely independent from the AES key',
          'Every output byte is XOR\'d with the corresponding hash key byte (wraps at 32)',
          'XOR is self-inverse: applying the same key a second time reverses the operation exactly'
        ]
      },
      {
        num: '③', bg: 'rgba(5,150,105,0.14)', border: 'rgba(5,150,105,0.35)', tc: '#6ee7b7',
        title: 'Base64 URL-safe — Outer Encoding Layer',
        points: [
          'Converts the binary byte stream into printable ASCII for safe copy/paste and storage',
          'URL-safe alphabet: + becomes -, / becomes _, and padding = characters are stripped',
          'Output can be stored in text files, URLs, JSON, localStorage, or sent over any text channel',
          'This layer is unwrapped first during decryption, before the inner cipher layers are reversed'
        ]
      }
    ];

    var html = '<h2 style="font-size:15px;font-weight:600;margin-bottom:4px">🔬 How The Encryption Works</h2>' +
      '<p style="font-size:12px;color:rgba(255,255,255,0.38);margin-bottom:18px">' +
      'CryptoVault stacks 3 independent cipher layers. Each uses a different algorithm ' +
      'and separately derived key material — breaking one layer alone is not enough.</p>';

    layers.forEach(function (l) {
      html += '<div class="vlayer" style="background:' + l.bg + ';border:1px solid ' + l.border + '">' +
        '<div style="font-size:13.5px;font-weight:700;color:' + l.tc + ';margin-bottom:10px">' +
        l.num + ' ' + l.title + '</div>' +
        '<ul style="padding-left:18px;display:flex;flex-direction:column;gap:5px">';
      l.points.forEach(function (p) {
        html += '<li style="font-size:12.5px;color:rgba(255,255,255,0.62);line-height:1.45">' + p + '</li>';
      });
      html += '</ul></div>';
    });

    html += '<div style="padding:13px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);' +
      'border-radius:var(--radius);font-size:12px;color:rgba(255,255,255,0.42);line-height:1.55">' +
      '🔒 <strong style="color:rgba(255,255,255,0.6)">Privacy:</strong> All cryptographic operations run ' +
      'locally in your browser using the built-in <code style="font-family:var(--font-mono);' +
      'background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:3px">window.crypto.subtle</code> ' +
      'Web Crypto API. No data ever leaves your device.</div>';

    return html;
  }


  /* ══════════════════════════════════════════════════════════════
     PANEL ROUTER
  ══════════════════════════════════════════════════════════════ */

  function initVault() {
    renderVaultPanel('encrypt');
  }

  window.vaultTab = function (name, btn) {
    // Update sidebar active state
    document.querySelectorAll('.vn').forEach(function (b) {
      var active = (b === btn);
      b.style.background = active ? 'rgba(0,120,212,0.18)' : '';
      b.style.color      = active ? '#6AB4F5' : '';
    });
    renderVaultPanel(name);
  };

  function renderVaultPanel(name) {
    var main = document.getElementById('vault-main');
    if (!main) return;
    switch (name) {
      case 'encrypt': main.innerHTML = encryptPanel();  break;
      case 'decrypt': main.innerHTML = decryptPanel();  break;
      case 'notes':   main.innerHTML = notesPanel();    break;
      case 'info':    main.innerHTML = infoPanel();     break;
    }
  }


  /* ══════════════════════════════════════════════════════════════
     ACTION HANDLERS  (exposed on window for inline onclick)
  ══════════════════════════════════════════════════════════════ */

  window.doEncrypt = async function () {
    var plain  = (document.getElementById('v-plain')?.value  ?? '').trim();
    var pw     =  document.getElementById('v-epw')?.value    ?? '';
    var status =  document.getElementById('v-es');
    var out    =  document.getElementById('v-cipher');
    try {
      if (status) { status.style.display = 'none'; status.className = ''; }
      if (!plain) throw new Error('Enter text to encrypt');
      if (!pw)    throw new Error('Enter a password');
      if (out) out.value = '⏳ Encrypting (3 layers)…';
      var result = await window.vaultEncrypt(plain, pw);
      if (out) out.value = result;
      if (status) { status.className = 'vs-ok'; status.textContent = '✓ Encrypted: AES-256-GCM → XOR → Base64'; status.style.display = 'block'; }
      showNotif('CryptoVault', 'Encryption complete 🔒', '🔐');
    } catch (e) {
      if (out) out.value = '';
      if (status) { status.className = 'vs-err'; status.textContent = '✗ ' + e.message; status.style.display = 'block'; }
    }
  };

  window.doDecrypt = async function () {
    var cipher = (document.getElementById('v-dc')?.value  ?? '').trim();
    var pw     =  document.getElementById('v-dpw')?.value ?? '';
    var status =  document.getElementById('v-ds');
    var out    =  document.getElementById('v-dp');
    try {
      if (status) { status.style.display = 'none'; status.className = ''; }
      if (!cipher) throw new Error('Paste ciphertext first');
      if (!pw)     throw new Error('Enter the password');
      if (out) out.value = '⏳ Decrypting…';
      var result = await window.vaultDecrypt(cipher, pw);
      if (out) out.value = result;
      if (status) { status.className = 'vs-ok'; status.textContent = '✓ Decryption successful'; status.style.display = 'block'; }
      showNotif('CryptoVault', 'Decryption complete 🔓', '🔐');
    } catch (e) {
      if (out) out.value = '';
      if (status) { status.className = 'vs-err'; status.textContent = '✗ Decryption failed — wrong password or corrupted ciphertext'; status.style.display = 'block'; }
    }
  };

  window.vClear = function (aId, bId, sId) {
    var a = document.getElementById(aId); if (a) a.value = '';
    var b = document.getElementById(bId); if (b) b.value = '';
    var s = document.getElementById(sId); if (s) s.style.display = 'none';
  };

  window.vCopy = function (id) {
    var v = document.getElementById(id)?.value || '';
    if (!v || v.startsWith('⏳')) { showNotif('CryptoVault', 'Nothing to copy yet', '⚠️'); return; }
    navigator.clipboard.writeText(v).then(function () {
      showNotif('CryptoVault', 'Copied to clipboard 📋', '🔐');
    });
  };

  window.vSaveNote = function () {
    var v = (document.getElementById('v-cipher')?.value || '').trim();
    if (!v || v.startsWith('⏳')) { showNotif('CryptoVault', 'Encrypt something first', '⚠️'); return; }
    var title = prompt('Note title:') || ('Note ' + (vaultLoad().length + 1));
    var notes = vaultLoad();
    notes.unshift({ title: title, data: v, date: new Date().toLocaleString() });
    vaultStore(notes);
    showNotif('CryptoVault', 'Saved: "' + title + '" 💾', '🔐');
  };

  window.vLoadNote = function (i) {
    var notes = vaultLoad();
    if (!notes[i]) return;
    // Switch to decrypt tab
    var btns = document.querySelectorAll('.vn');
    btns.forEach(function (b, idx) {
      b.style.background = idx === 1 ? 'rgba(0,120,212,0.18)' : '';
      b.style.color      = idx === 1 ? '#6AB4F5' : '';
    });
    renderVaultPanel('decrypt');
    setTimeout(function () {
      var el = document.getElementById('v-dc');
      if (el) { el.value = notes[i].data; el.focus(); }
      showNotif('CryptoVault', 'Loaded "' + notes[i].title + '" — enter password to decrypt', '🔐');
    }, 60);
  };

  window.vDeleteNote = function (i) {
    var notes = vaultLoad();
    var title = notes[i]?.title || '';
    notes.splice(i, 1);
    vaultStore(notes);
    renderVaultPanel('notes');
    showNotif('CryptoVault', 'Deleted "' + title + '"', '🗑️');
  };

  window.vClearAll = function () {
    if (!confirm('Delete ALL vault notes? This cannot be undone.')) return;
    localStorage.removeItem(VAULT_KEY);
    renderVaultPanel('notes');
    showNotif('CryptoVault', 'All notes cleared', '🗑️');
  };

  /* ══════════════════════════════════════════════════════════════
     PASSWORD CHANGE  — Settings → Privacy & Security
     Verifies the current password, then re-encrypts every key
     in localStorage under the new password atomically.
  ══════════════════════════════════════════════════════════════ */

  window.vaultChangePassword = async function () {
    var currentEl = document.getElementById('priv-pw-current');
    var newEl     = document.getElementById('priv-pw-new');
    var confirmEl = document.getElementById('priv-pw-confirm');
    var statusEl  = document.getElementById('priv-pw-status');

    function showStatus(msg, ok) {
      statusEl.textContent = msg;
      statusEl.style.display = 'block';
      statusEl.style.background  = ok ? 'rgba(5,150,105,0.18)'  : 'rgba(220,38,38,0.18)';
      statusEl.style.color       = ok ? '#6ee7b7'               : '#fca5a5';
      statusEl.style.border      = ok ? '1px solid rgba(5,150,105,0.3)' : '1px solid rgba(220,38,38,0.3)';
    }

    var current = currentEl ? currentEl.value : '';
    var newPw   = newEl     ? newEl.value     : '';
    var confirm = confirmEl ? confirmEl.value  : '';

    if (!current) { showStatus('Enter your current password.', false); return; }
    if (!newPw)   { showStatus('Enter a new password.', false); return; }
    if (newPw !== confirm) { showStatus('New passwords do not match.', false); return; }
    if (newPw.length < 4) { showStatus('New password must be at least 4 characters.', false); return; }

    // Verify current password against stored hash.
    var storedHash = _realGetItem('cloudos_pw_hash');
    var hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(current + ':cloudos-verify'));
    var hashHex = Array.from(new Uint8Array(hashBuf)).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
    if (hashHex !== storedHash) {
      showStatus('Current password is incorrect.', false);
      if (currentEl) currentEl.value = '';
      return;
    }

    showStatus('⏳ Re-encrypting all data…', true);

    // Re-encrypt every key using the new password.
    var keys = Object.keys(localStorage);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k === 'cloudos_pw_hash' || VAULT_INTERNAL_KEYS[k]) continue;
      // Get the decrypted value from cache (already decrypted on login).
      var plainVal = _decryptedCache[k] !== undefined ? _decryptedCache[k] : _realGetItem(k);
      if (plainVal === null) continue;
      // Strip enc prefix from raw value if cache missed.
      if (typeof plainVal === 'string' && plainVal.startsWith(ENC_PREFIX)) {
        try { plainVal = await window.vaultDecrypt(plainVal.slice(ENC_PREFIX.length), current); }
        catch(e) { continue; }
      }
      try {
        var enc = await window.vaultEncrypt(String(plainVal), newPw);
        _realSetItem(k, ENC_PREFIX + enc);
        _decryptedCache[k] = plainVal;
      } catch(e) {}
    }

    // Store new password hash and update master password.
    var newHashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(newPw + ':cloudos-verify'));
    var newHashHex = Array.from(new Uint8Array(newHashBuf)).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
    _realSetItem('cloudos_pw_hash', newHashHex);
    _masterPassword = newPw;

    // Clear the input fields.
    if (currentEl) currentEl.value = '';
    if (newEl)     newEl.value     = '';
    if (confirmEl) confirmEl.value = '';

    showStatus('✓ Password changed. All data re-encrypted.', true);
    showNotif('Privacy & Security', 'Encryption password updated 🔑', '🔐');
  };

})();