/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║            CloudVPN — CloudOS 11 Add-on Module              ║
 * ║                                                             ║
 * ║  Features:                                                  ║
 * ║    • Interactive SVG world map with clickable server pins   ║
 * ║    • Connect / Disconnect with animated status ring         ║
 * ║    • 20-server location list with latency indicators        ║
 * ║    • Live download / upload speed stats (simulated)         ║
 * ║    • Kill Switch — blocks traffic overlay when VPN drops    ║
 * ║    • Auto-connect on startup + saves last server            ║
 * ║    • Session data-usage counter                             ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/* ══════════════════════════════════════════════════════════════
   SERVER LIST  (lat/lng used to place pins on SVG map)
   Map SVG viewBox is 0 0 1000 500 (equirectangular projection)
   x = (lng + 180) / 360 * 1000
   y = (90  - lat) / 180 * 500
══════════════════════════════════════════════════════════════ */
const VPN_SERVERS = [
  { id:'us-ny',  flag:'🇺🇸', city:'New York',      country:'United States', ping:12,  lat:40.7,  lng:-74.0  },
  { id:'us-la',  flag:'🇺🇸', city:'Los Angeles',   country:'United States', ping:28,  lat:34.1,  lng:-118.2 },
  { id:'us-ch',  flag:'🇺🇸', city:'Chicago',       country:'United States', ping:19,  lat:41.9,  lng:-87.6  },
  { id:'ca-tor', flag:'🇨🇦', city:'Toronto',       country:'Canada',        ping:21,  lat:43.7,  lng:-79.4  },
  { id:'ca-van', flag:'🇨🇦', city:'Vancouver',     country:'Canada',        ping:33,  lat:49.3,  lng:-123.1 },
  { id:'mx-mex', flag:'🇲🇽', city:'Mexico City',   country:'Mexico',        ping:57,  lat:19.4,  lng:-99.1  },
  { id:'br-sao', flag:'🇧🇷', city:'São Paulo',     country:'Brazil',        ping:143, lat:-23.5, lng:-46.6  },
  { id:'uk-lon', flag:'🇬🇧', city:'London',        country:'United Kingdom',ping:84,  lat:51.5,  lng:-0.1   },
  { id:'fr-par', flag:'🇫🇷', city:'Paris',         country:'France',        ping:97,  lat:48.9,  lng:2.3    },
  { id:'de-fra', flag:'🇩🇪', city:'Frankfurt',     country:'Germany',       ping:92,  lat:50.1,  lng:8.7    },
  { id:'nl-ams', flag:'🇳🇱', city:'Amsterdam',     country:'Netherlands',   ping:89,  lat:52.4,  lng:4.9    },
  { id:'ch-zur', flag:'🇨🇭', city:'Zurich',        country:'Switzerland',   ping:101, lat:47.4,  lng:8.5    },
  { id:'se-sto', flag:'🇸🇪', city:'Stockholm',     country:'Sweden',        ping:108, lat:59.3,  lng:18.1   },
  { id:'no-osl', flag:'🇳🇴', city:'Oslo',          country:'Norway',        ping:112, lat:59.9,  lng:10.7   },
  { id:'za-joh', flag:'🇿🇦', city:'Johannesburg',  country:'South Africa',  ping:198, lat:-26.2, lng:28.0   },
  { id:'ae-dub', flag:'🇦🇪', city:'Dubai',         country:'UAE',           ping:154, lat:25.2,  lng:55.3   },
  { id:'in-mum', flag:'🇮🇳', city:'Mumbai',        country:'India',         ping:189, lat:19.1,  lng:72.9   },
  { id:'sg-sin', flag:'🇸🇬', city:'Singapore',     country:'Singapore',     ping:201, lat:1.4,   lng:103.8  },
  { id:'jp-tok', flag:'🇯🇵', city:'Tokyo',         country:'Japan',         ping:168, lat:35.7,  lng:139.7  },
  { id:'au-syd', flag:'🇦🇺', city:'Sydney',        country:'Australia',     ping:224, lat:-33.9, lng:151.2  },
];

/* ══════════════════════════════════════════════════════════════
   COORDINATE HELPERS  (equirectangular, viewBox 1000×500)
══════════════════════════════════════════════════════════════ */
function lngToX(lng) { return ((lng + 180) / 360) * 1000; }
function latToY(lat) { return ((90 - lat) / 180) * 500;   }

/* ══════════════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════════════ */
const vpnState = {
  connected:     false,
  connecting:    false,
  selectedId:    localStorage.getItem('vpn_server') || 'us-ny',
  killSwitch:    localStorage.getItem('vpn_kill')   === '1',
  autoConnect:   localStorage.getItem('vpn_auto')   === '1',
  sessionDown:   0,
  sessionUp:     0,
  statsInterval: null,
  killSwitchActive: false,   // true when kill switch has cut traffic
  tab:           'map',
};

