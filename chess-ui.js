import { state, initialFEN, loadFEN, legalMoves, makeMove, moveToSAN, idxToCoord, undo } from './chess-rules.js';
import { initEngine, setOptions, goBestMove, onBestMove } from './uci-bridge.js';

const boardEl = document.getElementById('board');
const movesListEl = document.getElementById('movesList');
const turnInfo = document.getElementById('turnInfo');
const resultEl = document.getElementById('result');
const toast = document.getElementById('toast');

let ui = {
  flipped: false,
  aiSide: localStorage.getItem('chess_ai_side') || 'none',
  aiDepth: parseInt(localStorage.getItem('chess_ai_depth')||'10',10),
  moveListLAN: []
};

function showToast(t){
  toast.textContent = t;
  toast.classList.remove('hide');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>toast.classList.add('hide'), 1800);
}

function pieceIcon(p){
  const map={'P':'♙','R':'♖','N':'♘','B':'♗','Q':'♕','K':'♔','p':'♟','r':'♜','n':'♞','b':'♝','q':'♛','k':'♚'};
  return map[p] || '?';
}

function applyTheme(sel){
  if(sel==='dark'){
    document.documentElement.style.setProperty('--light','#c7c7c7');
    document.documentElement.style.setProperty('--dark','#4b5563');
  } else if(sel==='wood'){
    document.documentElement.style.setProperty('--light','#f2d1a3');
    document.documentElement.style.setProperty('--dark','#6b4b2b');
  } else {
    document.documentElement.style.setProperty('--light','#f0d9b5');
    document.documentElement.style.setProperty('--dark','#b58863');
  }
}

function renderBoard(){
  boardEl.innerHTML='';
  for(let r=0;r<8;r++){
    for(let f=0;f<8;f++){
      let rr=r, ff=f;
      if(ui.flipped){ rr = 7 - r; ff = 7 - f; }
      const idx = rr*8 + ff;
      const sq = document.createElement('div');
      sq.className = 'square '+(((r+f)%2===0)?'light':'dark');
      sq.dataset.idx = idx;
      const p = state.board[idx];
      if(p){
        const el = document.createElement('div');
        el.className = 'piece '+(p===p.toUpperCase()?'white':'black');
        el.textContent = pieceIcon(p);
        el.draggable = true;
        el.dataset.idx = idx;
        sq.appendChild(el);
      }
      boardEl.appendChild(sq);
    }
  }
  bindInteractions();
  renderStatus();
}

function renderStatus(){
  turnInfo.textContent = state.whiteToMove ? 'نوبت سفید' : 'نوبت سیاه';
  if(state.historySAN.length){
    document.getElementById('movesList').innerHTML = state.historySAN.map((m,i)=> ((i%2===0)?('<div>'+Math.floor(i/2+1)+'. '+m) : ('<div style="margin-left:10px">'+m))).join('');
  } else {
    movesListEl.innerHTML = '';
  }
}

let selectedIdx = null;
let legalTargets = [];

function canMove(idx){
  const p = state.board[idx];
  if(!p) return false;
  const isWhitePiece = p===p.toUpperCase();
  if(state.whiteToMove && !isWhitePiece) return false;
  if(!state.whiteToMove && isWhitePiece) return false;
  if(ui.aiSide === (state.whiteToMove ? 'w':'b')) return false;
  return true;
}

function bindInteractions(){
  const squares = [...document.querySelectorAll('.square')];
  const pieces = [...document.querySelectorAll('.piece')];

  squares.forEach(sq=>{
    sq.onclick = ()=>{
      const idx = parseInt(sq.dataset.idx,10);
      const p = state.board[idx];
      if(p && ((state.whiteToMove && p===p.toUpperCase()) || (!state.whiteToMove && p===p.toLowerCase()))){
        selectedIdx = idx;
        legalTargets = legalMoves(state.whiteToMove).filter(m=>m.from===idx).map(m=>m.to);
        highlight();
      } else if(selectedIdx!==null){
        attemptMove(selectedIdx, idx);
        clearSelection();
      }
    };
  });

  pieces.forEach(pc=>{
    pc.ondragstart = (e)=>{
      const idx = parseInt(pc.dataset.idx,10);
      if(!canMove(idx)){ e.preventDefault(); showToast('حرکت غیرقانونی'); return; }
      selectedIdx = idx;
      legalTargets = legalMoves(state.whiteToMove).filter(m=>m.from===idx).map(m=>m.to);
      e.dataTransfer.setData('text/plain', String(idx));
      highlight();
    };
  });

  squares.forEach(sq=>{
    sq.ondragover = (e)=> e.preventDefault();
    sq.ondrop = (e)=>{
      e.preventDefault();
      const from = selectedIdx ?? parseInt(e.dataTransfer.getData('text/plain'),10);
      const to = parseInt(sq.dataset.idx,10);
      attemptMove(from,to);
      clearSelection();
    };
  });
}

