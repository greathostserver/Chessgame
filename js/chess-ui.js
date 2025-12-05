import { state, initialFEN, loadFEN, isCheckmate, isStalemate, inCheck, legalMoves, makeMove, moveToSAN, idxToCoord, undo } from './chess-rules.js';
import { initEngine, setOptions, goBestMove, onBestMove } from './uci-bridge.js';

const i18n={fa:{newGame:"شروع بازی جدید",flip:"چرخش صفحه",undo:"بازگشت حرکت",langLabel:"انتخاب زبان",applyLang:"اعمال زبان",themeLabel:"تنظیمات ظاهر و رنگ‌ها",lightLabel:"خانه‌های روشن",darkLabel:"خانه‌های تیره",whitePieceLabel:"رنگ مهره‌های سفید",blackPieceLabel:"رنگ مهره‌های سیاه",applyTheme:"اعمال رنگ‌ها",aiLabel:"هوش مصنوعی: سمت و سطح",applyAI:"اعمال هوش مصنوعی",turnWhite:"نوبت سفید",turnBlack:"نوبت سیاه",statePlaying:"در حال بازی",stateCheck:"کیش!",stateMate:"کیش و مات",stateStalemate:"بن‌بست",illegal:"حرکت غیرقانونی است.",applied:"تنظیمات اعمال شد"},en:{newGame:"New game",flip:"Flip board",undo:"Undo",langLabel:"Choose language",applyLang:"Apply language",themeLabel:"Appearance & colors",lightLabel:"Light squares",darkLabel:"Dark squares",whitePieceLabel:"White pieces color",blackPieceLabel:"Black pieces color",applyTheme:"Apply colors",aiLabel:"AI: side & level",applyAI:"Apply AI",turnWhite:"White to move",turnBlack:"Black to move",statePlaying:"Playing",stateCheck:"Check!",stateMate:"Checkmate",stateStalemate:"Stalemate",illegal:"Illegal move.",applied:"Settings applied"},ar:{newGame:"بدء لعبة جديدة",flip:"تدوير اللوحة",undo:"تراجع",langLabel:"اختر اللغة",applyLang:"تطبيق اللغة",themeLabel:"إعدادات المظهر والألوان",lightLabel:"المربعات الفاتحة",darkLabel:"المربعات الداكنة",whitePieceLabel:"لون قطع الأبيض",blackPieceLabel:"لون قطع الأسود",applyTheme:"تطبيق الألوان",aiLabel:"الذكاء الاصطناعي: الجانب والمستوى",applyAI:"تطبيق الذكاء الاصطناعي",turnWhite:"دور الأبيض",turnBlack:"دور الأسود",statePlaying:"جارٍ اللعب",stateCheck:"كش!",stateMate:"كش مات",stateStalemate:"تعادل",illegal:"حركة غير قانونية.",applied:"تم تطبيق الإعدادات"}};

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

function renderStatus(){
  const t=i18n[uiState.lang];
  dom.turnBadge.textContent=state.whiteToMove?t.turnWhite:t.turnBlack;
  let s=t.statePlaying;
  if(isCheckmate(state.whiteToMove)) s=t.stateMate;
  else if(isStalemate(state.whiteToMove)) s=t.stateStalemate;
  else if(inCheck(state.whiteToMove)) s=t.stateCheck;
  dom.stateBadge.textContent=s;
  if(s===t.stateMate) showModal(t.stateMate,'warning',2200);
  else if(s===t.stateStalemate) showModal(t.stateStalemate,'warning',2000);
  else if(s===t.stateCheck) showModal(t.stateCheck,'warning',1200);
}

function renderHistory(){
  dom.history.innerHTML='';
  const hdr=document.createElement('div'); hdr.className='history-item'; hdr.innerHTML=`<div class="num">#</div><div>Moves</div><div></div>`;
  dom.history.appendChild(hdr);
  for(let i=0;i<state.historySAN.length;i+=2){
    const w=state.historySAN[i]||'', b=state.historySAN[i+1]||'';
    const row=document.createElement('div');
    row.className='history-item';
    row.innerHTML=`<div class="num">${Math.floor(i/2)+1}.</div><div>${w}</div><div>${b}</div>`;
    dom.history.appendChild(row);
  }
  dom.history.scrollTop=dom.history.scrollHeight;
}