/* ══════════════════════════════════════════════════════════════
   BUILD APP HTML
══════════════════════════════════════════════════════════════ */
function buildVpnHTML() {
  return `
<div id="vpn-root" style="display:flex;height:100%;background:#080c14;font-family:var(--font,system-ui,sans-serif);overflow:hidden;flex-direction:column;position:relative">

  <!-- ── KILL SWITCH OVERLAY ── -->
  <div id="vpn-ks-overlay" style="
    display:none;position:absolute;inset:0;z-index:200;
    background:rgba(0,0,0,0.88);backdrop-filter:blur(6px);
    flex-direction:column;align-items:center;justify-content:center;gap:16px">
    <div style="font-size:48px">🛑</div>
    <div style="font-size:18px;font-weight:800;color:#F87171;letter-spacing:0.03em">Kill Switch Active</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.5);text-align:center;max-width:300px;line-height:1.6">
      All internet traffic has been blocked because the VPN connection dropped.<br>
      Reconnect to restore access.
    </div>
    <button onclick="vpnConnect(false)" style="
      margin-top:8px;padding:10px 28px;border:none;border-radius:10px;
      background:#0078D4;color:#fff;font-size:14px;font-weight:700;
      cursor:pointer;font-family:inherit">⚡ Reconnect Now</button>
    <button onclick="vpnDeactivateKillSwitch()" style="
      padding:7px 20px;border:1px solid rgba(255,255,255,0.15);border-radius:10px;
      background:transparent;color:rgba(255,255,255,0.5);font-size:12px;
      cursor:pointer;font-family:inherit">Disable Kill Switch & Resume</button>
  </div>

  <!-- ── TOP BAR ── -->
  <div style="display:flex;align-items:center;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0">

    <!-- Status pill -->
    <div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-right:1px solid rgba(255,255,255,0.07);min-width:220px">
      <div id="vpn-ring-wrap" onclick="vpnToggle()" style="position:relative;width:52px;height:52px;cursor:pointer;flex-shrink:0">
        <svg viewBox="0 0 52 52" style="position:absolute;inset:0;width:52px;height:52px;transform:rotate(-90deg)">
          <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="3.5"/>
          <circle id="vpn-ring-arc" cx="26" cy="26" r="22"
            fill="none" stroke="#0078D4" stroke-width="3.5" stroke-linecap="round"
            stroke-dasharray="138.2" stroke-dashoffset="138.2"
            style="transition:stroke-dashoffset 0.7s ease,stroke 0.4s"/>
        </svg>
        <div id="vpn-ring-inner" style="
          position:absolute;inset:7px;border-radius:50%;
          background:rgba(0,120,212,0.14);border:1px solid rgba(0,120,212,0.35);
          display:flex;align-items:center;justify-content:center;font-size:18px;
          transition:background 0.4s,border-color 0.4s">🔒</div>
      </div>
      <div>
        <div id="vpn-status-label" style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.4)">Disconnected</div>
        <div id="vpn-status-sub"   style="font-size:11px;color:rgba(255,255,255,0.28);margin-top:2px;max-width:130px;line-height:1.3">Click shield to connect</div>
        <button id="vpn-connect-btn" onclick="vpnToggle()" style="
          margin-top:7px;padding:5px 16px;border:none;border-radius:7px;
          background:#0078D4;color:#fff;font-size:12px;font-weight:700;
          cursor:pointer;font-family:inherit;transition:background .2s">Connect</button>
      </div>
    </div>

    <!-- Stats -->
    <div style="display:flex;flex:1;align-self:stretch">
      ${[
        ['vpn-stat-down', '↓ Download', '—'],
        ['vpn-stat-up',   '↑ Upload',   '—'],
        ['vpn-stat-ping', 'Ping',        '—'],
        ['vpn-stat-data', 'Session',     '—'],
      ].map(([id, label, val]) => `
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;
                    border-right:1px solid rgba(255,255,255,0.06);padding:8px 6px">
          <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:3px">${label}</div>
          <div id="${id}" style="font-size:16px;font-weight:700;color:rgba(255,255,255,0.18)">—</div>
        </div>`).join('')}
    </div>

    <!-- Settings toggles -->
    <div style="display:flex;flex-direction:column;justify-content:center;gap:8px;padding:12px 18px;border-left:1px solid rgba(255,255,255,0.07)">
      <!-- Kill Switch -->
      <div style="display:flex;align-items:center;gap:8px">
        <div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5);font-weight:600">Kill Switch</div>
          <div id="vpn-ks-status-txt" style="font-size:10px;color:rgba(255,255,255,0.28);margin-top:1px">${vpnState.killSwitch ? 'Blocks traffic if VPN drops' : 'Off'}</div>
        </div>
        <div id="vpn-ks-btn" onclick="vpnToggleKillSwitch()" style="
          width:36px;height:20px;border-radius:10px;cursor:pointer;flex-shrink:0;
          background:${vpnState.killSwitch ? '#DC2626' : 'rgba(255,255,255,0.1)'};
          position:relative;transition:background .2s">
          <div id="vpn-ks-thumb" style="position:absolute;top:2px;left:${vpnState.killSwitch ? '18px' : '2px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s"></div>
        </div>
      </div>
      <!-- Auto-Connect -->
      <div style="display:flex;align-items:center;gap:8px">
        <div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5);font-weight:600">Auto-Connect</div>
          <div id="vpn-ac-status-txt" style="font-size:10px;color:rgba(255,255,255,0.28);margin-top:1px">${vpnState.autoConnect ? 'Saves last server' : 'Off'}</div>
        </div>
        <div id="vpn-ac-btn" onclick="vpnToggleAutoConnect()" style="
          width:36px;height:20px;border-radius:10px;cursor:pointer;flex-shrink:0;
          background:${vpnState.autoConnect ? 'var(--accent,#0078D4)' : 'rgba(255,255,255,0.1)'};
          position:relative;transition:background .2s">
          <div id="vpn-ac-thumb" style="position:absolute;top:2px;left:${vpnState.autoConnect ? '18px' : '2px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── TAB BAR ── -->
  <div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0;padding:0 18px">
    <button id="vpn-tab-map"  onclick="vpnSetTab('map')"  style="padding:9px 18px;background:none;border:none;border-bottom:2px solid var(--accent,#0078D4);color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">🗺️ World Map</button>
    <button id="vpn-tab-list" onclick="vpnSetTab('list')" style="padding:9px 18px;background:none;border:none;border-bottom:2px solid transparent;color:rgba(255,255,255,0.4);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">📋 Server List</button>
  </div>

  <!-- ── CONTENT ── -->
  <div style="flex:1;overflow:hidden;position:relative">

    <!-- MAP TAB -->
    <div id="vpn-tab-map-content" style="position:absolute;inset:0;overflow:hidden;display:flex;flex-direction:column">
      <div style="position:relative;flex:1;overflow:hidden" id="vpn-map-container">
        <!-- SVG map injected by initVpn -->
      </div>
      <!-- Map tooltip -->
      <div id="vpn-map-tooltip" style="
        display:none;position:absolute;pointer-events:none;
        background:rgba(8,12,22,0.97);border:1px solid rgba(255,255,255,0.15);
        border-radius:10px;padding:10px 14px;font-size:12px;color:#fff;z-index:99;
        box-shadow:0 8px 32px rgba(0,0,0,0.7)"></div>
    </div>

    <!-- LIST TAB -->
    <div id="vpn-tab-list-content" style="position:absolute;inset:0;overflow-y:auto;display:none;padding:10px 12px">
      <!-- Search -->
      <div style="padding:0 2px 10px">
        <input id="vpn-search" type="text" placeholder="🔍  Search location…"
          oninput="vpnSearch(this.value)"
          style="width:100%;padding:8px 12px;background:rgba(255,255,255,0.07);
                 border:1px solid rgba(255,255,255,0.1);border-radius:8px;
                 color:#fff;font-size:13px;outline:none;box-sizing:border-box;font-family:inherit">
      </div>
      <div id="vpn-server-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px"></div>
    </div>
  </div>
</div>`;
}