function highlight(){
  document.querySelectorAll('.square').forEach(s=>s.classList.remove('highlight','moveFrom'));
  if(selectedIdx===null) return;
  const fromSq = [...document.querySelectorAll('.square')].find(s=>parseInt(s.dataset.idx,10)===selectedIdx);
  if(fromSq) fromSq.classList.add('moveFrom');
  legalTargets.forEach(t=>{
    const sq = [...document.querySelectorAll('.square')].find(s=>parseInt(s.dataset.idx,10)===t);
    if(sq) sq.classList.add('highlight');
  });
}

function clearSelection(){ selectedIdx = null; legalTargets = []; highlight(); }

function attemptMove(fromIdx,toIdx){
  const mv = legalMoves(state.whiteToMove).find(m=>m.from===fromIdx && m.to===toIdx);
  if(!mv){ showToast('حرکت غیرقانونی'); return; }
  const san = moveToSAN(mv);
  makeMove(mv);
  state.historySAN.push(san);
  ui.moveListLAN.push( san.replace(/=/g,'') ); // simplification
  renderBoard();
  scheduleAI();
}

function scheduleAI(){
  const side = state.whiteToMove ? 'w' : 'b';
  if(ui.aiSide === 'none') return;
  if(ui.aiSide !== side) return;
  const fen = fenFromBoard();
  const depth = ui.aiDepth || 10;
  const movesStr = ui.moveListLAN.join(' ');
  goBestMove(fen, depth, movesStr);
}

function onBestMoveHandler(bestmove){
  if(!bestmove || bestmove.length < 4) return;
  const fromFile=bestmove[0], fromRank=bestmove[1];
  const toFile=bestmove[2], toRank=bestmove[3];
  const fromIdx = (8 - parseInt(fromRank,10))*8 + 'abcdefgh'.indexOf(fromFile);
  const toIdx = (8 - parseInt(toRank,10))*8 + 'abcdefgh'.indexOf(toFile);

  let mv = legalMoves(state.whiteToMove).find(m=>m.from===fromIdx && m.to===toIdx) || null;
  if(!mv && bestmove.length>=5){
    const prom = bestmove[4].toUpperCase();
    const candidate = legalMoves(state.whiteToMove).find(m=>m.from===fromIdx && m.to===toIdx && m.prom===prom);
    if(candidate) mv=candidate;
  }
  if(!mv) return;
  const san = moveToSAN(mv);
  makeMove(mv);
  state.historySAN.push(san);
  ui.moveListLAN.push(bestmove);
  renderBoard();
}

function fenFromBoard(){
  let fen=''; 
  for(let r=0;r<8;r++){
    let empty=0; 
    for(let f=0;f<8;f++){
      const idx=r*8+f; 
      const p=state.board[idx];
      if(!p){
        empty++;
      } else {
        if(empty>0){
          fen+=empty; 
          empty=0;
        }
        fen+=p;
      }
    }
    if(empty>0) fen+=empty;
    if(r<7) fen+='/';
  }

  const stm = state.whiteToMove ? 'w' : 'b';

  let castling = '';
  if(state.castleRights.K) castling += 'K';
  if(state.castleRights.Q) castling += 'Q';
  if(state.castleRights.k) castling += 'k';
  if(state.castleRights.q) castling += 'q';
  if(castling === '') castling = '-';

  const ep = state.enPassant || '-';
  const half = state.halfmoveClock || 0;
  const full = state.fullmoveNumber || 1;

  return `${fen} ${stm} ${castling} ${ep} ${half} ${full}`;
}

// UI controls
document.getElementById('newBtn').onclick = ()=>{
  loadFEN(initialFEN);
  ui.moveListLAN.length = 0;
  renderBoard();
  showToast('شروع جدید');
};

document.getElementById('flipBtn').onclick = ()=>{
  ui.flipped = !ui.flipped; renderBoard();
};

document.getElementById('undoBtn').onclick = ()=>{
  const ok = undo();
  if(ok){ ui.moveListLAN.pop(); renderBoard(); showToast('بازگشت انجام شد'); }
};

document.getElementById('applyAI').onclick = ()=>{
  ui.aiSide = document.getElementById('aiSide').value;
  ui.aiDepth = parseInt(document.getElementById('aiLevel').value,10);
  localStorage.setItem('chess_ai_side', ui.aiSide);
  localStorage.setItem('chess_ai_depth', String(ui.aiDepth));
  showToast('AI اعمال شد');
  scheduleAI();
};

document.getElementById('aiMoveBtn').onclick = ()=>{
  const fen = fenFromBoard();
  goBestMove(fen, ui.aiDepth || 10, ui.moveListLAN.join(' '));
};

document.getElementById('themeSel').onchange = (e)=> applyTheme(e.target.value);

// engine init and hooks
initEngine();
setOptions({Threads:1,Hash:32});
onBestMove(onBestMoveHandler);

// initial state
loadFEN(initialFEN);
renderBoard();
