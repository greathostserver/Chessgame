import { state, initialFEN, loadFEN, isCheckmate, isStalemate, inCheck, legalMoves, makeMove, moveToSAN, idxToCoord, undo } from './chess-rules.js';
import { initEngine, setOptions, goBestMove, onBestMove } from './uci-bridge.js';

const i18n = {
  fa: { newGame:"شروع بازی جدید", flip:"چرخش صفحه", undo:"بازگشت حرکت", langLabel:"انتخاب زبان", applyLang:"اعمال زبان", themeLabel:"تنظیمات ظاهر و رنگ‌ها", lightLabel:"خانه‌های روشن", darkLabel:"خانه‌های تیره", whitePieceLabel:"رنگ مهره‌های سفید", blackPieceLabel:"رنگ مهره‌های سیاه", applyTheme:"اعمال رنگ‌ها", aiLabel:"هوش مصنوعی: سمت و سطح", applyAI:"اعمال هوش مصنوعی", turnWhite:"نوبت سفید", turnBlack:"نوبت سیاه", statePlaying:"در حال بازی", stateCheck:"کیش!", stateMate:"کیش و مات", stateStalemate:"بن‌بست", illegal:"حرکت غیرقانونی است.", applied:"تنظیمات اعمال شد" },
  en: { newGame:"New game", flip:"Flip board", undo:"Undo", langLabel:"Choose language", applyLang:"Apply language", themeLabel:"Appearance & colors", lightLabel:"Light squares", darkLabel:"Dark squares", whitePieceLabel:"White pieces color", blackPieceLabel:"Black pieces color", applyTheme:"Apply colors", aiLabel:"AI: side & level", applyAI:"Apply AI", turnWhite:"White to move", turnBlack:"Black to move", statePlaying:"Playing", stateCheck:"Check!", stateMate:"Checkmate", stateStalemate:"Stalemate", illegal:"Illegal move.", applied:"Settings applied" },
  ar: { newGame:"بدء لعبة جديدة", flip:"تدوير اللوحة", undo:"تراجع", langLabel:"اختر اللغة", applyLang:"تطبيق اللغة", themeLabel:"إعدادات المظهر والألوان", lightLabel:"المربعات الفاتحة", darkLabel:"المربعات الداكنة", whitePieceLabel:"لون قطع الأبيض", blackPieceLabel:"لون قطع الأسود", applyTheme:"تطبيق الألوان", aiLabel:"الذكاء الاصطناعي: الجانب والمستوى", applyAI:"تطبيق الذكاء الاصطناعي", turnWhite:"دور الأبيض", turnBlack:"دور الأسود", statePlaying:"جارٍ اللعب", stateCheck:"كش!", stateMate:"كش مات", stateStalemate:"تعادل", illegal:"حركة غير قانونية.", applied:"تم تطبيق الإعدادات" }
};

const dom = {
  board: document.getElementById('board'),
  history: document.getElementById('history'),
  turnBadge: document.getElementById('turnBadge'),
  stateBadge: document.getElementById('stateBadge'),
  modal: document.getElementById('modal'),
  backdrop: document.getElementById('modalBackdrop'),
  modalText: document.getElementById('modalText'),
  newBtn: document.getElementById('newGameBtn'),
  flipBtn: document.getElementById('flipBtn'),
  undoBtn: document.getElementById('undoBtn'),
  langSel: document.getElementById('langSelect'),
  applyLang: document.getElementById('applyLang'),
  lightColor: document.getElementById('lightColor'),
  darkColor: document.getElementById('darkColor'),
  whitePieceColor: document.getElementById('whitePieceColor'),
  blackPieceColor: document.getElementById('blackPieceColor'),
  applyTheme: document.getElementById('applyTheme'),
  aiSide: document.getElementById('aiSide'),
  aiLevel: document.getElementById('aiLevel'),
  applyAI: document.getElementById('applyAI')
};