/* ══════════════════════════════════════════════════════════════
   WORLD MAP SVG — detailed Natural Earth-style land paths
   viewBox 0 0 1000 500
══════════════════════════════════════════════════════════════ */
function buildMapSVG() {
  const lands = `
    <!-- North America -->
    <path d="M83,72 L92,58 L108,48 L125,44 L148,45 L165,50 L178,58 L188,70
             L196,84 L200,100 L202,118 L200,134 L194,148 L185,158 L176,168
             L170,180 L164,195 L158,208 L150,218 L140,226 L130,236 L122,248
             L115,258 L108,252 L100,240 L94,225 L88,208 L82,190 L78,172
             L74,154 L72,136 L73,118 L76,100 L79,86 Z" fill="#1a2640"/>
    <!-- Alaska -->
    <path d="M58,50 L72,44 L84,50 L88,62 L80,72 L66,70 L56,62 Z" fill="#1a2640"/>
    <!-- Baja California / Mexico -->
    <path d="M90,195 L100,192 L108,200 L110,218 L104,228 L95,222 L88,210 Z" fill="#1a2640"/>
    <!-- Greenland -->
    <path d="M218,12 L248,8 L268,16 L274,32 L268,50 L252,60 L232,58 L216,46 L210,30 Z" fill="#1a2640"/>
    <!-- Iceland -->
    <path d="M402,42 L414,38 L422,44 L420,54 L408,58 L398,52 Z" fill="#1a2640"/>
    <!-- Central America -->
    <path d="M122,248 L134,246 L144,252 L148,264 L144,278 L136,285 L126,278 L118,266 Z" fill="#1a2640"/>
    <!-- Cuba -->
    <path d="M150,222 L164,218 L170,224 L166,232 L152,234 L146,228 Z" fill="#1a2640"/>
    <!-- South America -->
    <path d="M148,284 L162,278 L178,278 L196,286 L212,300 L224,318 L232,340
             L236,364 L234,390 L228,412 L218,430 L204,442 L188,446 L172,440
             L158,428 L146,410 L138,388 L132,364 L130,338 L132,312 L138,294 Z" fill="#1a2640"/>
    <!-- Caribbean islands -->
    <path d="M166,230 L172,228 L174,234 L168,237 Z" fill="#1a2640"/>
    <path d="M178,234 L184,232 L186,238 L180,240 Z" fill="#1a2640"/>

    <!-- UK & Ireland -->
    <path d="M436,72 L444,66 L452,70 L454,82 L448,90 L438,88 L432,80 Z" fill="#1a2640"/>
    <path d="M424,76 L432,72 L434,82 L428,86 L422,82 Z" fill="#1a2640"/>

    <!-- Western Europe -->
    <path d="M438,88 L458,84 L478,86 L492,94 L502,106 L504,120 L498,132
             L486,138 L470,136 L456,128 L446,116 L440,104 Z" fill="#1a2640"/>
    <!-- Iberian Peninsula -->
    <path d="M428,110 L446,104 L456,110 L458,126 L450,138 L436,142 L424,136
             L416,124 L418,112 Z" fill="#1a2640"/>
    <!-- Scandinavia -->
    <path d="M462,38 L478,28 L494,30 L506,42 L508,58 L502,72 L490,78
             L476,76 L464,66 L456,52 Z" fill="#1a2640"/>
    <!-- Finland -->
    <path d="M506,34 L520,28 L532,34 L536,48 L530,62 L516,68 L504,62 L500,48 Z" fill="#1a2640"/>
    <!-- Italy -->
    <path d="M474,112 L486,108 L496,116 L498,130 L492,144 L482,152
             L476,148 L474,134 L470,120 Z" fill="#1a2640"/>
    <!-- Balkans / Greece -->
    <path d="M498,118 L514,112 L526,118 L528,132 L520,144 L506,148
             L494,142 L492,128 Z" fill="#1a2640"/>

    <!-- Russia / Kazakhstan broad block -->
    <path d="M508,26 L578,18 L650,16 L720,20 L784,28 L830,38 L856,50
             L854,66 L836,76 L806,82 L770,86 L730,88 L690,86 L650,84
             L610,80 L572,74 L540,70 L516,64 L506,50 Z" fill="#1a2640"/>
    <!-- Ukraine / Central Europe spur -->
    <path d="M520,76 L564,72 L590,80 L596,96 L584,108 L558,112 L530,106
             L512,96 Z" fill="#1a2640"/>

    <!-- Turkey -->
    <path d="M530,112 L568,108 L594,114 L602,128 L596,142 L574,148
             L548,144 L530,136 L524,122 Z" fill="#1a2640"/>

    <!-- Middle East / Arabian Peninsula -->
    <path d="M556,140 L592,136 L620,144 L632,162 L630,182 L618,198
             L600,210 L580,214 L562,208 L548,192 L542,172 L544,154 Z" fill="#1a2640"/>
    <!-- Syria/Iraq/Iran -->
    <path d="M576,120 L620,116 L656,122 L672,138 L668,156 L648,164
             L618,162 L594,152 L574,140 Z" fill="#1a2640"/>
    <!-- Iran / Pakistan spur -->
    <path d="M644,130 L692,124 L726,130 L740,146 L736,162 L718,172
             L690,174 L662,166 L644,150 Z" fill="#1a2640"/>

    <!-- Africa -->
    <path d="M452,148 L490,140 L526,142 L556,150 L574,166 L582,186
             L580,210 L572,236 L560,262 L548,286 L534,308 L516,326
             L496,336 L476,334 L456,322 L440,302 L428,278 L422,252
             L420,226 L424,202 L432,178 L440,160 Z" fill="#1a2640"/>
    <!-- Madagascar -->
    <path d="M558,282 L566,274 L574,280 L576,298 L568,310 L558,308
             L552,294 Z" fill="#1a2640"/>

    <!-- Indian subcontinent -->
    <path d="M646,148 L672,144 L694,152 L706,170 L706,192 L696,214
             L680,232 L660,242 L640,240 L622,228 L612,210 L610,190
             L616,170 L630,156 Z" fill="#1a2640"/>
    <!-- Sri Lanka -->
    <path d="M666,244 L672,240 L678,246 L674,256 L664,256 Z" fill="#1a2640"/>

    <!-- Main Asia / Siberia body -->
    <path d="M648,80 L700,76 L744,80 L780,88 L810,100 L830,116
             L832,134 L820,148 L798,158 L768,162 L740,158 L712,148
             L688,134 L668,118 L652,102 L644,88 Z" fill="#1a2640"/>
    <!-- China / Indochina -->
    <path d="M714,128 L756,122 L796,130 L820,148 L828,170 L820,190
             L800,204 L774,210 L748,206 L724,194 L706,178 L702,158
             L706,140 Z" fill="#1a2640"/>
    <!-- Southeast Asia / Indochina -->
    <path d="M756,192 L784,186 L806,194 L812,212 L804,230 L786,238
             L764,234 L748,220 L748,204 Z" fill="#1a2640"/>
    <!-- Korea -->
    <path d="M808,122 L820,118 L828,126 L826,140 L814,146 L804,140
             L802,128 Z" fill="#1a2640"/>
    <!-- Japan main -->
    <path d="M832,106 L846,98 L858,104 L860,118 L850,128 L836,128
             L828,118 Z" fill="#1a2640"/>
    <!-- Japan south -->
    <path d="M820,128 L832,124 L840,132 L836,144 L824,146 L816,138 Z" fill="#1a2640"/>
    <!-- Taiwan -->
    <path d="M818,174 L824,170 L830,176 L826,186 L818,186 Z" fill="#1a2640"/>
    <!-- Philippines -->
    <path d="M812,186 L822,180 L832,186 L832,200 L820,206 L810,200 Z" fill="#1a2640"/>
    <!-- Borneo -->
    <path d="M784,208 L806,202 L824,210 L826,230 L814,242 L796,244
             L778,234 L772,218 Z" fill="#1a2640"/>
    <!-- Sumatra -->
    <path d="M736,216 L762,208 L782,214 L786,230 L772,242 L750,244
             L732,234 L726,222 Z" fill="#1a2640"/>
    <!-- Java -->
    <path d="M756,244 L782,238 L804,244 L806,256 L782,260 L756,256 Z" fill="#1a2640"/>
    <!-- New Guinea -->
    <path d="M840,270 L876,262 L904,268 L910,282 L896,294 L866,296
             L840,288 Z" fill="#1a2640"/>

    <!-- Australia -->
    <path d="M794,298 L836,286 L874,284 L910,292 L936,310 L948,334
             L946,362 L932,388 L908,408 L878,420 L844,422 L812,414
             L786,396 L766,370 L756,342 L756,314 L768,300 Z" fill="#1a2640"/>
    <!-- Tasmania -->
    <path d="M858,426 L870,420 L878,430 L872,442 L858,442 Z" fill="#1a2640"/>
    <!-- New Zealand North -->
    <path d="M952,368 L962,358 L972,366 L968,382 L956,388 L946,380 Z" fill="#1a2640"/>
    <!-- New Zealand South -->
    <path d="M946,388 L958,382 L966,392 L960,410 L946,416 L936,406 Z" fill="#1a2640"/>
  `;

  // Build server pins
  const pins = VPN_SERVERS.map(s => {
    const x = lngToX(s.lng);
    const y = latToY(s.lat);
    const pingColor = s.ping < 50 ? '#4ADE80' : s.ping < 120 ? '#FBBF24' : '#F87171';
    return `
      <g class="vpn-pin" data-id="${s.id}" style="cursor:pointer" transform="translate(${x.toFixed(1)},${y.toFixed(1)})"
         onmouseenter="vpnShowTooltip(event,'${s.id}')"
         onmouseleave="vpnHideTooltip()"
         onclick="vpnSelectServer('${s.id}')">
        <!-- Outer pulse ring -->
        <circle class="vpn-pin-pulse" r="14" fill="none" stroke="${pingColor}" stroke-width="1.5" opacity="0" id="vpn-pulse-${s.id}"/>
        <!-- Halo -->
        <circle r="9" fill="${pingColor}" opacity="0.12" id="vpn-halo-${s.id}"/>
        <!-- Pin dot -->
        <circle id="vpn-dot-${s.id}" r="4.5" fill="${pingColor}" stroke="#080c14" stroke-width="1.5" opacity="0.9"/>
        <!-- Flag label -->
        <text y="-12" text-anchor="middle" font-size="11" style="pointer-events:none;user-select:none" id="vpn-flag-${s.id}" opacity="0">${s.flag}</text>
      </g>`;
  }).join('');

  // Animated arc connection (great-circle approximation via quadratic bezier)
  const connectionArc = `<path id="vpn-conn-arc" d="" fill="none"
    stroke="url(#vpn-arc-grad)" stroke-width="1.5" stroke-dasharray="5 4" opacity="0"
    style="transition:opacity 0.5s"/>`;

  // Home marker (Huntington, NY)
  const hx = lngToX(-73.4).toFixed(1), hy = latToY(40.9).toFixed(1);
  const homeMarker = `
    <g id="vpn-home-marker" transform="translate(${hx},${hy})">
      <circle r="5" fill="#fff" opacity="0.9"/>
      <circle r="9" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
      <text y="-13" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.6)" style="pointer-events:none">YOU</text>
    </g>`;

  // Latitude / longitude grid lines
  const gridLines = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = latToY(lat).toFixed(1);
    gridLines.push(`<line x1="0" y1="${y}" x2="1000" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="0.6"/>`);
  }
  for (let lng = -150; lng <= 180; lng += 30) {
    const x = lngToX(lng).toFixed(1);
    gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="500" stroke="rgba(255,255,255,0.04)" stroke-width="0.6"/>`);
  }

  return `
<svg id="vpn-map-svg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet"
     style="width:100%;height:100%">
  <defs>
    <!-- Ocean gradient -->
    <linearGradient id="vpn-ocean" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#05080f"/>
      <stop offset="50%"  stop-color="#070c18"/>
      <stop offset="100%" stop-color="#05080f"/>
    </linearGradient>
    <!-- Arc gradient -->
    <linearGradient id="vpn-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.6"/>
      <stop offset="50%"  stop-color="#4ADE80" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#4ADE80" stop-opacity="0.4"/>
    </linearGradient>
    <!-- Glow filter -->
    <filter id="vpn-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <!-- Land subtle texture -->
    <filter id="vpn-land-shadow">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Ocean background -->
  <rect width="1000" height="500" fill="url(#vpn-ocean)"/>

  <!-- Subtle scanline texture overlay -->
  <rect width="1000" height="500" fill="none"
    style="background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.008) 3px,rgba(255,255,255,0.008) 4px)"/>

  <!-- Grid lines -->
  ${gridLines.join('\n  ')}

  <!-- Equator & Prime Meridian (brighter) -->
  <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(255,255,255,0.10)" stroke-width="0.8" stroke-dasharray="4 6"/>
  <line x1="500" y1="0" x2="500" y2="500" stroke="rgba(255,255,255,0.08)" stroke-width="0.8" stroke-dasharray="4 6"/>

  <!-- Tropic lines -->
  <line x1="0" y1="${latToY(23.5).toFixed(1)}" x2="1000" y2="${latToY(23.5).toFixed(1)}" stroke="rgba(255,200,80,0.06)" stroke-width="0.6" stroke-dasharray="3 8"/>
  <line x1="0" y1="${latToY(-23.5).toFixed(1)}" x2="1000" y2="${latToY(-23.5).toFixed(1)}" stroke="rgba(255,200,80,0.06)" stroke-width="0.6" stroke-dasharray="3 8"/>

  <!-- Arctic / Antarctic circles -->
  <line x1="0" y1="${latToY(66.5).toFixed(1)}" x2="1000" y2="${latToY(66.5).toFixed(1)}" stroke="rgba(100,180,255,0.05)" stroke-width="0.6" stroke-dasharray="2 10"/>
  <line x1="0" y1="${latToY(-66.5).toFixed(1)}" x2="1000" y2="${latToY(-66.5).toFixed(1)}" stroke="rgba(100,180,255,0.05)" stroke-width="0.6" stroke-dasharray="2 10"/>

  <!-- Land masses -->
  <g filter="url(#vpn-land-shadow)" opacity="1">${lands}</g>
  <!-- Land highlight (top stroke) -->
  <g opacity="0.18" fill="none">
    <path d="M83,72 L92,58 L108,48 L125,44 L148,45 L165,50 L178,58 L188,70 L196,84 L200,100" stroke="#6ea8f0" stroke-width="0.8"/>
  </g>

  <!-- Connection arc -->
  ${connectionArc}

  <!-- Server pins (with glow filter) -->
  <g filter="url(#vpn-glow)">${pins}</g>

  <!-- Home marker -->
  ${homeMarker}
</svg>`;
}

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
function initVpn() {
  setTimeout(() => {
    const container = document.getElementById('vpn-map-container');
    if (container) container.innerHTML = buildMapSVG();

    renderServerList();
    refreshPins();
    applyConnectedState(false);
    injectVpnStyles();

    // Auto-connect: restore last server from localStorage and connect
    if (vpnState.autoConnect) {
      const savedServer = localStorage.getItem('vpn_last_connected');
      if (savedServer && VPN_SERVERS.find(s => s.id === savedServer)) {
        vpnState.selectedId = savedServer;
      }
      setTimeout(() => vpnConnect(true), 800);
    }
  }, 60);
}
window.initVpn = initVpn;

function injectVpnStyles() {
  if (document.getElementById('vpn-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'vpn-keyframes';
  style.textContent = `
    @keyframes vpnPulse {
      0%   { r: 8;  opacity: 0.7; }
      100% { r: 22; opacity: 0; }
    }
    @keyframes vpnDashFlow {
      to { stroke-dashoffset: -18; }
    }
    #vpn-conn-arc[opacity="0.8"] {
      animation: vpnDashFlow 1.2s linear infinite;
    }
    .vpn-pin:hover circle[id^="vpn-halo-"] { opacity: 0.3 !important; }
  `;
  document.head.appendChild(style);
}

/* ══════════════════════════════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════════════════════════════ */
function vpnSetTab(tab) {
  vpnState.tab = tab;
  const mapContent  = document.getElementById('vpn-tab-map-content');
  const listContent = document.getElementById('vpn-tab-list-content');
  const mapBtn      = document.getElementById('vpn-tab-map');
  const listBtn     = document.getElementById('vpn-tab-list');

  if (tab === 'map') {
    if (mapContent)  mapContent.style.display  = 'flex';
    if (listContent) listContent.style.display = 'none';
    if (mapBtn)  { mapBtn.style.borderBottomColor  = 'var(--accent,#0078D4)'; mapBtn.style.color  = '#fff'; }
    if (listBtn) { listBtn.style.borderBottomColor = 'transparent';           listBtn.style.color = 'rgba(255,255,255,0.4)'; }
  } else {
    if (mapContent)  mapContent.style.display  = 'none';
    if (listContent) listContent.style.display = 'block';
    if (listBtn) { listBtn.style.borderBottomColor  = 'var(--accent,#0078D4)'; listBtn.style.color  = '#fff'; }
    if (mapBtn)  { mapBtn.style.borderBottomColor   = 'transparent';           mapBtn.style.color   = 'rgba(255,255,255,0.4)'; }
    renderServerList();
  }
}
window.vpnSetTab = vpnSetTab;

/* ══════════════════════════════════════════════════════════════
   MAP PIN HELPERS
══════════════════════════════════════════════════════════════ */
function refreshPins() {
  VPN_SERVERS.forEach(s => {
    const dot   = document.getElementById('vpn-dot-' + s.id);
    const pulse = document.getElementById('vpn-pulse-' + s.id);
    const flag  = document.getElementById('vpn-flag-' + s.id);
    const halo  = document.getElementById('vpn-halo-' + s.id);
    const pingColor = s.ping < 50 ? '#4ADE80' : s.ping < 120 ? '#FBBF24' : '#F87171';

    if (!dot) return;

    const isSelected  = s.id === vpnState.selectedId;
    const isConnected = vpnState.connected && isSelected;

    dot.setAttribute('r', isSelected ? '6.5' : '4.5');
    dot.setAttribute('fill', isSelected ? '#fff' : pingColor);
    dot.setAttribute('stroke', isSelected ? (isConnected ? '#4ADE80' : '#0078D4') : '#080c14');
    dot.setAttribute('stroke-width', isSelected ? '2.5' : '1.5');

    if (halo) {
      halo.setAttribute('r', isSelected ? '12' : '9');
      halo.setAttribute('fill', isSelected ? (isConnected ? '#4ADE80' : '#0078D4') : pingColor);
      halo.setAttribute('opacity', isSelected ? '0.22' : '0.10');
    }

    if (flag) flag.setAttribute('opacity', isSelected ? '1' : '0');

    if (pulse) {
      if (isConnected) {
        pulse.setAttribute('stroke', '#4ADE80');
        pulse.setAttribute('opacity', '0.6');
        pulse.style.animation = 'vpnPulse 2s ease-out infinite';
      } else if (isSelected) {
        pulse.setAttribute('stroke', '#0078D4');
        pulse.setAttribute('opacity', '0.4');
        pulse.style.animation = 'none';
      } else {
        pulse.setAttribute('opacity', '0');
        pulse.style.animation = 'none';
      }
    }
  });

  updateConnectionArc();
}

function updateConnectionArc() {
  const arc = document.getElementById('vpn-conn-arc');
  if (!arc) return;

  if (!vpnState.connected) { arc.setAttribute('opacity', '0'); return; }

  const s = VPN_SERVERS.find(x => x.id === vpnState.selectedId);
  if (!s) return;

  // Home is Huntington, NY
  const hx = lngToX(-73.4), hy = latToY(40.9);
  const sx  = lngToX(s.lng), sy = latToY(s.lat);

  // Control point — arc upward relative to midpoint
  const mx = (hx + sx) / 2;
  const my = (hy + sy) / 2 - Math.abs(sx - hx) * 0.25 - 30;

  arc.setAttribute('d', `M${hx.toFixed(1)},${hy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${sx.toFixed(1)},${sy.toFixed(1)}`);
  arc.setAttribute('opacity', '0.8');
  arc.setAttribute('stroke-dashoffset', '0');
}

/* ══════════════════════════════════════════════════════════════
   MAP TOOLTIP
══════════════════════════════════════════════════════════════ */
function vpnShowTooltip(e, id) {
  const s = VPN_SERVERS.find(x => x.id === id);
  if (!s) return;
  const tip = document.getElementById('vpn-map-tooltip');
  if (!tip) return;
  const pingColor = s.ping < 50 ? '#4ADE80' : s.ping < 120 ? '#FBBF24' : '#F87171';
  const isConnected = vpnState.connected && s.id === vpnState.selectedId;
  tip.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="font-size:20px">${s.flag}</span>
      <div>
        <div style="font-weight:700;font-size:13px;color:#fff">${s.city}</div>
        <div style="color:rgba(255,255,255,0.45);font-size:11px">${s.country}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;gap:16px;font-size:11px;padding:5px 0;border-top:1px solid rgba(255,255,255,0.08)">
      <span style="color:rgba(255,255,255,0.4)">Latency</span>
      <span style="font-weight:700;color:${pingColor}">${s.ping} ms</span>
    </div>
    ${isConnected
      ? '<div style="margin-top:6px;font-size:11px;color:#4ADE80;font-weight:700">● Connected</div>'
      : id === vpnState.selectedId
        ? '<div style="margin-top:6px;font-size:11px;color:#0078D4;font-weight:600">● Selected — click to connect</div>'
        : '<div style="margin-top:6px;font-size:10px;color:rgba(255,255,255,0.3)">Click to select</div>'
    }
  `;

  const root = document.getElementById('vpn-root');
  const rect = root ? root.getBoundingClientRect() : { left: 0, top: 0, width: 900, height: 580 };
  let tx = e.clientX - rect.left + 16;
  let ty = e.clientY - rect.top  - 12;
  if (tx + 200 > rect.width)  tx -= 220;
  if (ty + 120 > rect.height) ty -= 130;

  tip.style.left    = tx + 'px';
  tip.style.top     = ty + 'px';
  tip.style.display = 'block';
}
window.vpnShowTooltip = vpnShowTooltip;