let selectedIdx=null; let legalTargets=[];
function canDragPiece(idx){
  const p=state.board[idx];
  if(!p) return false;

  const isWhitePiece = p===p.toUpperCase();
  const sideToMove = state.whiteToMove ? 'w' : 'b';

  if(state.whiteToMove && !isWhitePiece) return false;
  if(!state.whiteToMove && isWhitePiece) return false;

  // اگر نوبت سمت AI است، حرکت دستی ممنوع
  if(uiState.aiSide === sideToMove) return false;

  return true;
}

function bindInteractions(){
  const squares=[...document.querySelectorAll('.square')];
  const pieces=[...document.querySelectorAll('.piece')];

  squares.forEach(sq=>{
    sq.addEventListener('pointerup',()=>{
      const idx=parseInt(sq.dataset.idx,10);
      const p=state.board[idx];

      const sideToMove = state.whiteToMove ? 'w' : 'b';
      if(uiState.aiSide === sideToMove){
        showModal(i18n[uiState.lang].illegal,'warning');
        return;
      }

      if(p&&((state.whiteToMove&&p===p.toUpperCase())||(!state.whiteToMove&&p===p.toLowerCase()))){
        selectedIdx=idx;
        legalTargets=legalMoves(state.whiteToMove).filter(m=>m.from===idx).map(m=>m.to);
        highlightSelection();
      } else if(selectedIdx!==null) {
        attemptMove(selectedIdx,idx);
        clearSelection();
      }
    },{passive:true});
  });

  pieces.forEach(pc=>{
    pc.addEventListener('dragstart',(e)=>{
      const idx=parseInt(pc.dataset.idx,10);
      if(!canDragPiece(idx)){e.preventDefault(); showModal(i18n[uiState.lang].illegal,'warning'); return;}
      selectedIdx=idx;
      legalTargets=legalMoves(state.whiteToMove).filter(m=>m.from===idx).map(m=>m.to);
      e.dataTransfer.setData('text/plain',idx.toString());
      highlightSelection();
    });
  });
  squares.forEach(sq=>{
    sq.addEventListener('dragover',(e)=>{e.preventDefault();});
    sq.addEventListener('drop',(e)=>{
      e.preventDefault();
      const sideToMove = state.whiteToMove ? 'w' : 'b';
      if(uiState.aiSide === sideToMove){ showModal(i18n[uiState.lang].illegal,'warning'); return; }
      const from=selectedIdx??parseInt(e.dataTransfer.getData('text/plain'),10);
      const to=parseInt(sq.dataset.idx,10);
      attemptMove(from,to);
      clearSelection();
    });
  });
}

function highlightSelection(){
  document.querySelectorAll('.square').forEach(s=>s.classList.remove('highlight','hint'));
  if(selectedIdx===null) return;
  const selSq=[...document.querySelectorAll('.square')].find(s=>parseInt(s.dataset.idx,10)===selectedIdx);
  if(selSq) selSq.classList.add('highlight');
  legalTargets.forEach(to=>{
    const tSq=[...document.querySelectorAll('.square')].find(s=>parseInt(s.dataset.idx,10)===to);
    if(tSq) tSq.classList.add('hint');
  });
}
function clearSelection(){selectedIdx=null; legalTargets=[]; highlightSelection();}

function attemptMove(fromIdx,toIdx){
  const mv=legalMoves(state.whiteToMove).find(m=>m.from===fromIdx&&m.to===toIdx);
  if(!mv){showModal(i18n[uiState.lang].illegal,'warning'); return;}
  const san=moveToSAN(mv);
  const from = idxToCoord(mv.from); const to = idxToCoord(mv.to);
  const lan = (mv.prom ? `${from}${to}${mv.prom.toLowerCase()}` : `${from}${to}`);
  uiState.moveListLAN.push(lan);

  makeMove(mv);
  state.historySAN.push(san);
  setUndoEnabled(state.undoStack.length>0);
  renderBoard();
  renderHistory();
  scheduleAI();
}