const uiState = {
  lang: localStorage.getItem('chess_lang')||'fa',
  flipped:false,
  aiSide: localStorage.getItem('chess_ai_side')||'none',
  aiDepth: parseInt(localStorage.getItem('chess_ai_depth')||'10',10),
  theme:{
    light:localStorage.getItem('chess_light')||'#f0d9b5',
    dark:localStorage.getItem('chess_dark')||'#b58863',
    pieceW:localStorage.getItem('chess_pieceW')||'#ffffff',
    pieceB:localStorage.getItem('chess_pieceB')||'#111111'
  },
  moveListLAN: []
};

function showModal(text,type='ok',duration=1400){
  dom.modalText.className=type==='warning'?'warning':'ok';
  dom.modalText.textContent=text;
  dom.modal.classList.add('open'); dom.backdrop.classList.add('open');
  dom.backdrop.setAttribute('aria-hidden','false');
  clearTimeout(showModal._t);
  showModal._t=setTimeout(()=>{dom.modal.classList.remove('open'); dom.backdrop.classList.remove('open'); dom.backdrop.setAttribute('aria-hidden','true');},duration);
}

function pieceIcon(p){const map={'P':'♙','R':'♖','N':'♘','B':'♗','Q':'♕','K':'♔','p':'♟','r':'♜','n':'♞','b':'♝','q':'♛','k':'♚'}; return map[p]||'?';}

function applyLang(){
  const t=i18n[uiState.lang];
  dom.newBtn.textContent=t.newGame; dom.flipBtn.textContent=t.flip; dom.undoBtn.textContent=t.undo;
  document.getElementById('langLabel').textContent=t.langLabel; dom.applyLang.textContent=t.applyLang;
  document.getElementById('themeLabel').textContent=t.themeLabel;
  document.getElementById('lightLabel').textContent=t.lightLabel;
  document.getElementById('darkLabel').textContent=t.darkLabel;
  document.getElementById('whitePieceLabel').textContent=t.whitePieceLabel;
  document.getElementById('blackPieceLabel').textContent=t.blackPieceLabel;
  dom.applyTheme.textContent=t.applyTheme;
  document.getElementById('aiLabel').textContent=t.aiLabel;
  dom.applyAI.textContent=t.applyAI;
  const rtl=uiState.lang!=='en';
  document.documentElement.setAttribute('dir',rtl?'rtl':'ltr');
  document.documentElement.setAttribute('lang',uiState.lang);
}

function applyTheme(){
  document.documentElement.style.setProperty('--board-light',uiState.theme.light);
  document.documentElement.style.setProperty('--board-dark',uiState.theme.dark);
  document.documentElement.style.setProperty('--piece-white-color',uiState.theme.pieceW);
  document.documentElement.style.setProperty('--piece-black-color',uiState.theme.pieceB);
  dom.lightColor.value=uiState.theme.light;
  dom.darkColor.value=uiState.theme.dark;
  dom.whitePieceColor.value=uiState.theme.pieceW;
  dom.blackPieceColor.value=uiState.theme.pieceB;
}

function setUndoEnabled(v){ dom.undoBtn.disabled=!v; }

function fenFromBoard(){
  let fen=''; for(let r=0;r<8;r++){
    let empty=0; for(let f=0;f<8;f++){
      const idx=r*8+f; const p=state.board[idx];
      if(!p){empty++;} else { if(empty>0){fen+=empty; empty=0;} fen+=p; }
    }
    if(empty>0) fen+=empty;
    if(r<7) fen+='/';
  }
  fen += ` ${state.whiteToMove?'w':'b'} - - 0 1`;
  return fen;
}

function renderBoard(){
  dom.board.innerHTML='';
  for(let r=0;r<8;r++){
    for(let f=0;f<8;f++){
      let rr=r,ff=f; if(uiState.flipped){rr=7-r; ff=7-f;}
      const idx=rr*8+ff;
      const sq=document.createElement('div');
      sq.className='square '+(((r+f)%2===0)?'light':'dark');
      sq.dataset.idx=idx;
      const p=state.board[idx];
      if(p){
        const pe=document.createElement('div');
        pe.className='piece '+(p===p.toUpperCase()?'white':'black');
        pe.textContent=pieceIcon(p);
        pe.draggable=true; pe.dataset.idx=idx;
        sq.appendChild(pe);
      }
      dom.board.appendChild(sq);
    }
  }
  bindInteractions(); renderStatus();
}