function vpnHideTooltip() {
  const tip = document.getElementById('vpn-map-tooltip');
  if (tip) tip.style.display = 'none';
}
window.vpnHideTooltip = vpnHideTooltip;

/* ══════════════════════════════════════════════════════════════
   SERVER LIST RENDERER
══════════════════════════════════════════════════════════════ */
function renderServerList() {
  const list = document.getElementById('vpn-server-list');
  if (!list) return;
  const q = (document.getElementById('vpn-search')?.value || '').toLowerCase();
  const filtered = VPN_SERVERS.filter(s =>
    s.city.toLowerCase().includes(q) || s.country.toLowerCase().includes(q)
  );
  list.innerHTML = filtered.map(s => {
    const isActive  = s.id === vpnState.selectedId;
    const isConn    = vpnState.connected && isActive;
    const pingColor = s.ping < 50 ? '#4ADE80' : s.ping < 120 ? '#FBBF24' : '#F87171';
    return `
<div onclick="vpnSelectServer('${s.id}')"
  style="display:flex;align-items:center;gap:10px;padding:10px 12px;
         border-radius:8px;cursor:pointer;
         background:${isActive ? 'rgba(0,120,212,0.18)' : 'rgba(255,255,255,0.03)'};
         border:1px solid ${isActive ? 'rgba(0,120,212,0.4)' : 'rgba(255,255,255,0.06)'};
         transition:background .12s"
  onmouseover="if('${s.id}'!=='${vpnState.selectedId}')this.style.background='rgba(255,255,255,0.07)'"
  onmouseout="if('${s.id}'!=='${vpnState.selectedId}')this.style.background='rgba(255,255,255,0.03)'">
  <span style="font-size:22px;line-height:1">${s.flag}</span>
  <div style="flex:1;min-width:0">
    <div style="font-size:13px;font-weight:${isActive?'700':'500'};color:${isConn?'#4ADE80':isActive?'#6AB4F5':'#e0e0e0'};
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.city}</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.35)">${s.country}</div>
  </div>
  <div style="font-size:12px;font-weight:700;color:${pingColor}">${s.ping}ms</div>
  ${isConn  ? '<div style="width:8px;height:8px;border-radius:50%;background:#4ADE80;flex-shrink:0;box-shadow:0 0 6px #4ADE80"></div>'
  : isActive ? '<div style="width:8px;height:8px;border-radius:50%;background:#0078D4;flex-shrink:0"></div>' : ''}
</div>`;
  }).join('');
}

