/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         CloudOS 11 — Games Pack 2                           ║
 * ║  Wordle, Tetris, Flappy Bird, Pong, Memory Match,           ║
 * ║  Breakout, Sudoku, Pac-Man, Crossword, Chess, Hangman       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
(function () {
  'use strict';

  /* ── Patch games sidebar + library + router ─────────────────── */
  const _origBuildGamesHTML = window.buildGamesHTML;
  window.buildGamesHTML = function () {
    const base = _origBuildGamesHTML();
    return base.replace(
      /(<div class="games-sidebar">[\s\S]*?)(  <\/div>\s*<div class="games-main">)/,
      (_, sidebar, rest) => {
        const newNav = [
          ['wordle',   '🟩', 'Wordle'],
          ['tetris',   '🟦', 'Tetris'],
          ['flappy',   '🐦', 'Flappy Bird'],
          ['pong',     '🏓', 'Pong'],
          ['memory',   '🃏', 'Memory Match'],
          ['breakout', '🧱', 'Breakout'],
          ['sudoku',   '🔢', 'Sudoku'],
          ['pacman',   '👾', 'Pac-Man'],
          ['chess',    '♟️', 'Chess'],
          ['hangman',  '🪢', 'Hangman'],
        ].map(([id, icon, name]) =>
          `<div class="game-nav" onclick="gameNav(this,'${id}')"><span class="gn-icon">${icon}</span>${name}</div>`
        ).join('\n    ');

        const newCards = [
          ['wordle',   '🟩', 'Wordle',      'Word'],
          ['tetris',   '🟦', 'Tetris',      'Arcade'],
          ['flappy',   '🐦', 'Flappy Bird', 'Arcade'],
          ['pong',     '🏓', 'Pong',        'Arcade'],
          ['memory',   '🃏', 'Memory Match','Puzzle'],
          ['breakout', '🧱', 'Breakout',    'Arcade'],
          ['sudoku',   '🔢', 'Sudoku',      'Puzzle'],
          ['pacman',   '👾', 'Pac-Man',     'Arcade'],
          ['chess',    '♟️', 'Chess',       'Strategy'],
          ['hangman',  '🪢', 'Hangman',     'Word'],
        ].map(([id, icon, name, genre]) =>
          `<div class="game-card" onclick="gameNavId('${id}')"><div class="game-art">${icon}</div><div class="game-info"><div class="game-name">${name}</div><div class="game-genre">${genre}</div></div></div>`
        ).join('\n        ');

        // inject nav items + library cards
        let s = sidebar.replace('</div>\n  <div class="games-main">', `    ${newNav}\n  </div>\n  <div class="games-main">`);
        // won't match perfectly — use rest directly
        return sidebar + `    ${newNav}\n` + rest;
      }
    );
  };

  // Simpler approach: just override buildGamesHTML cleanly
  window.buildGamesHTML = function () {
    // Nav entry helper — uses renderGameIcon for the small tile
    function navItem(id, label, active) {
      return `<div class="game-nav${active ? ' active' : ''}" onclick="gameNav(this,'${id}')">${renderGameIcon(id, 'gn-tile')}${label}</div>`;
    }
    // Library card helper — uses renderGameIcon for the art area
    function libCard(id, name, genre) {
      return `<div class="game-card" onclick="gameNavId('${id}')"><div class="game-art">${renderGameIcon(id)}</div><div class="game-info"><div class="game-name">${name}</div><div class="game-genre">${genre}</div></div></div>`;
    }

    return `
<div class="games-wrap">
  <div class="games-sidebar">
    <h2>My Library</h2>
    <div class="game-nav active" onclick="gameNav(this,'library')"><span class="gn-icon">🏠</span>Library</div>
    ${navItem('snake',   'Snake')}
    ${navItem('ttt',     'Tic-Tac-Toe')}
    ${navItem('2048',    '2048')}
    ${navItem('ms',      'Minesweeper')}
    ${navItem('wordle',  'Wordle')}
    ${navItem('tetris',  'Tetris')}
    ${navItem('flappy',  'Flappy Bird')}
    ${navItem('pong',    'Pong')}
    ${navItem('memory',  'Memory Match')}
    ${navItem('breakout','Breakout')}
    ${navItem('sudoku',  'Sudoku')}
    ${navItem('pacman',  'Pac-Man')}
    ${navItem('chess',   'Chess')}
    ${navItem('hangman', 'Hangman')}
  </div>
  <div class="games-main">

    <!-- LIBRARY -->
    <div class="game-viewport active" id="gv-library">
      <div class="games-library">
        ${libCard('snake',   'Snake',        'Arcade')}
        ${libCard('ttt',     'Tic-Tac-Toe',  'Puzzle')}
        ${libCard('2048',    '2048',         'Puzzle')}
        ${libCard('ms',      'Minesweeper',  'Strategy')}
        ${libCard('wordle',  'Wordle',       'Word')}
        ${libCard('tetris',  'Tetris',       'Arcade')}
        ${libCard('flappy',  'Flappy Bird',  'Arcade')}
        ${libCard('pong',    'Pong',         'Arcade')}
        ${libCard('memory',  'Memory Match', 'Puzzle')}
        ${libCard('breakout','Breakout',     'Arcade')}
        ${libCard('sudoku',  'Sudoku',       'Puzzle')}
        ${libCard('pacman',  'Pac-Man',      'Arcade')}
        ${libCard('chess',   'Chess',        'Strategy')}
        ${libCard('hangman', 'Hangman',      'Word')}
      </div>
    </div>

    <!-- SNAKE -->
    <div class="game-viewport" id="gv-snake">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Snake</span>
        <span class="gv-score" id="snake-score">Score: 0</span>
        <span class="gv-score" id="snake-best" style="color:var(--accent)">Best: 0</span>
        <select id="snake-difficulty" class="game-diff-select" onchange="snakeDiffChange()">
          <option value="easy">🐢 Easy</option>
          <option value="medium" selected>🐍 Medium</option>
          <option value="hard">⚡ Hard</option>
          <option value="extreme">💀 Extreme</option>
        </select>
        <button class="gv-btn" onclick="snakeReset()">New Game</button>
      </div>
      <div style="position:relative;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#000;gap:10px">
        <div class="snake-border-wrap"><canvas id="snake-canvas"></canvas></div>
        <div style="font-size:12px;color:rgba(255,255,255,0.5)" id="snake-hint">Use Arrow Keys to move</div>
      </div>
    </div>

    <!-- TIC-TAC-TOE -->
    <div class="game-viewport" id="gv-ttt">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Tic-Tac-Toe</span>
        <span class="gv-score" id="ttt-record">W: 0&nbsp;&nbsp;L: 0&nbsp;&nbsp;D: 0</span>
        <button class="gv-btn" onclick="tttReset()">New Game</button>
      </div>
      <div class="ttt-wrap">
        <div class="ttt-status" id="ttt-status">X's turn</div>
        <div class="ttt-grid" id="ttt-grid"></div>
      </div>
    </div>

    <!-- 2048 -->
    <div class="game-viewport" id="gv-2048">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">2048</span>
        <button class="gv-btn" onclick="g2048Reset()">New Game</button>
      </div>
      <div class="g2048-wrap">
        <div class="g2048-scores">
          <div class="g2048-score-box"><div class="g2048-score-lbl">Score</div><div class="g2048-score-val" id="g2048-score">0</div></div>
          <div class="g2048-score-box"><div class="g2048-score-lbl">Best</div><div class="g2048-score-val" id="g2048-best">0</div></div>
        </div>
        <div class="g2048-board" id="g2048-board"></div>
        <p style="font-size:12px;color:var(--text-muted)">Arrow Keys to slide tiles</p>
      </div>
    </div>

    <!-- MINESWEEPER -->
    <div class="game-viewport" id="gv-ms">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Minesweeper</span>
        <button class="ms-diff-btn active" id="ms-diff-easy"   onclick="msSetDifficulty('easy')">Easy</button>
        <button class="ms-diff-btn"        id="ms-diff-medium" onclick="msSetDifficulty('medium')">Medium</button>
        <button class="ms-diff-btn"        id="ms-diff-hard"   onclick="msSetDifficulty('hard')">Hard</button>
        <button class="gv-btn" onclick="msReset()">New Game</button>
      </div>
      <div class="ms-wrap">
        <div class="ms-header">
          <div class="ms-counter" id="ms-mines">💣 10</div>
          <div class="ms-face" id="ms-face" onclick="msReset()">🙂</div>
          <div class="ms-counter" id="ms-timer">⏱ 0</div>
          <div class="ms-counter" id="ms-best">🏆 --</div>
        </div>
        <div class="ms-grid" id="ms-grid"></div>
        <p style="font-size:11px;color:var(--text-muted)">Left click: reveal &nbsp;|&nbsp; Right click: flag</p>
      </div>
    </div>

    <!-- WORDLE -->
    <div class="game-viewport" id="gv-wordle">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Wordle</span>
        <span class="gv-score" id="wordle-streak" style="color:var(--accent)">Streak: 0</span>
        <button class="gv-btn" onclick="wordleNewGame()">New Game</button>
      </div>
      <div id="wordle-wrap" style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px;flex:1;overflow-y:auto">
        <div id="wordle-grid" style="display:grid;grid-template-rows:repeat(6,1fr);gap:6px"></div>
        <div id="wordle-keyboard" style="display:flex;flex-direction:column;gap:6px;align-items:center"></div>
        <div id="wordle-msg" style="font-size:14px;color:var(--accent);font-weight:600;min-height:20px"></div>
      </div>
    </div>

    <!-- TETRIS -->
    <div class="game-viewport" id="gv-tetris">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Tetris</span>
        <span class="gv-score" id="tetris-score">Score: 0</span>
        <span class="gv-score" id="tetris-best" style="color:var(--accent)">Best: 0</span>
        <span class="gv-score" id="tetris-level">Level: 1</span>
        <button class="gv-btn" onclick="tetrisReset()">New Game</button>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:24px;background:#000">
        <canvas id="tetris-canvas" width="200" height="400" style="border:2px solid rgba(255,255,255,0.2)"></canvas>
        <div style="display:flex;flex-direction:column;gap:16px;color:#fff;font-size:13px">
          <div><div style="color:rgba(255,255,255,0.4);font-size:11px;margin-bottom:4px">NEXT</div><canvas id="tetris-next" width="80" height="80" style="border:1px solid rgba(255,255,255,0.15)"></canvas></div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.8">← → Move<br>↑ Rotate<br>↓ Soft drop<br>Space Hard drop</div>
        </div>
      </div>
    </div>

    <!-- FLAPPY BIRD -->
    <div class="game-viewport" id="gv-flappy">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Flappy Bird</span>
        <span class="gv-score" id="flappy-score">Score: 0</span>
        <span class="gv-score" id="flappy-best" style="color:var(--accent)">Best: 0</span>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;background:#000">
        <canvas id="flappy-canvas" width="320" height="480" style="border:2px solid rgba(255,255,255,0.2);cursor:pointer" onclick="flappyTap()"></canvas>
      </div>
    </div>

    <!-- PONG -->
    <div class="game-viewport" id="gv-pong">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Pong</span>
        <span class="gv-score" id="pong-score">You 0 — 0 CPU</span>
        <span class="gv-score" id="pong-record" style="color:var(--accent)">W: 0  L: 0</span>
        <button class="gv-btn" onclick="pongReset()">New Game</button>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;background:#000">
        <canvas id="pong-canvas" width="600" height="400" style="border:2px solid rgba(255,255,255,0.2)"></canvas>
      </div>
    </div>

    <!-- MEMORY MATCH -->
    <div class="game-viewport" id="gv-memory">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Memory Match</span>
        <span class="gv-score" id="memory-moves">Moves: 0</span>
        <span class="gv-score" id="memory-best" style="color:var(--accent)">Best: --</span>
        <button class="gv-btn" onclick="memoryReset()">New Game</button>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px">
        <div id="memory-grid" style="display:grid;grid-template-columns:repeat(4,80px);grid-template-rows:repeat(4,80px);gap:10px"></div>
      </div>
    </div>

    <!-- BREAKOUT -->
    <div class="game-viewport" id="gv-breakout">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Breakout</span>
        <span class="gv-score" id="breakout-score">Score: 0</span>
        <span class="gv-score" id="breakout-lives">Lives: ❤️❤️❤️</span>
        <span class="gv-score" id="breakout-best" style="color:var(--accent)">Best: 0</span>
        <button class="gv-btn" onclick="breakoutReset()">New Game</button>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;background:#000">
        <canvas id="breakout-canvas" width="480" height="360" style="border:2px solid rgba(255,255,255,0.2)" onmousemove="breakoutMouseMove(event)"></canvas>
      </div>
    </div>

    <!-- SUDOKU -->
    <div class="game-viewport" id="gv-sudoku">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Sudoku</span>
        <span class="gv-score" id="sudoku-errors">Errors: 0/3</span>
        <span class="gv-score" id="sudoku-solved" style="color:var(--accent)">Easy: 0  Hard: 0</span>
        <button class="gv-btn" onclick="sudokuNew('easy')">Easy</button>
        <button class="gv-btn" onclick="sudokuNew('hard')">Hard</button>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;padding:16px">
        <div id="sudoku-board" style="display:grid;grid-template-columns:repeat(9,44px);grid-template-rows:repeat(9,44px);border:2px solid rgba(255,255,255,0.4)"></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:4px">Numbers</div>
          <div id="sudoku-numpad" style="display:grid;grid-template-columns:repeat(3,44px);gap:6px"></div>
          <button onclick="sudokuErase()" style="margin-top:4px;padding:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#fff;cursor:pointer;font-size:13px">⌫ Erase</button>
        </div>
      </div>
    </div>

    <!-- PAC-MAN -->
    <div class="game-viewport" id="gv-pacman">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Pac-Man</span>
        <span class="gv-score" id="pacman-score">Score: 0</span>
        <span class="gv-score" id="pacman-lives">Lives: ●●●</span>
        <span class="gv-score" id="pacman-best" style="color:var(--accent)">Best: 0</span>
        <button class="gv-btn" onclick="pacmanReset()">New Game</button>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;background:#000">
        <canvas id="pacman-canvas" width="420" height="420" style="border:2px solid rgba(255,255,255,0.1)"></canvas>
      </div>
    </div>

    <!-- CHESS -->
    <div class="game-viewport" id="gv-chess">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Chess</span>
        <span class="gv-score" id="chess-status">White's turn</span>
        <button class="gv-btn" onclick="chessReset()">New Game</button>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:20px;background:#111">
        <div>
          <div id="chess-board" style="display:grid;grid-template-columns:repeat(8,54px);grid-template-rows:repeat(8,54px);border:2px solid rgba(255,255,255,0.3)"></div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;padding:0 2px;font-size:11px;color:rgba(255,255,255,0.3)">
            <span>a</span><span>b</span><span>c</span><span>d</span><span>e</span><span>f</span><span>g</span><span>h</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;color:rgba(255,255,255,0.6);max-width:140px">
          <div id="chess-captured-w" style="min-height:20px;word-break:break-all"></div>
          <div id="chess-captured-b" style="min-height:20px;word-break:break-all"></div>
          <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px;line-height:1.7">Click a piece<br>then click<br>where to move.<br><br>You play White.</div>
        </div>
      </div>
    </div>

    <!-- HANGMAN -->
    <div class="game-viewport" id="gv-hangman">
      <div class="game-vp-header">
        <button class="gv-back" onclick="gameNavId('library')">← Back</button>
        <span class="gv-title">Hangman</span>
        <span class="gv-score" id="hangman-wins" style="color:var(--accent)">Wins: 0</span>
        <span class="gv-score" id="hangman-losses">Losses: 0</span>
        <button class="gv-btn" onclick="hangmanNew()">New Word</button>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:20px">
        <canvas id="hangman-canvas" width="200" height="220" style="border:1px solid rgba(255,255,255,0.1);border-radius:8px"></canvas>
        <div id="hangman-word" style="display:flex;gap:10px;font-size:28px;font-weight:700;letter-spacing:4px"></div>
        <div id="hangman-keyboard" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:400px"></div>
        <div id="hangman-msg" style="font-size:14px;color:var(--accent);font-weight:600;min-height:20px"></div>
      </div>
    </div>

  </div>
</div>`;
  };

  /* ── Patch gameShowViewport to call new game inits ──────────── */
  const _origGameShow = window.gameShowViewport;
  window.gameShowViewport = function (id) {
    _origGameShow(id);
    switch (id) {
      case 'wordle':   wordleInit();   break;
      case 'tetris':   tetrisInit();   break;
      case 'flappy':   flappyInit();   break;
      case 'pong':     pongInit();     break;
      case 'memory':   memoryInit();   break;
      case 'breakout': breakoutInit(); break;
      case 'sudoku':   sudokuInit();   break;
      case 'pacman':   pacmanInit();   break;
      case 'chess':    chessInit();    break;
      case 'hangman':  hangmanInit();  break;
    }
  };

  /* ══════════════════════════════════════════════════════════════
     WORDLE
  ══════════════════════════════════════════════════════════════ */
  const WORDLE_WORDS = ['crane','slate','audio','shire','plumb','glint','frown','quest','blaze','crimp','dwarf','epoch','fjord','grout','helix','inbox','joust','knave','lingo','mercy','nexus','oxide','perch','quirk','raven','scone','thyme','umbra','venom','waltz','xerox','yacht','zesty','abbey','abbot','abhor','abide','abode','abort','abuzz','abyss','ached','acorn','acrid','acute','adage','adept','admit','adobe','adopt','adore','adorn','adult','aegis','afoot','after','again','agate','agave','agile','aglow','agony','agora','agree','ahead','aisle','alarm','album','aloft','alone','aloof','aloud','alpha','altar','amaze','amber','amble','amend','amino','ample','angel','anger','angle','angry','anime','annex','antic','anvil','apart','apple','aptly','arbor','ardor','arena','argon','armor','aroma','arose','array','ashen','askew','atlas','atone','attic','audio','avail','avert','avian','avid','axiom','azure','babel','badge','badly','bagel','balmy','banal','banjo','barge','baron','basic','batch','bathe','bayou','beach','beady','beard','beige','belle','belly','below','bench','birch','bison','bleat','blend','bless','blimp','blink','bloat','block','blond','blood','bloom','blown','bluer','blunt','blurb','blurt','blush','board','boggy','bogus','bolts','bonus','booby','booze','borax','botch','bough','braid','brash','brawl','bream','breed','bribe','bride','brine','brink','brisk','broil','brook','broth','brown','brunt','brush','budge','bulge','bumpy','bunch','burly','butch','cabal','cabin','cache','camel','cameo','cargo','carol','catch','cause','cedar','chaos','charm','chart','chase','chasm','cheap','cheek','chess','chest','chewy','chief','chile','china','chimp','choir','chord','chore','chose','cider','cinch','civic','civil','clack','claim','clamp','clang','clank','clash','clasp','class','clean','clear','cleek','cleft','clerk','click','cliff','climb','cling','clink','cloak','clone','cloth','cloud','clout','clown','clump','clunk','coach','coast','cobra','codec','comet','comma','comic','coral','count','court','cover','cower','craft','crash','crazy','creak','cream','creep','crest','crown','crush','crypt','cubic','curry','curve','cutie','cynic','daily','daisy','dance','datum','decay','decoy','delta','depot','derby','digit','dimly','disco','ditch','ditty','dizzy','dodge','dogma','dopey','doted','doubt','dough','dowdy','dowel','downy','dowry','draft','drape','drawl','drawn','dreck','drink','drool','drove','dryer','duchy','dully','dumpy','dunce','dusky','dusty','eager','eagle','ebony','edify','eerie','eight','eject','elude','elves','ember','emcee','empty','endow','enjoy','envoy','equal','equip','error','essay','ethic','evade','evoke','exact','exalt','excel','exert','exist','expel','extol','fable','facet','faint','faith','false','fancy','farce','fatal','fatty','fault','feast','fetid','fiend','fiery','fifth','fifty','filth','finch','flair','flame','flank','flare','flash','flask','flawy','fleck','flesh','flick','fling','flint','flirt','float','flock','flood','floor','flora','floss','flour','flout','flown','fluff','fluke','flume','flunk','flute','foamy','foray','forge','forte','forum','found','frail','franc','fraud','freak','fresh','friar','froth','froze','frugal','fungi','funky','funny','furor','fuzzy','gamer','gaudy','gauge','gavel','gawky','giddy','girth','given','gizmo','gland','glare','glean','glide','gloom','gloss','glove','glyph','gnash','gnome','godly','going','gorge','gouge','gourd','grace','grade','graft','grasp','grass','grate','grave','gravy','graze','greed','greet','grief','gripe','groan','groin','groom','grope','gross','grout','grove','growl','gruel','gruff','guile','guise','gulag','gummy','gusto','gypsy','habit','happy','harpy','harshly','haunt','haven','havoc','heady','heart','heavy','hedge','hence','hertz','hippo','hoist','holly','homer','honey','honor','horde','hotly','husky','hyena','hyper','icing','ideal','idiom','igloo','image','imply','inept','inert','infer','input','inter','intro','ionic','irate','irony','ivory','jaunt','jazzy','jelly','jerky','jewel','jiffy','jimmy','joker','jolly','joust','judge','juicy','jumbo','junto','karma','kazoo','kebab','ketch','khaki','kinky','kitty','knack','knead','kneel','knelt','knick','knife','knock','known','label','lance','lapel','large','latch','latte','laugh','layer','leach','leaky','learn','leery','legal','lemma','lemon','level','lewd','libel','lingo','liver','llama','loafs','local','lofty','logic','loopy','louse','lousy','lover','lower','loyal','lucid','lucky','lurid','lusty','lying','lyric','magic','major','maize','maker','mambo','mango','manor','maple','marry','marsh','match','maxim','media','medic','melee','merit','messy','metal','micro','might','mimic','minor','minus','mirth','miser','mixed','mixer','model','mogul','moldy','money','month','moral','moron','morph','moult','mourn','mousy','muddy','mummy','murky','music','musty','myrrh','nadir','naive','nanny','nasal','nasty','naval','neigh','nerve','niche','night','ninja','noble','noise','nonce','noodle','notch','novel','nymph','occur','offer','often','olive','onion','opera','optic','orbit','order','other','otter','outdo','outgo','ovary','ovoid','owing','owlet','oxide','ozone','paddy','pagan','papal','paper','parry','parse','party','pasta','pasty','patch','patsy','pause','peach','pearl','pedal','penal','penny','perky','pesky','petty','phase','piano','picky','pilot','pinch','piney','pixie','pixel','pizza','place','plaid','plain','plait','plane','plank','plant','plaza','plead','pleat','plied','plonk','pluck','plunk','plush','poach','poker','polar','polka','poppy','porch','potty','pouch','pouty','power','prank','prawn','press','price','prick','pride','prime','print','prior','privy','probe','prone','prose','proxy','prude','prune','psalm','pubic','pudgy','pulse','punch','pupil','pushy','quack','qualm','quaff','qualm','quash','queer','query','queue','quick','quiff','quill','quirk','quota','quote','rabid','radar','radix','rainy','rally','ramen','ranch','rapId','rapid','raspy','ratty','reach','realm','rebus','reedy','regal','reign','relax','renew','repay','repel','repro','rerun','reuse','rider','rigid','risky','rival','rivet','roast','robin','rocky','rodeo','rogue','roman','roomy','rowdy','royal','ruler','runny','rupee','rusty','sadly','sassy','saucy','sauna','saute','scalp','scaly','scamp','scant','scarf','scary','scene','scoff','scold','score','scour','scram','scrap','scree','screw','scrub','seedy','seize','serve','setup','sever','shack','shade','shady','shake','shaky','shall','shawl','sheer','shelf','shell','shift','shine','shirt','shoal','shock','shone','shook','shore','short','shout','shrug','shuck','sight','since','siren','sixth','sixty','skate','skier','skill','skimp','skirt','skull','skunk','slack','slain','slang','slant','slash','slave','sleek','sleep','sleet','slept','slick','slide','slime','slimy','slosh','sloth','slump','slunk','slurp','slush','smack','small','smart','smash','smear','smell','smelt','smile','smirk','smite','smoke','smoky','snack','snail','snake','snare','snarl','sneak','sniff','snore','snort','snout','snowy','soapy','soggy','solar','solve','sooth','sough','sower','spark','spasm','spawn','speak','speck','speed','spelt','spend','spice','spicy','spill','spine','spire','spite','splat','split','spoke','spoof','spook','spore','sport','spout','spray','spree','sprig','spunk','squad','squat','squid','stain','stair','stale','stall','stare','stark','start','stave','stead','steak','steal','steam','steel','steep','steer','stern','stiff','still','sting','stink','stock','stoic','stomp','stone','stool','storm','story','stout','stove','strap','straw','stray','strew','strip','strut','study','stump','stung','stunk','stunt','style','suave','sugar','suite','sulky','sunny','super','surge','swami','swamp','swear','sweat','sweep','sweet','swept','swift','swill','swoop','synod','taint','taken','tally','talon','taunt','taupe','tawny','teach','tepid','terse','their','there','these','those','three','threw','thumb','tiara','tidal','tiger','tight','timer','tipsy','titan','tithe','tonal','topaz','topic','total','totem','touch','tough','towel','trace','track','trade','trail','trait','tramp','trash','trawl','tread','treat','treed','trend','trick','tried','tripe','trite','troth','trout','trove','truce','truck','trump','trunk','truss','tryst','tulip','tumor','tuner','tunic','tuple','twang','tweed','twerp','twice','twill','twirl','twist','tying','udder','ultra','uncut','unfit','unify','union','unzip','upper','upset','urban','usher','utter','uvula','vague','valid','valor','valve','vapid','vault','vaunt','vegan','vigil','vicar','viola','viper','viral','visit','visor','vista','vital','vivid','vixen','vocal','vodka','voila','vomit','voter','vouch','vying','wacky','wader','wager','waken','warty','waste','watch','water','weary','weave','wedge','weedy','weigh','weird','whack','whale','wheal','wheat','wheel','where','which','whiff','while','whine','whirl','whisk','white','whole','whose','widen','widow','wimpy','windy','wispy','witch','witty','wizen','woman','world','wormy','worry','worse','worst','worth','wrack','wrath','wreak','wreck','wrest','wring','wrist','write','wrote','yacht','yearn','yield','young','yucky','zonal'];

  let wordleAnswer = '', wordleGuesses = [], wordleCurrent = '', wordleOver = false;
  let wordleStreak = 0;

  function wordleInit() {
    wordleStreak = parseInt(localStorage.getItem('wordleStreak') || '0');
    document.getElementById('wordle-streak').textContent = 'Streak: ' + wordleStreak;
    wordleNewGame();
  }

  function wordleNewGame() {
    wordleAnswer = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)].toUpperCase();
    wordleGuesses = [];
    wordleCurrent = '';
    wordleOver = false;
    wordleRender();
    document.getElementById('wordle-msg').textContent = '';
  }
  window.wordleNewGame = wordleNewGame;

  function wordleRender() {
    const grid = document.getElementById('wordle-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let r = 0; r < 6; r++) {
      const row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:repeat(5,52px);gap:6px';
      for (let c = 0; c < 5; c++) {
        const cell = document.createElement('div');
        cell.style.cssText = 'width:52px;height:52px;border:2px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;border-radius:4px;';
        if (r < wordleGuesses.length) {
          const guess = wordleGuesses[r];
          const letter = guess[c] || '';
          cell.textContent = letter;
          const ansArr = wordleAnswer.split('');
          const remaining = [...ansArr];
          // Two-pass coloring
          const result = Array(5).fill('absent');
          // First pass: correct
          for (let i = 0; i < 5; i++) {
            if (guess[i] === ansArr[i]) { result[i] = 'correct'; remaining[i] = null; }
          }
          // Second pass: present
          for (let i = 0; i < 5; i++) {
            if (result[i] === 'correct') continue;
            const idx = remaining.indexOf(guess[i]);
            if (idx !== -1) { result[i] = 'present'; remaining[idx] = null; }
          }
          cell.style.background = result[c] === 'correct' ? '#538d4e' : result[c] === 'present' ? '#b59f3b' : '#3a3a3c';
          cell.style.borderColor = cell.style.background;
        } else if (r === wordleGuesses.length) {
          cell.textContent = wordleCurrent[c] || '';
          if (wordleCurrent[c]) cell.style.borderColor = 'rgba(255,255,255,0.6)';
        }
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }
    wordleRenderKeyboard();
  }

  function wordleRenderKeyboard() {
    const kb = document.getElementById('wordle-keyboard');
    if (!kb) return;
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    const letterState = {};
    for (const guess of wordleGuesses) {
      const ansArr = wordleAnswer.split('');
      const remaining = [...ansArr];
      const result = Array(5).fill('absent');
      for (let i = 0; i < 5; i++) { if (guess[i] === ansArr[i]) { result[i] = 'correct'; remaining[i] = null; } }
      for (let i = 0; i < 5; i++) {
        if (result[i] === 'correct') continue;
        const idx = remaining.indexOf(guess[i]);
        if (idx !== -1) { result[i] = 'present'; remaining[idx] = null; }
      }
      for (let i = 0; i < 5; i++) {
        const l = guess[i], cur = letterState[l];
        if (result[i] === 'correct') letterState[l] = 'correct';
        else if (result[i] === 'present' && cur !== 'correct') letterState[l] = 'present';
        else if (!cur) letterState[l] = 'absent';
      }
    }
    kb.innerHTML = '';
    rows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.style.cssText = 'display:flex;gap:5px';
      [...row].forEach(l => {
        const btn = document.createElement('button');
        btn.textContent = l;
        const state = letterState[l];
        btn.style.cssText = `width:34px;height:44px;border:none;border-radius:4px;cursor:pointer;font-weight:700;font-size:13px;color:#fff;background:${state === 'correct' ? '#538d4e' : state === 'present' ? '#b59f3b' : state === 'absent' ? '#3a3a3c' : '#818384'};`;
        btn.onclick = () => wordleKey(l);
        rowEl.appendChild(btn);
      });
      if (row === 'ZXCVBNM') {
        const enter = document.createElement('button');
        enter.textContent = '↵';
        enter.style.cssText = 'padding:0 10px;height:44px;border:none;border-radius:4px;cursor:pointer;font-weight:700;font-size:13px;color:#fff;background:#818384;';
        enter.onclick = wordleEnter;
        const del = document.createElement('button');
        del.textContent = '⌫';
        del.style.cssText = enter.style.cssText;
        del.onclick = wordleDelete;
        rowEl.prepend(enter);
        rowEl.appendChild(del);
      }
      kb.appendChild(rowEl);
    });
  }

  function wordleKey(l) {
    if (wordleOver || wordleCurrent.length >= 5) return;
    wordleCurrent += l;
    wordleRender();
  }
  function wordleDelete() {
    if (wordleOver) return;
    wordleCurrent = wordleCurrent.slice(0, -1);
    wordleRender();
  }
  function wordleEnter() {
    if (wordleOver || wordleCurrent.length < 5) {
      document.getElementById('wordle-msg').textContent = wordleCurrent.length < 5 ? 'Not enough letters' : '';
      return;
    }
    wordleGuesses.push(wordleCurrent);
    const won = wordleCurrent === wordleAnswer;
    wordleCurrent = '';
    wordleRender();
    if (won) {
      wordleOver = true;
      wordleStreak++;
      localStorage.setItem('wordleStreak', wordleStreak);
      document.getElementById('wordle-streak').textContent = 'Streak: ' + wordleStreak;
      document.getElementById('wordle-msg').textContent = '🎉 Brilliant! The word was ' + wordleAnswer;
    } else if (wordleGuesses.length >= 6) {
      wordleOver = true;
      wordleStreak = 0;
      localStorage.setItem('wordleStreak', 0);
      document.getElementById('wordle-streak').textContent = 'Streak: 0';
      document.getElementById('wordle-msg').textContent = '😞 The word was ' + wordleAnswer;
    }
  }

  document.addEventListener('keydown', e => {
    const vp = document.getElementById('gv-wordle');
    if (!vp || !vp.classList.contains('active')) return;
    if (e.key === 'Enter') { wordleEnter(); return; }
    if (e.key === 'Backspace') { wordleDelete(); return; }
    if (/^[a-zA-Z]$/.test(e.key)) wordleKey(e.key.toUpperCase());
  });

  /* ══════════════════════════════════════════════════════════════
     TETRIS
  ══════════════════════════════════════════════════════════════ */
  const TETRIS_COLS = 10, TETRIS_ROWS = 20, TETRIS_CELL = 20;
  const TETRIS_PIECES = [
    { shape: [[1,1,1,1]],                         color: '#00f0f0' }, // I
    { shape: [[1,0],[1,0],[1,1]],                  color: '#f0a000' }, // L
    { shape: [[0,1],[0,1],[1,1]],                  color: '#0000f0' }, // J
    { shape: [[1,1],[1,1]],                        color: '#f0f000' }, // O
    { shape: [[0,1,1],[1,1,0]],                    color: '#00f000' }, // S
    { shape: [[1,1,0],[0,1,1]],                    color: '#f00000' }, // Z
    { shape: [[1,1,1],[0,1,0]],                    color: '#a000f0' }, // T
  ];
  let tetrisBoard, tetrisPiece, tetrisNext, tetrisScore, tetrisBest, tetrisLevel, tetrisLines, tetrisLoop, tetrisBag = [], tetrisLastTime = 0, tetrisAccum = 0;

  function tetrisBagPop() {
    if (!tetrisBag.length) tetrisBag = [...Array(7).keys()].sort(() => Math.random() - 0.5);
    return TETRIS_PIECES[tetrisBag.pop()];
  }

  function tetrisInit() {
    tetrisBest = parseInt(localStorage.getItem('tetrisBest') || '0');
    document.getElementById('tetris-best').textContent = 'Best: ' + tetrisBest;
    tetrisReset();
  }

  function tetrisGetInterval() { return Math.max(100, 800 - (tetrisLevel - 1) * 70); }

  function tetrisReset() {
    cancelAnimationFrame(tetrisLoop);
    tetrisBoard = Array.from({ length: TETRIS_ROWS }, () => Array(TETRIS_COLS).fill(0));
    tetrisScore = 0; tetrisLevel = 1; tetrisLines = 0;
    tetrisBag = []; tetrisAccum = 0; tetrisLastTime = 0;
    tetrisPiece = tetrisSpawn();
    tetrisNext = tetrisBagPop();
    tetrisDraw();
    tetrisDrawNext();
    document.getElementById('tetris-score').textContent = 'Score: 0';
    document.getElementById('tetris-level').textContent = 'Level: 1';
    tetrisLoop = requestAnimationFrame(tetrisRAF);
  }

  function tetrisRAF(ts) {
    if (!tetrisLastTime) tetrisLastTime = ts;
    tetrisAccum += ts - tetrisLastTime;
    tetrisLastTime = ts;
    if (tetrisAccum >= tetrisGetInterval()) {
      tetrisAccum -= tetrisGetInterval();
      tetrisStep();
    }
    tetrisDraw();
    tetrisLoop = requestAnimationFrame(tetrisRAF);
  }
  window.tetrisReset = tetrisReset;

  function tetrisSpawn() {
    const p = tetrisNext || tetrisBagPop();
    tetrisNext = tetrisBagPop();
    return { shape: p.shape, color: p.color, x: Math.floor(TETRIS_COLS / 2) - Math.floor(p.shape[0].length / 2), y: 0 };
  }

  function tetrisValid(shape, x, y) {
    return shape.every((row, r) => row.every((v, c) => !v || (
      x + c >= 0 && x + c < TETRIS_COLS && y + r < TETRIS_ROWS && !(y + r >= 0 && tetrisBoard[y + r][x + c])
    )));
  }

  function tetrisStep() {
    if (tetrisValid(tetrisPiece.shape, tetrisPiece.x, tetrisPiece.y + 1)) {
      tetrisPiece.y++;
    } else {
      tetrisLock();
    }
    tetrisDraw();
  }

  function tetrisLock() {
    tetrisPiece.shape.forEach((row, r) => row.forEach((v, c) => {
      if (v && tetrisPiece.y + r >= 0) tetrisBoard[tetrisPiece.y + r][tetrisPiece.x + c] = tetrisPiece.color;
    }));
    // Clear lines
    let cleared = 0;
    for (let r = TETRIS_ROWS - 1; r >= 0; r--) {
      if (tetrisBoard[r].every(Boolean)) { tetrisBoard.splice(r, 1); tetrisBoard.unshift(Array(TETRIS_COLS).fill(0)); cleared++; r++; }
    }
    if (cleared) {
      const pts = [0, 100, 300, 500, 800][cleared] * tetrisLevel;
      tetrisScore += pts; tetrisLines += cleared;
      tetrisLevel = Math.floor(tetrisLines / 10) + 1;
      document.getElementById('tetris-score').textContent = 'Score: ' + tetrisScore;
      document.getElementById('tetris-level').textContent = 'Level: ' + tetrisLevel;
      // Speed is handled by tetrisGetInterval() in the rAF loop — no restart needed
      if (tetrisScore > tetrisBest) { tetrisBest = tetrisScore; localStorage.setItem('tetrisBest', tetrisBest); document.getElementById('tetris-best').textContent = 'Best: ' + tetrisBest; }
    }
    tetrisPiece = tetrisSpawn();
    tetrisDrawNext();
    if (!tetrisValid(tetrisPiece.shape, tetrisPiece.x, tetrisPiece.y)) {
      cancelAnimationFrame(tetrisLoop); tetrisLoop = null; tetrisLastTime = 0;
      if (typeof showNotif === 'function') showNotif('Tetris', 'Game over! Score: ' + tetrisScore, '🟦');
    }
  }

  function tetrisRotate(shape) {
    return shape[0].map((_, i) => shape.map(r => r[i]).reverse());
  }

  function tetrisDraw() {
    const canvas = document.getElementById('tetris-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let r = 0; r < TETRIS_ROWS; r++) for (let c = 0; c < TETRIS_COLS; c++) {
      if (tetrisBoard[r][c]) { ctx.fillStyle = tetrisBoard[r][c]; ctx.fillRect(c * TETRIS_CELL + 1, r * TETRIS_CELL + 1, TETRIS_CELL - 2, TETRIS_CELL - 2); }
    }
    // Ghost
    let gy = tetrisPiece.y;
    while (tetrisValid(tetrisPiece.shape, tetrisPiece.x, gy + 1)) gy++;
    tetrisPiece.shape.forEach((row, r) => row.forEach((v, c) => {
      if (v) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect((tetrisPiece.x + c) * TETRIS_CELL + 1, (gy + r) * TETRIS_CELL + 1, TETRIS_CELL - 2, TETRIS_CELL - 2); }
    }));
    // Piece
    tetrisPiece.shape.forEach((row, r) => row.forEach((v, c) => {
      if (v) { ctx.fillStyle = tetrisPiece.color; ctx.fillRect((tetrisPiece.x + c) * TETRIS_CELL + 1, (tetrisPiece.y + r) * TETRIS_CELL + 1, TETRIS_CELL - 2, TETRIS_CELL - 2); }
    }));
  }

  function tetrisDrawNext() {
    const canvas = document.getElementById('tetris-next');
    if (!canvas || !tetrisNext) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 80, 80);
    const s = tetrisNext.shape, ox = Math.floor((4 - s[0].length) / 2) * 16, oy = Math.floor((4 - s.length) / 2) * 16;
    ctx.fillStyle = tetrisNext.color;
    s.forEach((row, r) => row.forEach((v, c) => { if (v) ctx.fillRect(ox + c * 16 + 1, oy + r * 16 + 1, 14, 14); }));
  }

  document.addEventListener('keydown', e => {
    const vp = document.getElementById('gv-tetris');
    if (!vp || !vp.classList.contains('active') || !tetrisPiece) return;
    const GAME_KEYS = ['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '];
    if (!GAME_KEYS.includes(e.key)) return;
    if (e.key === 'ArrowLeft')  { if (tetrisValid(tetrisPiece.shape, tetrisPiece.x - 1, tetrisPiece.y)) tetrisPiece.x--; }
    if (e.key === 'ArrowRight') { if (tetrisValid(tetrisPiece.shape, tetrisPiece.x + 1, tetrisPiece.y)) tetrisPiece.x++; }
    if (e.key === 'ArrowDown')  { if (tetrisValid(tetrisPiece.shape, tetrisPiece.x, tetrisPiece.y + 1)) tetrisPiece.y++; }
    if (e.key === 'ArrowUp')    { const rot = tetrisRotate(tetrisPiece.shape); if (tetrisValid(rot, tetrisPiece.x, tetrisPiece.y)) tetrisPiece.shape = rot; }
    if (e.key === ' ')          { while (tetrisValid(tetrisPiece.shape, tetrisPiece.x, tetrisPiece.y + 1)) tetrisPiece.y++; tetrisLock(); }
    tetrisDraw();
    e.preventDefault();
  });

  /* ══════════════════════════════════════════════════════════════
     FLAPPY BIRD
  ══════════════════════════════════════════════════════════════ */
  let flappy = {}, flappyRAF, flappyLastTime = 0;

  function flappyInit() {
    cancelAnimationFrame(flappyRAF);
    const canvas = document.getElementById('flappy-canvas');
    if (!canvas) return;
    const best = parseInt(localStorage.getItem('flappyBest') || '0');
    document.getElementById('flappy-best').textContent = 'Best: ' + best;
    flappy = { bird: { y: 200, vy: 0 }, pipes: [], score: 0, best, frame: 0, state: 'waiting', canvas, ctx: canvas.getContext('2d') };
    flappyDraw();
  }

  function flappyTap() {
    if (!flappy.ctx) return;
    if (flappy.state === 'waiting' || flappy.state === 'dead') { flappyStart(); return; }
    flappy.bird.vy = -380; // pixels/sec to match GRAVITY=900
  }
  window.flappyTap = flappyTap;

  function flappyStart() {
    flappy.bird = { y: 200, vy: 0 };
    flappy.pipes = [];
    flappy.score = 0;
    flappy.pipeTimer = 0;
    flappy.state = 'playing';
    document.getElementById('flappy-score').textContent = 'Score: 0';
    cancelAnimationFrame(flappyRAF);
    flappyLastTime = 0;
    flappyLoop();
  }

  function flappyLoop(ts) {
    if (!flappyLastTime) flappyLastTime = ts;
    const dt = Math.min((ts - flappyLastTime) / 1000, 0.05); // seconds, capped at 50ms
    flappyLastTime = ts;
    flappyUpdate(dt);
    flappyDraw();
    if (flappy.state === 'playing') flappyRAF = requestAnimationFrame(flappyLoop);
  }

  function flappyUpdate(dt) {
    const GRAVITY = 900, PIPE_SPEED = 150, PIPE_INTERVAL = 1.35;
    flappy.bird.vy += GRAVITY * dt;
    flappy.bird.y += flappy.bird.vy * dt;
    flappy.pipeTimer = (flappy.pipeTimer || 0) + dt;
    if (flappy.pipeTimer >= PIPE_INTERVAL) {
      flappy.pipeTimer -= PIPE_INTERVAL;
      const gap = 130, top = 60 + Math.random() * 180;
      flappy.pipes.push({ x: 320, top, bottom: top + gap });
    }
    flappy.pipes.forEach(p => p.x -= PIPE_SPEED * dt);
    flappy.pipes = flappy.pipes.filter(p => p.x > -60);
    for (const p of flappy.pipes) {
      if (!p.passed && p.x < 60) { p.passed = true; flappy.score++; document.getElementById('flappy-score').textContent = 'Score: ' + flappy.score; }
      if (60 > p.x - 20 && 60 < p.x + 40 && (flappy.bird.y < p.top || flappy.bird.y + 24 > p.bottom)) { flappyDie(); return; }
    }
    if (flappy.bird.y > 480 || flappy.bird.y < 0) { flappyDie(); return; }
  }

  function flappyDie() {
    flappy.state = 'dead';
    if (flappy.score > flappy.best) { flappy.best = flappy.score; localStorage.setItem('flappyBest', flappy.best); document.getElementById('flappy-best').textContent = 'Best: ' + flappy.best; }
  }

  function flappyDraw() {
    const { ctx, canvas, bird, pipes, score, state } = flappy;
    if (!ctx) return;
    // Sky
    ctx.fillStyle = '#70c5ce'; ctx.fillRect(0, 0, 320, 480);
    // Ground
    ctx.fillStyle = '#ded895'; ctx.fillRect(0, 450, 320, 30);
    // Pipes
    ctx.fillStyle = '#74bf2e';
    pipes.forEach(p => {
      ctx.fillRect(p.x, 0, 40, p.top);
      ctx.fillRect(p.x, p.bottom, 40, 480 - p.bottom);
    });
    // Bird
    ctx.fillStyle = '#f5d73d';
    ctx.beginPath();
    ctx.ellipse(60, bird.y + 12, 16, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a800';
    ctx.beginPath();
    ctx.ellipse(70, bird.y + 12, 8, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Overlay
    if (state === 'waiting') {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, 320, 480);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Tap / Click to Start', 160, 230);
    }
    if (state === 'dead') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, 320, 480);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Game Over', 160, 200);
      ctx.font = '16px sans-serif';
      ctx.fillText('Score: ' + score + '  Best: ' + flappy.best, 160, 230);
      ctx.fillText('Tap to play again', 160, 270);
    }
  }

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      const vp = document.getElementById('gv-flappy');
      if (vp && vp.classList.contains('active')) { flappyTap(); e.preventDefault(); }
    }
  });

  /* ══════════════════════════════════════════════════════════════
     PONG
  ══════════════════════════════════════════════════════════════ */
  let pong = {}, pongRAF;

  function pongInit() {
    cancelAnimationFrame(pongRAF);
    const canvas = document.getElementById('pong-canvas');
    if (!canvas) return;
    const saved = JSON.parse(localStorage.getItem('pongRecord') || '{"w":0,"l":0}');
    pong = {
      canvas, ctx: canvas.getContext('2d'),
      ball: { x: 300, y: 200, vx: 4, vy: 3, r: 8 },
      p1: { y: 175, score: 0 }, cpu: { y: 175, score: 0 },
      running: true,
      wins: saved.w, losses: saved.l
    };
    const recEl = document.getElementById('pong-record');
    if (recEl) recEl.textContent = `W: ${pong.wins}  L: ${pong.losses}`;
    pongReset();
    pongRAF = requestAnimationFrame(pongLoop);
  }

  function pongReset() {
    if (!pong.canvas) return;
    pong.ball = { x: 300, y: 200, vx: (Math.random() > 0.5 ? 4 : -4), vy: (Math.random() > 0.5 ? 3 : -3), r: 8 };
    pong.p1 = { y: 175, score: pong.p1?.score || 0 };
    pong.cpu = { y: 175, score: pong.cpu?.score || 0 };
    pong.running = true;
    document.getElementById('pong-score').textContent = `You ${pong.p1.score} — ${pong.cpu.score} CPU`;
  }
  window.pongReset = () => { if (pong.canvas) { pong.p1.score = 0; pong.cpu.score = 0; pongReset(); } else { pongInit(); } };

  pong._my = 200;
  document.addEventListener('mousemove', e => {
    const vp = document.getElementById('gv-pong');
    if (!vp || !vp.classList.contains('active') || !pong.canvas) return;
    const rect = pong.canvas.getBoundingClientRect();
    pong._my = e.clientY - rect.top;
  });

  function pongLoop() {
    pongUpdate();
    pongDraw();
    pongRAF = requestAnimationFrame(pongLoop);
  }

  function pongUpdate() {
    if (!pong.running) return;
    const b = pong.ball, H = 400;
    // Player paddle follows mouse
    pong.p1.y = Math.max(0, Math.min(H - 60, pong._my - 30));
    // CPU AI
    const cpuCenter = pong.cpu.y + 30;
    if (b.x > 300) pong.cpu.y += (b.y - cpuCenter) * 0.07;
    pong.cpu.y = Math.max(0, Math.min(H - 60, pong.cpu.y));
    // Ball move
    b.x += b.vx; b.y += b.vy;
    if (b.y - b.r < 0 || b.y + b.r > H) b.vy *= -1;
    // Player paddle hit
    if (b.x - b.r < 20 && b.y > pong.p1.y && b.y < pong.p1.y + 60) { b.vx = Math.abs(b.vx) * 1.05; b.vy += (Math.random() - 0.5) * 1.5; }
    // CPU paddle hit
    if (b.x + b.r > 580 && b.y > pong.cpu.y && b.y < pong.cpu.y + 60) { b.vx = -Math.abs(b.vx) * 1.05; b.vy += (Math.random() - 0.5) * 1.5; }
    // Cap speed
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > 12) { b.vx = b.vx / speed * 12; b.vy = b.vy / speed * 12; }
    // Scoring
    if (b.x < 0) {
      pong.cpu.score++;
      if (pong.cpu.score >= 7) {
        pong.losses = (pong.losses || 0) + 1;
        localStorage.setItem('pongRecord', JSON.stringify({ w: pong.wins || 0, l: pong.losses }));
        const recEl = document.getElementById('pong-record');
        if (recEl) recEl.textContent = `W: ${pong.wins || 0}  L: ${pong.losses}`;
        pong.p1.score = 0; pong.cpu.score = 0;
      }
      pongReset();
    }
    if (b.x > 600) {
      pong.p1.score++;
      if (pong.p1.score >= 7) {
        pong.wins = (pong.wins || 0) + 1;
        localStorage.setItem('pongRecord', JSON.stringify({ w: pong.wins, l: pong.losses || 0 }));
        const recEl = document.getElementById('pong-record');
        if (recEl) recEl.textContent = `W: ${pong.wins}  L: ${pong.losses || 0}`;
        pong.p1.score = 0; pong.cpu.score = 0;
      }
      pongReset();
    }
    document.getElementById('pong-score').textContent = `You ${pong.p1.score} — ${pong.cpu.score} CPU`;
  }

  function pongDraw() {
    const { ctx, ball: b, p1, cpu } = pong;
    if (!ctx) return;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 600, 400);
    ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(300, 400); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#fff';
    ctx.fillRect(10, p1.y, 10, 60);
    ctx.fillRect(580, cpu.y, 10, 60);
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center';
    ctx.fillText(p1.score, 140, 40);
    ctx.fillText(cpu.score, 460, 40);
  }

  /* ══════════════════════════════════════════════════════════════
     MEMORY MATCH
  ══════════════════════════════════════════════════════════════ */
  const MEMORY_IDS = window.MEMORY_ORDER || ['pizza','guitar','rocket','rainbow','dolphin','masks','trophy','crystal'];
  let memoryCards = [], memoryFlipped = [], memoryMoves = 0, memoryMatched = 0, memoryLock = false;

  function memoryInit() {
    const best = localStorage.getItem('memoryBest');
    document.getElementById('memory-best').textContent = 'Best: ' + (best || '--') + ' moves';
    memoryReset();
  }

  function memoryReset() {
    memoryCards = [...MEMORY_IDS, ...MEMORY_IDS].sort(() => Math.random() - 0.5);
    memoryFlipped = []; memoryMoves = 0; memoryMatched = 0; memoryLock = false;
    document.getElementById('memory-moves').textContent = 'Moves: 0';
    memoryRender();
  }
  window.memoryReset = memoryReset;

  function memoryRender() {
    const grid = document.getElementById('memory-grid');
    if (!grid) return;
    grid.innerHTML = '';
    memoryCards.forEach((iconId, i) => {
      const card = document.createElement('div');
      const matched  = memoryCards[i] === null;
      const revealed = memoryFlipped.includes(i) || matched;
      card.style.cssText = `width:80px;height:80px;background:${revealed ? 'transparent' : '#0078D4'};border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:${revealed ? 'default' : 'pointer'};transition:all 0.2s;border:2px solid rgba(255,255,255,${matched ? '0' : '0.1'});opacity:${matched ? '0.3' : '1'};`;
      if (revealed && iconId) {
        card.innerHTML = renderMemoryIcon(iconId);
        // size the inner memory-icon tile to fill the card
        card.querySelector('.memory-icon').style.cssText += 'width:72px;height:72px;border-radius:8px;';
        card.querySelector('.memory-icon svg').style.cssText = 'width:52px;height:52px;';
      }
      if (!revealed) card.onclick = () => memoryFlip(i);
      grid.appendChild(card);
    });
  }

  function memoryFlip(i) {
    if (memoryLock || memoryFlipped.includes(i) || memoryCards[i] === null) return;
    memoryFlipped.push(i);
    memoryRender();
    if (memoryFlipped.length === 2) {
      memoryLock = true; memoryMoves++;
      document.getElementById('memory-moves').textContent = 'Moves: ' + memoryMoves;
      const [a, b] = memoryFlipped;
      if (memoryCards[a] === memoryCards[b]) {
        memoryCards[a] = memoryCards[b] = null;
        memoryFlipped = []; memoryMatched += 2; memoryLock = false;
        if (memoryMatched === 16) {
          const best = parseInt(localStorage.getItem('memoryBest') || '999');
          if (memoryMoves < best) { localStorage.setItem('memoryBest', memoryMoves); document.getElementById('memory-best').textContent = 'Best: ' + memoryMoves + ' moves'; }
          if (typeof showNotif === 'function') showNotif('Memory Match', 'You won in ' + memoryMoves + ' moves! 🃏', '🃏');
        }
        memoryRender();
      } else {
        setTimeout(() => { memoryFlipped = []; memoryLock = false; memoryRender(); }, 900);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     BREAKOUT
  ══════════════════════════════════════════════════════════════ */
  let bo = {}, boRAF;

  function breakoutInit() {
    cancelAnimationFrame(boRAF);
    const canvas = document.getElementById('breakout-canvas');
    if (!canvas) return;
    bo = { canvas, ctx: canvas.getContext('2d'), score: 0, lives: 3, best: parseInt(localStorage.getItem('breakoutBest') || '0'), paddle: { x: 190, w: 80 }, ball: { x: 240, y: 300, vx: 3, vy: -4, r: 7 }, bricks: [], running: false };
    document.getElementById('breakout-best').textContent = 'Best: ' + bo.best;
    breakoutBuildBricks();
    breakoutReset();
  }

  function breakoutBuildBricks() {
    bo.bricks = [];
    const colors = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6'];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) {
      bo.bricks.push({ x: c * 46 + 8, y: r * 22 + 40, w: 42, h: 18, color: colors[r], alive: true });
    }
  }

  function breakoutReset() {
    bo.ball = { x: 240, y: 300, vx: 3, vy: -4, r: 7 };
    bo.paddle.x = 190;
    bo.running = true;
    document.getElementById('breakout-score').textContent = 'Score: ' + bo.score;
    document.getElementById('breakout-lives').textContent = 'Lives: ' + '❤️'.repeat(bo.lives);
    cancelAnimationFrame(boRAF);
    boRAF = requestAnimationFrame(breakoutLoop);
  }
  window.breakoutReset = () => { bo.score = 0; bo.lives = 3; breakoutBuildBricks(); if (bo.canvas) breakoutReset(); else breakoutInit(); };

  function breakoutMouseMove(e) {
    if (!bo.canvas) return;
    const rect = bo.canvas.getBoundingClientRect();
    bo.paddle.x = Math.max(0, Math.min(480 - bo.paddle.w, e.clientX - rect.left - bo.paddle.w / 2));
  }
  window.breakoutMouseMove = breakoutMouseMove;

  function breakoutLoop() {
    if (!bo.running) return;
    breakoutUpdate();
    breakoutDraw();
    boRAF = requestAnimationFrame(breakoutLoop);
  }

  function breakoutUpdate() {
    const b = bo.ball;
    b.x += b.vx; b.y += b.vy;
    if (b.x - b.r < 0 || b.x + b.r > 480) b.vx *= -1;
    if (b.y - b.r < 0) b.vy *= -1;
    // Paddle
    if (b.y + b.r > 330 && b.x > bo.paddle.x && b.x < bo.paddle.x + bo.paddle.w && b.vy > 0) {
      b.vy = -Math.abs(b.vy);
      b.vx += ((b.x - (bo.paddle.x + bo.paddle.w / 2)) / (bo.paddle.w / 2)) * 2;
    }
    // Bricks
    for (const brick of bo.bricks) {
      if (!brick.alive) continue;
      if (b.x + b.r > brick.x && b.x - b.r < brick.x + brick.w && b.y + b.r > brick.y && b.y - b.r < brick.y + brick.h) {
        brick.alive = false; b.vy *= -1; bo.score += 10;
        document.getElementById('breakout-score').textContent = 'Score: ' + bo.score;
        if (bo.score > bo.best) { bo.best = bo.score; localStorage.setItem('breakoutBest', bo.best); document.getElementById('breakout-best').textContent = 'Best: ' + bo.best; }
      }
    }
    // Lost ball
    if (b.y > 380) {
      bo.lives--;
      document.getElementById('breakout-lives').textContent = 'Lives: ' + ('❤️'.repeat(Math.max(0, bo.lives)));
      if (bo.lives <= 0) { bo.running = false; if (typeof showNotif === 'function') showNotif('Breakout', 'Game over! Score: ' + bo.score, '🧱'); return; }
      b.x = 240; b.y = 300; b.vx = 3; b.vy = -4;
    }
    // Win
    if (bo.bricks.every(br => !br.alive)) { bo.running = false; breakoutBuildBricks(); if (typeof showNotif === 'function') showNotif('Breakout', 'You cleared the board! 🎉', '🧱'); }
  }

  function breakoutDraw() {
    const { ctx, canvas, ball: b, paddle, bricks } = bo;
    if (!ctx) return;
    ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, 480, 360);
    bricks.forEach(br => { if (br.alive) { ctx.fillStyle = br.color; ctx.fillRect(br.x, br.y, br.w, br.h); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.strokeRect(br.x, br.y, br.w, br.h); } });
    ctx.fillStyle = '#6AB4F5'; ctx.fillRect(paddle.x, 335, paddle.w, 10);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  }

  /* ══════════════════════════════════════════════════════════════
     SUDOKU
  ══════════════════════════════════════════════════════════════ */
  let sudokuPuzzle = [], sudokuSolution = [], sudokuSelected = -1, sudokuErrors = 0, sudokuDiff = 'easy';

  function sudokuInit() {
    const easy = parseInt(localStorage.getItem('sudokuSolved_easy') || '0');
    const hard = parseInt(localStorage.getItem('sudokuSolved_hard') || '0');
    const el = document.getElementById('sudoku-solved');
    if (el) el.textContent = `Easy: ${easy}  Hard: ${hard}`;
    sudokuNew('easy');
  }

  function sudokuNew(diff) {
    sudokuDiff = diff;
    sudokuErrors = 0;
    document.getElementById('sudoku-errors').textContent = 'Errors: 0/3';
    sudokuSolution = sudokuGenerate();
    sudokuPuzzle = sudokuSolution.map((v, i) => ({ value: v, given: Math.random() > (diff === 'easy' ? 0.45 : 0.62), selected: false }));
    sudokuSelected = -1;
    sudokuRender();
    sudokuRenderNumpad();
  }
  window.sudokuNew = sudokuNew;

  function sudokuGenerate() {
    const board = Array(81).fill(0);
    sudokuSolve(board);
    return board;
  }

  function sudokuSolve(board) {
    const empty = board.indexOf(0);
    if (empty === -1) return true;
    const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
    for (const n of nums) {
      if (sudokuValid(board, empty, n)) {
        board[empty] = n;
        if (sudokuSolve(board)) return true;
        board[empty] = 0;
      }
    }
    return false;
  }

  function sudokuValid(board, idx, n) {
    const r = Math.floor(idx / 9), c = idx % 9;
    for (let i = 0; i < 9; i++) {
      if (board[r * 9 + i] === n || board[i * 9 + c] === n) return false;
    }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) {
      if (board[(br + dr) * 9 + bc + dc] === n) return false;
    }
    return true;
  }

  function sudokuRender() {
    const board = document.getElementById('sudoku-board');
    if (!board) return;
    board.innerHTML = '';
    sudokuPuzzle.forEach((cell, i) => {
      const el = document.createElement('div');
      const r = Math.floor(i / 9), c = i % 9;
      const borderR = (r + 1) % 3 === 0 && r < 8 ? '2px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.12)';
      const borderB = (c + 1) % 3 === 0 && c < 8 ? '2px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.12)';
      el.style.cssText = `width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:${cell.given ? '700' : '400'};color:${cell.error ? '#f87171' : cell.given ? '#fff' : '#6AB4F5'};background:${i === sudokuSelected ? 'rgba(0,120,212,0.25)' : 'transparent'};cursor:${cell.given ? 'default' : 'pointer'};border-right:${borderB};border-bottom:${borderR};`;
      el.textContent = cell.value || '';
      if (!cell.given) el.onclick = () => { sudokuSelected = i; sudokuRender(); };
      board.appendChild(el);
    });
  }

  function sudokuRenderNumpad() {
    const np = document.getElementById('sudoku-numpad');
    if (!np) return;
    np.innerHTML = '';
    for (let n = 1; n <= 9; n++) {
      const btn = document.createElement('button');
      btn.textContent = n;
      btn.style.cssText = 'width:44px;height:44px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#fff;font-size:18px;cursor:pointer;';
      btn.onclick = () => sudokuPlace(n);
      np.appendChild(btn);
    }
  }

  function sudokuPlace(n) {
    if (sudokuSelected < 0) return;
    const cell = sudokuPuzzle[sudokuSelected];
    if (!cell || cell.given) return;
    cell.value = n;
    cell.error = n !== sudokuSolution[sudokuSelected];
    if (cell.error) {
      sudokuErrors++;
      document.getElementById('sudoku-errors').textContent = `Errors: ${sudokuErrors}/3`;
      if (sudokuErrors >= 3) { if (typeof showNotif === 'function') showNotif('Sudoku', 'Too many errors! Try again.', '🔢'); sudokuNew('easy'); return; }
    }
    sudokuRender();
    if (sudokuPuzzle.every(c => c.value === sudokuSolution[sudokuPuzzle.indexOf(c)] || c.value === sudokuSolution[sudokuPuzzle.indexOf(c)])) {
      if (sudokuPuzzle.every((c, i) => c.value === sudokuSolution[i])) {
        const key = 'sudokuSolved_' + sudokuDiff;
        const count = parseInt(localStorage.getItem(key) || '0') + 1;
        localStorage.setItem(key, count);
        const easy = parseInt(localStorage.getItem('sudokuSolved_easy') || '0');
        const hard = parseInt(localStorage.getItem('sudokuSolved_hard') || '0');
        const el = document.getElementById('sudoku-solved');
        if (el) el.textContent = `Easy: ${easy}  Hard: ${hard}`;
        if (typeof showNotif === 'function') showNotif('Sudoku', `Puzzle solved! 🎉 (${sudokuDiff}: ${count} total)`, '🔢');
      }
    }
  }

  function sudokuErase() {
    if (sudokuSelected < 0) return;
    const cell = sudokuPuzzle[sudokuSelected];
    if (!cell || cell.given) return;
    cell.value = 0; cell.error = false;
    sudokuRender();
  }
  window.sudokuErase = sudokuErase;

  /* ══════════════════════════════════════════════════════════════
     PAC-MAN (simplified tile-based)
  ══════════════════════════════════════════════════════════════ */
  const PM_MAP = [
    '####################',
    '#........##........#',
    '#.##.###.##.###.##.#',
    '#.##.###.##.###.##.#',
    '#..................#',
    '#.##.#.######.#.##.#',
    '#....#...##...#....#',
    '####.###.  .###.####',
    '   #.#        #.#   ',
    '####.# ##--## #.####',
    '     .  #GGG#  .    ',
    '####.# ####### #.####',
    '   #.#          #.#   ',
    '####.# #######  #.####',
    '#........##........#',
    '#.##.###.##.###.##.#',
    '#...#.............#',
    '##.#.#.######.#.#.##',
    '#....#...##...#....#',
    '#.########.########.#',
    '#..................#',
    '####################',
  ];

  let pm = {};

  function pacmanInit() {
    const best = parseInt(localStorage.getItem('pacmanBest') || '0');
    document.getElementById('pacman-best').textContent = 'Best: ' + best;
    pacmanReset();
  }

  function pacmanReset() {
    if (pm.loop) clearInterval(pm.loop);
    const canvas = document.getElementById('pacman-canvas');
    if (!canvas) return;
    const cell = 20;
    // Build simple grid
    const grid = [];
    const dots = [];
    for (let r = 0; r < 21; r++) {
      grid.push([]);
      for (let c = 0; c < 21; c++) {
        const ch = (PM_MAP[r] || '')[c] || ' ';
        grid[r].push(ch === '#' ? 1 : 0);
        if (ch === '.') dots.push({ r, c, eaten: false });
      }
    }
    pm = {
      canvas, ctx: canvas.getContext('2d'), cell,
      grid,
      dots,
      pac: { r: 15, c: 10, dir: { dr: 0, dc: 0 }, mouth: 0, mouthDir: 1 },
      ghosts: [
        { r: 10, c: 9,  color: '#ff0000', dr: 0, dc: 1 },
        { r: 10, c: 10, color: '#ffb8ff', dr: 0, dc: -1 },
        { r: 10, c: 11, color: '#00ffff', dr: 1, dc: 0 },
      ],
      score: 0, lives: 3,
      best: parseInt(localStorage.getItem('pacmanBest') || '0'),
      frame: 0
    };
    document.getElementById('pacman-score').textContent = 'Score: 0';
    document.getElementById('pacman-lives').textContent = 'Lives: ●●●';
    pm.loop = setInterval(pacmanStep, 140);
  }
  window.pacmanReset = pacmanReset;

  function pacmanStep() {
    const { pac, ghosts, grid, dots } = pm;
    pm.frame++;
    // Move pac
    const nr = pac.r + pac.dir.dr, nc = pac.c + pac.dir.dc;
    if (nr >= 0 && nr < 21 && nc >= 0 && nc < 21 && !grid[nr][nc]) {
      pac.r = (nr + 21) % 21; pac.c = (nc + 21) % 21;
    }
    // Eat dots
    for (const d of dots) {
      if (!d.eaten && d.r === pac.r && d.c === pac.c) {
        d.eaten = true; pm.score += 10;
        document.getElementById('pacman-score').textContent = 'Score: ' + pm.score;
        if (pm.score > pm.best) { pm.best = pm.score; localStorage.setItem('pacmanBest', pm.best); document.getElementById('pacman-best').textContent = 'Best: ' + pm.best; }
      }
    }
    // Move ghosts (random valid direction)
    for (const g of ghosts) {
      if (pm.frame % 2 !== 0) continue;
      const dirs = [{ dr: 0, dc: 1 }, { dr: 0, dc: -1 }, { dr: 1, dc: 0 }, { dr: -1, dc: 0 }];
      const valid = dirs.filter(d => {
        const gr = g.r + d.dr, gc = g.c + d.dc;
        return gr >= 0 && gr < 21 && gc >= 0 && gc < 21 && !grid[gr][gc] && !(d.dr === -g.dr && d.dc === -g.dc);
      });
      const pick = valid.length ? valid[Math.floor(Math.random() * valid.length)] : { dr: -g.dr, dc: -g.dc };
      g.dr = pick.dr; g.dc = pick.dc;
      g.r = Math.max(0, Math.min(20, g.r + g.dr));
      g.c = Math.max(0, Math.min(20, g.c + g.dc));
      // Collision
      if (g.r === pac.r && g.c === pac.c) {
        pm.lives--;
        document.getElementById('pacman-lives').textContent = 'Lives: ' + '●'.repeat(Math.max(0, pm.lives));
        if (pm.lives <= 0) { clearInterval(pm.loop); if (typeof showNotif === 'function') showNotif('Pac-Man', 'Game over! Score: ' + pm.score, '👾'); return; }
        pac.r = 15; pac.c = 10;
      }
    }
    pac.mouth += 0.15 * pac.mouthDir;
    if (pac.mouth > 0.3 || pac.mouth < 0) pac.mouthDir *= -1;
    pacmanDraw();
  }

  function pacmanDraw() {
    const { ctx, canvas, cell, grid, dots, pac, ghosts } = pm;
    if (!ctx) return;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 420, 420);
    // Walls
    ctx.fillStyle = '#1a1aff';
    for (let r = 0; r < 21; r++) for (let c = 0; c < 21; c++) {
      if (grid[r][c]) ctx.fillRect(c * cell, r * cell, cell, cell);
    }
    // Dots
    ctx.fillStyle = '#fff';
    for (const d of dots) {
      if (!d.eaten) { ctx.beginPath(); ctx.arc(d.c * cell + cell / 2, d.r * cell + cell / 2, 3, 0, Math.PI * 2); ctx.fill(); }
    }
    // Pac
    const px = pac.c * cell + cell / 2, py = pac.r * cell + cell / 2;
    const angle = pac.dir.dc === -1 ? Math.PI : pac.dir.dr === -1 ? Math.PI * 1.5 : pac.dir.dr === 1 ? Math.PI * 0.5 : 0;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, cell / 2 - 1, angle + pac.mouth, angle + Math.PI * 2 - pac.mouth);
    ctx.closePath(); ctx.fill();
    // Ghosts
    for (const g of ghosts) {
      const gx = g.c * cell, gy = g.r * cell;
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(gx + cell / 2, gy + cell / 2, cell / 2 - 1, Math.PI, 0);
      ctx.lineTo(gx + cell, gy + cell);
      for (let i = 3; i >= 0; i--) ctx.lineTo(gx + (i + 0.5) * (cell / 4), gy + cell - (i % 2 === 0 ? 5 : 0));
      ctx.lineTo(gx, gy + cell);
      ctx.closePath(); ctx.fill();
    }
  }

  document.addEventListener('keydown', e => {
    const vp = document.getElementById('gv-pacman');
    if (!vp || !vp.classList.contains('active') || !pm.pac) return;
    if (e.key === 'ArrowUp')    pm.pac.dir = { dr: -1, dc: 0 };
    if (e.key === 'ArrowDown')  pm.pac.dir = { dr: 1, dc: 0 };
    if (e.key === 'ArrowLeft')  pm.pac.dir = { dr: 0, dc: -1 };
    if (e.key === 'ArrowRight') pm.pac.dir = { dr: 0, dc: 1 };
    e.preventDefault();
  });

  /* ══════════════════════════════════════════════════════════════
     CHESS
  ══════════════════════════════════════════════════════════════ */
  const CHESS_PIECES = {
    wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',
    bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'
  };

  let chess = {};

  function chessInit() { chessReset(); }

  function chessReset() {
    chess = {
      board: [
        ['bR','bN','bB','bQ','bK','bB','bN','bR'],
        ['bP','bP','bP','bP','bP','bP','bP','bP'],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        ['wP','wP','wP','wP','wP','wP','wP','wP'],
        ['wR','wN','wB','wQ','wK','wB','wN','wR'],
      ],
      turn: 'w',
      selected: null,
      capturedW: [],
      capturedB: [],
    };
    document.getElementById('chess-status').textContent = "White's turn";
    document.getElementById('chess-captured-w').textContent = '';
    document.getElementById('chess-captured-b').textContent = '';
    chessRender();
  }
  window.chessReset = chessReset;

  function chessRender() {
    const board = document.getElementById('chess-board');
    if (!board) return;
    board.innerHTML = '';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const sq = document.createElement('div');
      const light = (r + c) % 2 === 0;
      const isSelected = chess.selected && chess.selected[0] === r && chess.selected[1] === c;
      const isHint = chess.hints && chess.hints.some(h => h[0] === r && h[1] === c);
      sq.style.cssText = `width:54px;height:54px;display:flex;align-items:center;justify-content:center;font-size:30px;cursor:pointer;background:${isSelected ? '#f6f669' : isHint ? (light ? '#aed581' : '#7cb342') : light ? '#f0d9b5' : '#b58863'};`;
      const piece = chess.board[r][c];
      if (piece) sq.textContent = CHESS_PIECES[piece];
      sq.onclick = () => chessClick(r, c);
      board.appendChild(sq);
    }
  }

  function chessClick(r, c) {
    const piece = chess.board[r][c];
    if (chess.selected) {
      const [sr, sc] = chess.selected;
      const isHint = chess.hints && chess.hints.some(h => h[0] === r && h[1] === c);
      if (isHint) {
        // Make move
        const captured = chess.board[r][c];
        if (captured) {
          if (captured[0] === 'w') chess.capturedW.push(captured);
          else chess.capturedB.push(captured);
          document.getElementById('chess-captured-w').textContent = chess.capturedW.map(p => CHESS_PIECES[p]).join('');
          document.getElementById('chess-captured-b').textContent = chess.capturedB.map(p => CHESS_PIECES[p]).join('');
        }
        chess.board[r][c] = chess.board[sr][sc];
        chess.board[sr][sc] = null;
        // Pawn promotion
        if (chess.board[r][c] === 'wP' && r === 0) chess.board[r][c] = 'wQ';
        if (chess.board[r][c] === 'bP' && r === 7) chess.board[r][c] = 'bQ';
        chess.turn = chess.turn === 'w' ? 'b' : 'w';
        chess.selected = null; chess.hints = [];
        document.getElementById('chess-status').textContent = (chess.turn === 'w' ? 'White' : 'Black') + "'s turn";
        chessRender();
        // Simple CPU move
        if (chess.turn === 'b') setTimeout(chessCPU, 400);
        return;
      }
      chess.selected = null; chess.hints = [];
    }
    if (piece && piece[0] === chess.turn) {
      chess.selected = [r, c];
      chess.hints = chessMoves(r, c);
    }
    chessRender();
  }

  function chessMoves(r, c) {
    const piece = chess.board[r][c];
    if (!piece) return [];
    const type = piece[1], color = piece[0], enemy = color === 'w' ? 'b' : 'w';
    const moves = [];
    const add = (tr, tc) => {
      if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return false;
      const t = chess.board[tr][tc];
      if (t && t[0] === color) return false;
      moves.push([tr, tc]);
      return !t;
    };
    const slide = (dr, dc) => { let tr = r + dr, tc = c + dc; while (add(tr, tc)) { tr += dr; tc += dc; } };
    if (type === 'P') {
      const dir = color === 'w' ? -1 : 1, start = color === 'w' ? 6 : 1;
      if (!chess.board[r + dir]?.[c]) { moves.push([r + dir, c]); if (r === start && !chess.board[r + 2 * dir]?.[c]) moves.push([r + 2 * dir, c]); }
      for (const dc of [-1, 1]) { const t = chess.board[r + dir]?.[c + dc]; if (t && t[0] === enemy) moves.push([r + dir, c + dc]); }
    }
    if (type === 'R' || type === 'Q') { slide(1,0); slide(-1,0); slide(0,1); slide(0,-1); }
    if (type === 'B' || type === 'Q') { slide(1,1); slide(1,-1); slide(-1,1); slide(-1,-1); }
    if (type === 'N') { for (const [dr,dc] of [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]) add(r+dr,c+dc); }
    if (type === 'K') { for (const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) add(r+dr,c+dc); }
    return moves;
  }

  function chessCPU() {
    // Find all black moves, pick a random capture or random move
    const allMoves = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if (chess.board[r][c]?.[0] === 'b') {
        chessMoves(r, c).forEach(([tr, tc]) => allMoves.push({ r, c, tr, tc, capture: !!chess.board[tr][tc] }));
      }
    }
    if (!allMoves.length) { document.getElementById('chess-status').textContent = 'Checkmate! White wins!'; return; }
    const captures = allMoves.filter(m => m.capture);
    const move = captures.length ? captures[Math.floor(Math.random() * captures.length)] : allMoves[Math.floor(Math.random() * allMoves.length)];
    const captured = chess.board[move.tr][move.tc];
    if (captured) { chess.capturedB.push(captured); document.getElementById('chess-captured-b').textContent = chess.capturedB.map(p => CHESS_PIECES[p]).join(''); }
    chess.board[move.tr][move.tc] = chess.board[move.r][move.c];
    chess.board[move.r][move.c] = null;
    if (chess.board[move.tr][move.tc] === 'bP' && move.tr === 7) chess.board[move.tr][move.tc] = 'bQ';
    chess.turn = 'w';
    chess.selected = null; chess.hints = [];
    document.getElementById('chess-status').textContent = "White's turn";
    chessRender();
  }

  /* ══════════════════════════════════════════════════════════════
     HANGMAN
  ══════════════════════════════════════════════════════════════ */
  const HANGMAN_WORDS = ['javascript','python','keyboard','monitor','browser','network','security','algorithm','variable','function','database','internet','software','hardware','protocol','encryption','interface','developer','framework','typescript','component','debugging','recursion','iteration','abstraction','polymorphism','inheritance','encapsulation','asynchronous','synchronous','middleware','blockchain','artificial','intelligence','machine','learning','neural','network','quantum','computing'];

  let hangman = {};

  function hangmanInit() {
    hangman.wins = parseInt(localStorage.getItem('hangmanWins') || '0');
    hangman.losses = parseInt(localStorage.getItem('hangmanLosses') || '0');
    document.getElementById('hangman-wins').textContent = 'Wins: ' + hangman.wins;
    document.getElementById('hangman-losses').textContent = 'Losses: ' + hangman.losses;
    hangmanNew();
  }

  function hangmanNew() {
    hangman.word = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)].toUpperCase();
    hangman.guessed = new Set();
    hangman.wrong = 0;
    hangman.over = false;
    document.getElementById('hangman-msg').textContent = '';
    hangmanRender();
  }
  window.hangmanNew = hangmanNew;

  function hangmanRender() {
    // Canvas
    const canvas = document.getElementById('hangman-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 200, 220);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      // Gallows
      ctx.beginPath(); ctx.moveTo(20, 210); ctx.lineTo(180, 210); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60, 210); ctx.lineTo(60, 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60, 20); ctx.lineTo(130, 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(130, 20); ctx.lineTo(130, 45); ctx.stroke();
      const w = hangman.wrong;
      if (w > 0) { ctx.beginPath(); ctx.arc(130, 62, 17, 0, Math.PI * 2); ctx.stroke(); }
      if (w > 1) { ctx.beginPath(); ctx.moveTo(130, 79); ctx.lineTo(130, 140); ctx.stroke(); }
      if (w > 2) { ctx.beginPath(); ctx.moveTo(130, 95); ctx.lineTo(100, 120); ctx.stroke(); }
      if (w > 3) { ctx.beginPath(); ctx.moveTo(130, 95); ctx.lineTo(160, 120); ctx.stroke(); }
      if (w > 4) { ctx.beginPath(); ctx.moveTo(130, 140); ctx.lineTo(105, 175); ctx.stroke(); }
      if (w > 5) { ctx.beginPath(); ctx.moveTo(130, 140); ctx.lineTo(155, 175); ctx.stroke(); }
    }
    // Word
    const wordEl = document.getElementById('hangman-word');
    if (wordEl) {
      wordEl.innerHTML = hangman.word.split('').map(l =>
        `<span style="display:inline-block;width:24px;border-bottom:3px solid rgba(255,255,255,0.6);text-align:center;color:${hangman.guessed.has(l) ? '#fff' : 'transparent'}">${l}</span>`
      ).join('');
    }
    // Keyboard
    const kb = document.getElementById('hangman-keyboard');
    if (kb) {
      kb.innerHTML = '';
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l => {
        const btn = document.createElement('button');
        btn.textContent = l;
        const correct = hangman.word.includes(l);
        const used = hangman.guessed.has(l);
        btn.style.cssText = `width:34px;height:34px;border:none;border-radius:4px;cursor:${used || hangman.over ? 'default' : 'pointer'};font-weight:700;font-size:12px;color:#fff;background:${used ? (correct ? '#538d4e' : '#3a3a3c') : '#818384'};opacity:${used ? '0.7' : '1'};`;
        btn.disabled = used || hangman.over;
        btn.onclick = () => hangmanGuess(l);
        kb.appendChild(btn);
      });
    }
  }

  function hangmanGuess(l) {
    if (hangman.over || hangman.guessed.has(l)) return;
    hangman.guessed.add(l);
    if (!hangman.word.includes(l)) hangman.wrong++;
    const won = hangman.word.split('').every(c => hangman.guessed.has(c));
    const lost = hangman.wrong >= 6;
    if (won) {
      hangman.over = true; hangman.wins++;
      localStorage.setItem('hangmanWins', hangman.wins);
      document.getElementById('hangman-wins').textContent = 'Wins: ' + hangman.wins;
      document.getElementById('hangman-msg').textContent = '🎉 You got it!';
    } else if (lost) {
      hangman.over = true; hangman.losses++;
      localStorage.setItem('hangmanLosses', hangman.losses);
      document.getElementById('hangman-losses').textContent = 'Losses: ' + hangman.losses;
      document.getElementById('hangman-msg').textContent = '💀 The word was ' + hangman.word;
    }
    hangmanRender();
  }

})();