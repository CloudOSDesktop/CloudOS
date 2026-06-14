/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         CloudOS 11 — Custom Game Icon Library                ║
 * ║  Provides cohesive flat-tile SVG icons for the Games app,    ║
 * ║  replacing emoji glyphs with a consistent "app tile" style.  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
(function () {
  'use strict';

  /* ── Game library / sidebar icons ─────────────────────────────
     Each entry: bg = CSS background (gradient), svg = glyph only
     (no background rect), drawn on a 48x48 viewBox in light colors
     so it pops against the tile background.
  ──────────────────────────────────────────────────────────────── */
  const GAME_ICONS = {

    snake: {
      bg: 'linear-gradient(135deg,#4ADE80,#0B6E36)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 35c-3.5 0-6-2.7-6-6.2 0-3.4 2.6-6.1 6-6.1h6.5c3.9 0 7-3.2 7-7.1 0-3.8-3.1-6.9-7-6.9h-7.8"
              stroke="#EAFBE9" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <circle cx="9.6" cy="8.7" r="3.6" fill="#EAFBE9"/>
        <circle cx="8.7" cy="7.7" r="1" fill="#0B6E36"/>
        <path d="M5.5 8.5 2 6.5M5.5 9.7 2 11" stroke="#FCA5A5" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`
    },

    ttt: {
      bg: 'linear-gradient(135deg,#A78BFA,#5B21B6)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#F5F3FF" stroke-width="3" stroke-linecap="round">
          <line x1="18" y1="7" x2="18" y2="41"/>
          <line x1="30" y1="7" x2="30" y2="41"/>
          <line x1="7" y1="18" x2="41" y2="18"/>
          <line x1="7" y1="30" x2="41" y2="30"/>
        </g>
        <g stroke="#FCD34D" stroke-width="3.4" stroke-linecap="round">
          <line x1="10.5" y1="10.5" x2="14.5" y2="14.5"/>
          <line x1="14.5" y1="10.5" x2="10.5" y2="14.5"/>
        </g>
        <circle cx="35.5" cy="35.5" r="4" fill="none" stroke="#67E8F9" stroke-width="3"/>
        <g stroke="#FCD34D" stroke-width="3.4" stroke-linecap="round">
          <line x1="34" y1="10.5" x2="38" y2="14.5"/>
          <line x1="38" y1="10.5" x2="34" y2="14.5"/>
        </g>
      </svg>`
    },

    '2048': {
      bg: 'linear-gradient(135deg,#FBBF77,#C2410C)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5"  y="5"  width="17" height="17" rx="3.5" fill="#FFF7ED"/>
        <rect x="26" y="5"  width="17" height="17" rx="3.5" fill="#FED7AA"/>
        <rect x="5"  y="26" width="17" height="17" rx="3.5" fill="#FDBA74"/>
        <rect x="26" y="26" width="17" height="17" rx="3.5" fill="#FFFFFF"/>
        <text x="13.5" y="19.5" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="13" fill="#9A3412" text-anchor="middle">2</text>
        <text x="34.5" y="19.5" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="13" fill="#9A3412" text-anchor="middle">0</text>
        <text x="13.5" y="40.5" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="13" fill="#9A3412" text-anchor="middle">4</text>
        <text x="34.5" y="40.5" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="13" fill="#9A3412" text-anchor="middle">8</text>
      </svg>`
    },

    ms: {
      bg: 'linear-gradient(135deg,#94A3B8,#1E293B)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#E2E8F0" stroke-width="2.6" stroke-linecap="round" opacity="0.85">
          <line x1="22" y1="32" x2="9"  y2="32"/>
          <line x1="22" y1="32" x2="22" y2="45"/>
          <line x1="22" y1="32" x2="35" y2="45"/>
          <line x1="22" y1="32" x2="35" y2="19"/>
          <line x1="22" y1="32" x2="11.5" y2="21.5"/>
        </g>
        <circle cx="22" cy="22" r="13" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
        <circle cx="17" cy="17" r="3.4" fill="#FFFFFF" opacity="0.3"/>
        <path d="M28 11 35 4" stroke="#CBD5E1" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M35 1l1.6 3.4M37.6 0l1.8 1.8M39.4 3.4 41 5.2" stroke="#FACC15" stroke-width="2" stroke-linecap="round"/>
      </svg>`
    },

    wordle: {
      bg: 'linear-gradient(135deg,#4A4A4D,#1A1A1C)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4"  y="6"  width="12" height="12" rx="2.2" fill="#538D4E"/>
        <rect x="18" y="6"  width="12" height="12" rx="2.2" fill="#3A3A3C" stroke="#565758" stroke-width="1.4"/>
        <rect x="32" y="6"  width="12" height="12" rx="2.2" fill="#B59F3B"/>
        <rect x="4"  y="20" width="12" height="12" rx="2.2" fill="#3A3A3C" stroke="#565758" stroke-width="1.4"/>
        <rect x="18" y="20" width="12" height="12" rx="2.2" fill="#538D4E"/>
        <rect x="32" y="20" width="12" height="12" rx="2.2" fill="#B59F3B"/>
        <rect x="4"  y="34" width="12" height="12" rx="2.2" fill="#538D4E"/>
        <rect x="18" y="34" width="12" height="12" rx="2.2" fill="#538D4E"/>
        <rect x="32" y="34" width="12" height="12" rx="2.2" fill="#3A3A3C" stroke="#565758" stroke-width="1.4"/>
      </svg>`
    },

    tetris: {
      bg: 'linear-gradient(135deg,#4338CA,#1E1B4B)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5"  y="19" width="12" height="12" rx="2" fill="#22D3EE"/>
        <rect x="18" y="19" width="12" height="12" rx="2" fill="#22D3EE"/>
        <rect x="31" y="19" width="12" height="12" rx="2" fill="#22D3EE"/>
        <rect x="18" y="6"  width="12" height="12" rx="2" fill="#22D3EE" opacity="0.55"/>
        <rect x="5"  y="32" width="12" height="12" rx="2" fill="#FB923C"/>
        <rect x="18" y="32" width="12" height="12" rx="2" fill="#FB923C"/>
        <rect x="31" y="32" width="12" height="12" rx="2" fill="#A78BFA"/>
        <rect x="31" y="6"  width="12" height="12" rx="2" fill="#A78BFA" opacity="0.55"/>
      </svg>`
    },

    flappy: {
      bg: 'linear-gradient(135deg,#7BD8E4,#1A8A9C)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="22" cy="27" rx="15" ry="12" fill="#FCD34D"/>
        <ellipse cx="16" cy="31" rx="9" ry="6.5" fill="#FBBF24"/>
        <path d="M9 22c4-4 11-4 14-1" stroke="#FDE68A" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        <circle cx="30" cy="20" r="4.6" fill="#FFFFFF"/>
        <circle cx="31.6" cy="19" r="2" fill="#27272A"/>
        <path d="M35 25 44 22 35 30Z" fill="#FB923C"/>
      </svg>`
    },

    pong: {
      bg: 'linear-gradient(135deg,#52525B,#0A0A0C)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="14" width="5.5" height="20" rx="2" fill="#F4F4F5"/>
        <rect x="37.5" y="14" width="5.5" height="20" rx="2" fill="#F4F4F5"/>
        <circle cx="26" cy="16" r="4" fill="#F4F4F5"/>
        <g stroke="#71717A" stroke-width="2" stroke-dasharray="3.5 4.5">
          <line x1="24" y1="4" x2="24" y2="44"/>
        </g>
      </svg>`
    },

    memory: {
      bg: 'linear-gradient(135deg,#C4B5FD,#6D28D9)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="12" width="21" height="29" rx="3" transform="rotate(-13 16.5 26.5)" fill="#4C1D95"/>
        <rect x="19" y="8" width="22" height="30" rx="3" fill="#F5F3FF"/>
        <path d="M30 16.5l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" fill="#FBBF24"/>
      </svg>`
    },

    breakout: {
      bg: 'linear-gradient(135deg,#3F3F66,#0E0E1B)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4"  y="6"  width="12" height="6.5" rx="1.6" fill="#F87171"/>
        <rect x="18" y="6"  width="12" height="6.5" rx="1.6" fill="#FB923C"/>
        <rect x="32" y="6"  width="12" height="6.5" rx="1.6" fill="#FACC15"/>
        <rect x="4"  y="15" width="12" height="6.5" rx="1.6" fill="#4ADE80"/>
        <rect x="18" y="15" width="12" height="6.5" rx="1.6" fill="#38BDF8"/>
        <rect x="32" y="15" width="12" height="6.5" rx="1.6" fill="#4ADE80"/>
        <circle cx="24" cy="31" r="3.2" fill="#FFFFFF"/>
        <rect x="14" y="39" width="20" height="4.5" rx="2.2" fill="#93C5FD"/>
      </svg>`
    },

    sudoku: {
      bg: 'linear-gradient(135deg,#60A5FA,#1E3A8A)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="38" height="38" rx="2.5" fill="none" stroke="#EFF6FF" stroke-width="2.6"/>
        <g stroke="#EFF6FF" stroke-width="1.2" opacity="0.65">
          <line x1="17.7" y1="5" x2="17.7" y2="43"/>
          <line x1="30.3" y1="5" x2="30.3" y2="43"/>
          <line x1="5" y1="17.7" x2="43" y2="17.7"/>
          <line x1="5" y1="30.3" x2="43" y2="30.3"/>
        </g>
        <text x="11.3" y="15.5" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="11" fill="#FDE68A" text-anchor="middle">5</text>
        <text x="36.3" y="28" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="11" fill="#FFFFFF" text-anchor="middle">3</text>
        <text x="24" y="40.5" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="11" fill="#FFFFFF" text-anchor="middle">9</text>
      </svg>`
    },

    pacman: {
      bg: 'linear-gradient(135deg,#2A2A45,#000000)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 6a18 18 0 1 0 15.6 27L25 24z" fill="#FFD400"/>
        <g fill="#FFFFFF">
          <circle cx="35" cy="38.5" r="2"/>
          <circle cx="42" cy="32" r="2"/>
        </g>
        <path d="M6 31c0-4.4 3.4-7.8 7.5-7.8s7.5 3.4 7.5 7.8v3.4H6z" fill="#FF6BCB"/>
        <path d="M6 34.4l2-2 2 2 2-2 2 2 2-2 2 2v.5H6z" fill="#FF6BCB"/>
        <circle cx="9.6" cy="29" r="1.5" fill="#1A1A2E"/>
        <circle cx="14.6" cy="29" r="1.5" fill="#1A1A2E"/>
      </svg>`
    },

    chess: {
      bg: 'linear-gradient(135deg,#A8A29E,#292524)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd">
        <rect x="10" y="7"  width="5" height="6" fill="#FAFAF9"/>
        <rect x="19" y="7"  width="5" height="6" fill="#FAFAF9"/>
        <rect x="28" y="7"  width="5" height="6" fill="#FAFAF9"/>
        <rect x="10" y="12" width="23" height="6" fill="#FAFAF9"/>
        <path d="M13 18h17l3.5 8.5-3.5 5H13l-3.5-5z" fill="#FAFAF9"/>
        <rect x="8.5" y="32" width="26" height="6" rx="1" fill="#FAFAF9"/>
        <rect x="5.5" y="39" width="32" height="5" rx="1.6" fill="#FAFAF9"/>
      </svg>`
    },

    hangman: {
      bg: 'linear-gradient(135deg,#94A3B8,#27303F)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#F1F5F9" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <line x1="10" y1="43" x2="10" y2="5"/>
          <line x1="5" y1="43" x2="22" y2="43"/>
          <line x1="10" y1="5" x2="31" y2="5"/>
          <line x1="31" y1="5" x2="31" y2="11"/>
        </g>
        <circle cx="31" cy="17.5" r="5.2" stroke="#F1F5F9" stroke-width="3.2" fill="none"/>
        <g stroke="#F1F5F9" stroke-width="3.2" stroke-linecap="round">
          <line x1="31" y1="22.7" x2="31" y2="33"/>
          <line x1="31" y1="26" x2="25" y2="30.5"/>
          <line x1="31" y1="26" x2="37" y2="30.5"/>
          <line x1="31" y1="33" x2="26" y2="42"/>
          <line x1="31" y1="33" x2="36" y2="42"/>
        </g>
      </svg>`
    }
  };

  /* ── Memory Match card glyphs ──────────────────────────────────
     Each entry is a self-contained badge: bg = CSS background,
     svg = 0..48 viewBox illustration. Used for card faces and
     the "collected" tray.
  ──────────────────────────────────────────────────────────────── */
  const MEMORY_ICONS = {

    pizza: {
      bg: 'linear-gradient(135deg,#FEF3C7,#EA580C)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 5 45 41H3Z" fill="#F59E0B" stroke="#B45309" stroke-width="2" stroke-linejoin="round"/>
        <path d="M9 35 39 35 24 9Z" fill="#FDE68A"/>
        <circle cx="22" cy="20" r="3.1" fill="#DC2626"/>
        <circle cx="29" cy="27" r="3.1" fill="#DC2626"/>
        <circle cx="18" cy="28" r="3.1" fill="#DC2626"/>
      </svg>`
    },

    guitar: {
      bg: 'linear-gradient(135deg,#FDE68A,#92400E)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20.5" y="2" width="4" height="19" rx="1.4" fill="#3F2611"/>
        <g stroke="#FDE68A" stroke-width="1" opacity="0.85">
          <line x1="21.5" y1="2" x2="21.5" y2="20"/>
          <line x1="24.5" y1="2" x2="24.5" y2="20"/>
        </g>
        <circle cx="23" cy="31" r="14" fill="#D97706"/>
        <circle cx="23" cy="31" r="14" fill="none" stroke="#92400E" stroke-width="1.4"/>
        <circle cx="17.5" cy="27" r="6" fill="#3F2611"/>
        <path d="M23 19a13 13 0 0 0-9 22" fill="none" stroke="#F59E0B" stroke-width="1.6" opacity="0.7"/>
      </svg>`
    },

    rocket: {
      bg: 'linear-gradient(135deg,#93C5FD,#1E3A8A)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 3c7.5 6 9.5 16.5 9.5 24.5 0 3.2-.8 6.2-1.8 8.5h-15.4c-1-2.3-1.8-5.3-1.8-8.5C14.5 19.5 16.5 9 24 3z" fill="#E2E8F0"/>
        <circle cx="24" cy="20" r="4.4" fill="#38BDF8"/>
        <path d="M14.5 23.5c-5.2 1.2-8.5 6.2-8.5 12.5 5.2-1 8.5-4.2 9.6-8.6z" fill="#EF4444"/>
        <path d="M33.5 23.5c5.2 1.2 8.5 6.2 8.5 12.5-5.2-1-8.5-4.2-9.6-8.6z" fill="#EF4444"/>
        <path d="M18.5 36h11l-2.2 6.4c-1 1.4-2.3 2.1-3.3 2.1s-2.3-.7-3.3-2.1z" fill="#CBD5E1"/>
        <path d="M19.5 40c1 3 3 5.4 4.5 6 1.5-.6 3.5-3 4.5-6" fill="#FB923C"/>
      </svg>`
    },

    rainbow: {
      bg: 'linear-gradient(135deg,#DBEAFE,#2563EB)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 41a20 20 0 0 1 40 0" fill="none" stroke="#EF4444" stroke-width="4.4"/>
        <path d="M8.4 41a15.6 15.6 0 0 1 31.2 0" fill="none" stroke="#FACC15" stroke-width="4.4"/>
        <path d="M12.8 41a11.2 11.2 0 0 1 22.4 0" fill="none" stroke="#22C55E" stroke-width="4.4"/>
        <path d="M17.2 41a6.8 6.8 0 0 1 13.6 0" fill="none" stroke="#3B82F6" stroke-width="4.4"/>
        <ellipse cx="9" cy="42" rx="6" ry="3.4" fill="#FFFFFF" opacity="0.9"/>
        <ellipse cx="39" cy="42" rx="6" ry="3.4" fill="#FFFFFF" opacity="0.9"/>
      </svg>`
    },

    dolphin: {
      bg: 'linear-gradient(135deg,#CFFAFE,#0E7490)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 32c5-13 19-23 36-19-2.5 3.5-6 5.8-9.5 6.8 4.5 1.2 8 3.6 10.5 7-7 2.6-14.5 1.2-19-3-2 5-8 9.8-14 11.2 2.2-3.4 3-7 1.6-10.6-2.2 2.6-4 5.6-5.6 7.6z" fill="#38BDF8"/>
        <circle cx="33.5" cy="17.5" r="1.6" fill="#0C4A6E"/>
        <path d="M3 36c4.5-1.2 9-1 12.5 1.2-3.5 2.4-8.5 2.2-12.5-1.2z" fill="#0EA5E9"/>
      </svg>`
    },

    masks: {
      bg: 'linear-gradient(135deg,#FCA5A5,#4C1D95)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 13c0-4.4 4.5-8 10-8s10 3.6 10 8c0 6.5-4.5 11-10 17-5.5-6-10-10.5-10-17z" fill="#F87171"/>
        <path d="M22 23c0-4.4 4.5-8 10-8s10 3.6 10 8c0 6.5-4.5 11-10 17-5.5-6-10-10.5-10-17z" fill="#818CF8"/>
        <g fill="#7F1D1D">
          <circle cx="12.5" cy="12" r="1.7"/><circle cx="20.5" cy="12" r="1.7"/>
        </g>
        <path d="M12.5 18.5c2 2 6.5 2 8.5 0" stroke="#7F1D1D" stroke-width="1.7" fill="none" stroke-linecap="round"/>
        <g fill="#312E81">
          <circle cx="28.5" cy="22" r="1.7"/><circle cx="36.5" cy="22" r="1.7"/>
        </g>
        <path d="M28.5 30.5c2-2 6.5-2 8.5 0" stroke="#312E81" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      </svg>`
    },

    trophy: {
      bg: 'linear-gradient(135deg,#FDE68A,#B45309)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 5h18v11c0 6.6-4 12-9 12s-9-5.4-9-12z" fill="#FBBF24"/>
        <path d="M15 9h-5.5c0 5.6 2.3 10 6.5 11.4" fill="none" stroke="#FBBF24" stroke-width="3.2"/>
        <path d="M33 9h5.5c0 5.6-2.3 10-6.5 11.4" fill="none" stroke="#FBBF24" stroke-width="3.2"/>
        <rect x="21.5" y="27.5" width="5" height="6.5" fill="#FBBF24"/>
        <rect x="15" y="34" width="18" height="4.4" rx="1.4" fill="#F59E0B"/>
        <rect x="11.5" y="38.4" width="25" height="4.6" rx="1.6" fill="#D97706"/>
      </svg>`
    },

    crystal: {
      bg: 'linear-gradient(135deg,#E9D5FF,#5B21B6)',
      svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="21" r="16" fill="#C4B5FD"/>
        <circle cx="24" cy="21" r="16" fill="none" stroke="#A78BFA" stroke-width="1.4"/>
        <ellipse cx="18" cy="14.5" rx="5.5" ry="3.4" fill="#FFFFFF" opacity="0.6"/>
        <rect x="13" y="39" width="22" height="4.6" rx="2" fill="#6D28D9"/>
        <path d="M17 39c0-4 3-6 7-6s7 2 7 6" fill="none" stroke="#6D28D9" stroke-width="3"/>
      </svg>`
    }
  };

  const MEMORY_ORDER = ['pizza','guitar','rocket','rainbow','dolphin','masks','trophy','crystal'];

  /* ── Render helpers ────────────────────────────────────────── */
  function renderGameIcon(id, extraClass) {
    const def = GAME_ICONS[id];
    if (!def) return '';
    return `<div class="game-icon-tile${extraClass ? ' ' + extraClass : ''}" style="background:${def.bg}">${def.svg}</div>`;
  }

  function renderMemoryIcon(id, extraClass) {
    const def = MEMORY_ICONS[id];
    if (!def) return '';
    return `<div class="memory-icon${extraClass ? ' ' + extraClass : ''}" style="background:${def.bg}">${def.svg}</div>`;
  }

  window.GAME_ICONS       = GAME_ICONS;
  window.MEMORY_ICONS     = MEMORY_ICONS;
  window.MEMORY_ORDER     = MEMORY_ORDER;
  window.renderGameIcon   = renderGameIcon;
  window.renderMemoryIcon = renderMemoryIcon;

})();