window.vpnSearch = function(q) { renderServerList(); };

/* ══════════════════════════════════════════════════════════════
   CONNECT / DISCONNECT
══════════════════════════════════════════════════════════════ */
function vpnToggle() {
  if (vpnState.connecting) return;
  // If kill switch overlay is showing — user must use Reconnect button
  if (vpnState.killSwitchActive) return;
  vpnState.connected ? vpnDisconnect() : vpnConnect(false);
}
window.vpnToggle = vpnToggle;

function vpnConnect(silent) {
  if (vpnState.connecting || vpnState.connected) return;
  // Dismiss kill switch if reconnecting
  if (vpnState.killSwitchActive) {
    vpnState.killSwitchActive = false;
    const ov = document.getElementById('vpn-ks-overlay');
    if (ov) ov.style.display = 'none';
  }

  vpnState.connecting = true;
  setStatusLabel('Connecting…', 'Establishing secure tunnel…', '#FBBF24');
  setRingColor('#FBBF24');
  setRingProgress(0.45);
  setBtnStyle('Cancel', '#666');

  setTimeout(() => {
    vpnState.connecting = false;
    vpnState.connected  = true;
    vpnState.sessionDown = 0;
    vpnState.sessionUp   = 0;

    // Save last connected server to localStorage if auto-connect is on
    if (vpnState.autoConnect) {
      localStorage.setItem('vpn_last_connected', vpnState.selectedId);
    }

    applyConnectedState(true);
    startStats();
    refreshPins();

    if (!silent && window.showNotif) {
      const s = VPN_SERVERS.find(x => x.id === vpnState.selectedId);
      window.showNotif('CloudVPN', `Connected — ${s?.city} ${s?.flag}`, '🔒');
    }
  }, 1600 + Math.random() * 600);
}

