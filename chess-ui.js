import { initEngine, goBestMove, onBestMove } from './uci-bridge.js';

const boardEl = document.getElementById('board');

const state = {
  board: [
    'r','n','b','q','k','b','n','r',
    'p','p','p','p','p','p','p','p',
    null,null,null,null,null,null,null,null,
    null,null,null,null,null,null,null,null,
    null,null,null,null,null,null,null,null,
    null,null,null,null,null,null,null,null,
    'P','P','P','P','P','P','P','P',
    'R','N','B','Q','K','B','N','R'
  ],
  whiteToMove: true,
  castleRights: { K:true, Q:true, k:true, q:true },
  enPassant: '-',
  halfmoveClock: 0,
  fullmoveNumber: 1
};

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

// راه‌اندازی موتور
initEngine();

// دریافت حرکت از هوش مصنوعی
onBestMove((move)=>{
  console.log('AI MOVE:', move);
  // اینجا بعداً می‌تونیم اعمال حرکت واقعی رو هم اضافه کنیم
});

// مثال تستی برای گرفتن حرکت
document.getElementById('ai-move').addEventListener('click', ()=>{
  const fen = fenFromBoard();
  goBestMove(fen, 12);
});