function scheduleAI(){
  const sideToMove=state.whiteToMove?'w':'b';
  if(uiState.aiSide==='none') return;
  if(uiState.aiSide!==sideToMove) return;

  const fen=fenFromBoard();
  const depth=uiState.aiDepth||10;
  const movesStr=uiState.moveListLAN.join(' ');
  goBestMove(fen, depth, movesStr);
}

function applyAIControls(){
  uiState.aiSide = dom.aiSide.value;
  uiState.aiDepth = parseInt(dom.aiLevel.value,10);
  localStorage.setItem('chess_ai_side', uiState.aiSide);
  localStorage.setItem('chess_ai_depth', String(uiState.aiDepth));
  showModal(i18n[uiState.lang].applied,'ok');
  scheduleAI();
}

function onBestMoveHandler(bestmove){
  if(!bestmove || bestmove.length<4) return;
  const fromFile=bestmove[0], fromRank=bestmove[1];
  const toFile=bestmove[2], toRank=bestmove[3];
  const fromIdx = (8 - parseInt(fromRank,10))*8 + 'abcdefgh'.indexOf(fromFile);
  const toIdx = (8 - parseInt(toRank,10))*8 + 'abcdefgh'.indexOf(toFile);

  let mv = legalMoves(state.whiteToMove).find(m=>m.from===fromIdx&&m.to===toIdx) || null;
  if(!mv && bestmove.length>=5){
    const prom = bestmove[4].toUpperCase();
    const candidate = legalMoves(state.whiteToMove).find(m=>m.from===fromIdx&&m.to===toIdx&&m.prom===prom);
    if(candidate) mv=candidate;
  }
  if(!mv) return;

  const san=moveToSAN(mv);
  makeMove(mv);
  state.historySAN.push(san);
  uiState.moveListLAN.push(bestmove);
  setUndoEnabled(state.undoStack.length>0);
  renderBoard();
  renderHistory();
}

function boot(){
  initEngine();
  setOptions({Threads: 1, Hash: 32});

  applyLang();
  applyTheme();

  dom.langSel.value = uiState.lang;
  dom.aiSide.value = uiState.aiSide;
  dom.aiLevel.value = String(uiState.aiDepth);

  dom.newBtn.addEventListener('pointerup',()=>{
    loadFEN(initialFEN);
    uiState.moveListLAN.length=0;
    renderBoard(); renderHistory(); setUndoEnabled(false);
    showModal(i18n[uiState.lang].applied,'ok');
    scheduleAI();
  });
  dom.flipBtn.addEventListener('pointerup',()=>{uiState.flipped=!uiState.flipped; renderBoard(); showModal(i18n[uiState.lang].applied,'ok');});
  dom.undoBtn.addEventListener('pointerup',()=>{
    if(!state.undoStack.length){showModal(i18n[uiState.lang].illegal,'warning'); return;}
    const ok = undo();
    if(ok){ uiState.moveListLAN.pop(); }
    renderBoard(); renderHistory(); setUndoEnabled(state.undoStack.length>0); showModal(i18n[uiState.lang].applied,'ok');
  });
  dom.applyLang.addEventListener('pointerup',()=>{
    uiState.lang=dom.langSel.value; localStorage.setItem('chess_lang',uiState.lang);
    applyLang(); renderBoard(); renderHistory(); showModal(i18n[uiState.lang].applied,'ok');
  });
  dom.applyTheme.addEventListener('pointerup',()=>{
    uiState.theme.light=dom.lightColor.value; uiState.theme.dark=dom.darkColor.value; uiState.theme.pieceW=dom.whitePieceColor.value; uiState.theme.pieceB=dom.blackPieceColor.value;
    localStorage.setItem('chess_light',uiState.theme.light); localStorage.setItem('chess_dark',uiState.theme.dark); localStorage.setItem('chess_pieceW',uiState.theme.pieceW); localStorage.setItem('chess_pieceB',uiState.theme.pieceB);
    applyTheme(); renderBoard(); showModal(i18n[uiState.lang].applied,'ok');
  });
  dom.applyAI.addEventListener('pointerup',applyAIControls);

  onBestMove(onBestMoveHandler);

  loadFEN(initialFEN);
  renderBoard();
  renderHistory();

  scheduleAI();
}
boot();