function vpnDisconnect(triggeredByDrop) {
  const wasConnected = vpnState.connected;
  vpnState.connected  = false;
  vpnState.connecting = false;
  stopStats();

  // Kill switch logic: if the disconnect was unexpected (not user-triggered) AND kill switch is on
  if (triggeredByDrop && vpnState.killSwitch) {
    vpnActivateKillSwitch();
    return; // Don't update normal UI — overlay takes over
  }

  applyConnectedState(false);
  refreshPins();
  if (window.showNotif && wasConnected) window.showNotif('CloudVPN', 'Disconnected', '🔓');
}

function applyConnectedState(on) {
  const inner = document.getElementById('vpn-ring-inner');
  if (on) {
    const s = VPN_SERVERS.find(x => x.id === vpnState.selectedId);
    setStatusLabel('Connected', `${s?.flag || ''} ${s?.city || ''} · ${s?.country || ''}`, '#4ADE80');
    setRingColor('#4ADE80');
    setRingProgress(1);
    if (inner) { inner.style.background = 'rgba(74,222,128,0.18)'; inner.style.borderColor = 'rgba(74,222,128,0.5)'; inner.textContent = '🛡️'; }
    setBtnStyle('Disconnect', '#DC2626');
    setStats(true);
  } else {
    setStatusLabel('Disconnected', 'Click shield to connect', 'rgba(255,255,255,0.35)');
    setRingColor('#0078D4');
    setRingProgress(0);
    if (inner) { inner.style.background = 'rgba(0,120,212,0.14)'; inner.style.borderColor = 'rgba(0,120,212,0.35)'; inner.textContent = '🔒'; }
    setBtnStyle('Connect', '#0078D4');
    setStats(false);
  }
}

function setStatusLabel(main, sub, color) {
  const lbl  = document.getElementById('vpn-status-label');
  const subl = document.getElementById('vpn-status-sub');
  if (lbl)  { lbl.textContent = main; lbl.style.color = color; }
  if (subl) subl.textContent = sub;
}
function setBtnStyle(text, bg) {
  const btn = document.getElementById('vpn-connect-btn');
  if (btn) { btn.textContent = text; btn.style.background = bg; }
}
function setRingColor(color) {
  const arc = document.getElementById('vpn-ring-arc');
  if (arc) arc.style.stroke = color;
}
function setRingProgress(pct) {
  const arc = document.getElementById('vpn-ring-arc');
  if (!arc) return;
  const circ = 2 * Math.PI * 22;
  arc.style.strokeDashoffset = circ * (1 - pct);
}
function setStats(on) {
  ['vpn-stat-down','vpn-stat-up','vpn-stat-ping','vpn-stat-data'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!on) { el.textContent = '—'; el.style.color = 'rgba(255,255,255,0.18)'; }
  });
}

/* ══════════════════════════════════════════════════════════════
   LIVE STATS
══════════════════════════════════════════════════════════════ */
function startStats() {
  const s = VPN_SERVERS.find(x => x.id === vpnState.selectedId) || VPN_SERVERS[0];
  vpnState.statsInterval = setInterval(() => {
    if (!vpnState.connected) { stopStats(); return; }
    const downMbps = +(38 + Math.random() * 55).toFixed(1);
    const upMbps   = +(8  + Math.random() * 22).toFixed(1);
    const ping     = s.ping + Math.floor(Math.random() * 10 - 5);

    vpnState.sessionDown += downMbps * 1e6 / 8 * 2;
    vpnState.sessionUp   += upMbps   * 1e6 / 8 * 2;

    const downEl = document.getElementById('vpn-stat-down');
    const upEl   = document.getElementById('vpn-stat-up');
    const pingEl = document.getElementById('vpn-stat-ping');
    const dataEl = document.getElementById('vpn-stat-data');
    if (downEl) { downEl.textContent = downMbps + ' Mbps'; downEl.style.color = '#4ADE80'; }
    if (upEl)   { upEl.textContent   = upMbps   + ' Mbps'; upEl.style.color   = '#38BDF8'; }
    if (pingEl) { pingEl.textContent = ping + ' ms'; pingEl.style.color = ping < 50 ? '#4ADE80' : ping < 120 ? '#FBBF24' : '#F87171'; }
    if (dataEl) {
      const mb = (vpnState.sessionDown + vpnState.sessionUp) / 1e6;
      dataEl.textContent = mb < 1000 ? mb.toFixed(1)+' MB' : (mb/1000).toFixed(2)+' GB';
      dataEl.style.color = '#C4B5FD';
    }
  }, 2000);
}
function stopStats() {
  if (vpnState.statsInterval) { clearInterval(vpnState.statsInterval); vpnState.statsInterval = null; }
}

/* ══════════════════════════════════════════════════════════════
   SERVER SELECTION
══════════════════════════════════════════════════════════════ */
function vpnSelectServer(id) {
  const wasConnected = vpnState.connected;
  if (wasConnected) {
    // Disconnect without triggering kill switch (user action)
    vpnState.connected  = false;
    vpnState.connecting = false;
    stopStats();
    applyConnectedState(false);
    refreshPins();
  }
  vpnState.selectedId = id;
  localStorage.setItem('vpn_server', id);
  refreshPins();
  renderServerList();
  if (wasConnected) {
    setTimeout(() => vpnConnect(false), 500);
  } else if (window.showNotif) {
    const s = VPN_SERVERS.find(x => x.id === id);
    window.showNotif('CloudVPN', `Server: ${s?.city} ${s?.flag}`, '🔒');
  }
}
window.vpnSelectServer = vpnSelectServer;

/* ══════════════════════════════════════════════════════════════
   KILL SWITCH
   When enabled: if VPN drops unexpectedly, show full-screen
   overlay blocking access and halt all stats/traffic simulation.
   User must reconnect or explicitly disable kill switch.
══════════════════════════════════════════════════════════════ */
function vpnToggleKillSwitch() {
  vpnState.killSwitch = !vpnState.killSwitch;
  localStorage.setItem('vpn_kill', vpnState.killSwitch ? '1' : '0');

  const btn    = document.getElementById('vpn-ks-btn');
  const thumb  = document.getElementById('vpn-ks-thumb');
  const txt    = document.getElementById('vpn-ks-status-txt');

  if (btn)   btn.style.background = vpnState.killSwitch ? '#DC2626' : 'rgba(255,255,255,0.1)';
  if (thumb) thumb.style.left     = vpnState.killSwitch ? '18px' : '2px';
  if (txt)   txt.textContent      = vpnState.killSwitch ? 'Blocks traffic if VPN drops' : 'Off';

  // If we turned it off while the overlay was active, dismiss overlay
  if (!vpnState.killSwitch && vpnState.killSwitchActive) {
    vpnDeactivateKillSwitch();
  }

  if (window.showNotif) {
    window.showNotif('CloudVPN',
      vpnState.killSwitch ? 'Kill Switch enabled — traffic blocked on drop 🛡️' : 'Kill Switch disabled',
      '🔒');
  }
}
window.vpnToggleKillSwitch = vpnToggleKillSwitch;

function vpnActivateKillSwitch() {
  vpnState.killSwitchActive = true;
  const ov = document.getElementById('vpn-ks-overlay');
  if (ov) ov.style.display = 'flex';
  // Update status bar to reflect blocked state
  setStatusLabel('Kill Switch Active', 'All traffic blocked', '#F87171');
  setRingColor('#F87171');
  setRingProgress(0);
  const inner = document.getElementById('vpn-ring-inner');
  if (inner) { inner.style.background = 'rgba(248,113,113,0.18)'; inner.style.borderColor = 'rgba(248,113,113,0.5)'; inner.textContent = '🛑'; }
  setBtnStyle('Reconnect', '#DC2626');
  if (window.showNotif) window.showNotif('CloudVPN', 'Kill Switch activated — traffic blocked!', '🛑');
}

function vpnDeactivateKillSwitch() {
  vpnState.killSwitchActive = false;
  // Also turn off the toggle
  vpnState.killSwitch = false;
  localStorage.setItem('vpn_kill', '0');
  const btn   = document.getElementById('vpn-ks-btn');
  const thumb = document.getElementById('vpn-ks-thumb');
  const txt   = document.getElementById('vpn-ks-status-txt');
  if (btn)   btn.style.background = 'rgba(255,255,255,0.1)';
  if (thumb) thumb.style.left     = '2px';
  if (txt)   txt.textContent      = 'Off';
  const ov = document.getElementById('vpn-ks-overlay');
  if (ov) ov.style.display = 'none';
  applyConnectedState(false);
  refreshPins();
}
window.vpnDeactivateKillSwitch = vpnDeactivateKillSwitch;

// Expose a way to simulate a drop (for testing: call vpnSimulateDrop() in console)
window.vpnSimulateDrop = function() {
  if (vpnState.connected) {
    stopStats();
    vpnState.connected = false;
    vpnDisconnect(true); // true = triggered by drop
  }
};

/* ══════════════════════════════════════════════════════════════
   AUTO-CONNECT
   When on: saves the last connected server to localStorage.
   On next load, initVpn() reads vpn_last_connected and connects.
══════════════════════════════════════════════════════════════ */
function vpnToggleAutoConnect() {
  vpnState.autoConnect = !vpnState.autoConnect;
  localStorage.setItem('vpn_auto', vpnState.autoConnect ? '1' : '0');

  const btn   = document.getElementById('vpn-ac-btn');
  const thumb = document.getElementById('vpn-ac-thumb');
  const txt   = document.getElementById('vpn-ac-status-txt');

  if (btn)   btn.style.background = vpnState.autoConnect ? 'var(--accent,#0078D4)' : 'rgba(255,255,255,0.1)';
  if (thumb) thumb.style.left     = vpnState.autoConnect ? '18px' : '2px';
  if (txt)   txt.textContent      = vpnState.autoConnect ? 'Saves last server' : 'Off';

  // If auto-connect just turned off, clear the saved server
  if (!vpnState.autoConnect) {
    localStorage.removeItem('vpn_last_connected');
  }

  // If auto-connect turned on and we're already connected, save current server
  if (vpnState.autoConnect && vpnState.connected) {
    localStorage.setItem('vpn_last_connected', vpnState.selectedId);
  }

  if (window.showNotif) {
    window.showNotif('CloudVPN',
      vpnState.autoConnect ? 'Auto-Connect on — last server will be saved' : 'Auto-Connect off',
      '🔒');
  }
}
window.vpnToggleAutoConnect = vpnToggleAutoConnect;