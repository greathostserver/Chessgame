// Core chess rules: board, move generation, legality filter, check/mate/stalemate

export const files = ['a','b','c','d','e','f','g','h'];
export const ranks = ['8','7','6','5','4','3','2','1'];
export const initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function idxToCoord(i){return files[i%8]+ranks[Math.floor(i/8)];}
export function coordToIdx(c){const f=files.indexOf(c[0]);const r=ranks.indexOf(c[1]);return r*8+f;}
export function inBoardIdx(i){return i>=0&&i<64;}
export function isWhite(p){return p&&p===p.toUpperCase();}
export function isBlack(p){return p&&p.toLowerCase()===p;}

export const state = {
  board: Array(64).fill(null),
  whiteToMove: true,
  castleRights: {K:true,Q:true,k:true,q:true},
  enPassant: null,
  halfmoveClock: 0,
  fullmoveNumber: 1,
  historySAN: [],
  undoStack: []
};

export function loadFEN(fen){
  state.board = Array(64).fill(null);
  const parts = fen.split(' ');
  if(parts.length < 1) return;
  
  // 1. موقعیت مهره‌ها
  const rows = parts[0].split('/');
  let i = 0;
  for(let row=0;row<8;row++){
    const s = rows[row];
    for(const ch of s){
      if(/[1-8]/.test(ch)) i += parseInt(ch,10);
      else state.board[i++] = ch;
    }
  }

  // 2. نوبت حرکت
  state.whiteToMove = parts[1] === 'w';

  // 3. حقوق قلعه‌روی
  const castling = parts[2] || '-';
  state.castleRights.K = castling.includes('K');
  state.castleRights.Q = castling.includes('Q');
  state.castleRights.k = castling.includes('k');
  state.castleRights.q = castling.includes('q');

  // 4. آنپاسان
  state.enPassant = parts[3] !== '-' ? parts[3] : null;

  // 5 و 6. شمارنده‌ها
  state.halfmoveClock = parseInt(parts[4] || '0', 10);
  state.fullmoveNumber = parseInt(parts[5] || '1', 10);

  // بازنشانی تاریخچه
  state.historySAN.length = 0;
  state.undoStack.length = 0;
}

function knightReach(f,t){const fx=f%8,fy=Math.floor(f/8),tx=t%8,ty=Math.floor(t/8);const dx=Math.abs(tx-fx),dy=Math.abs(ty-fy);return dx*dy===2;}

export function squareAttacked(idx,byWhite,board=state.board){
  for(let i=0;i<64;i++){
    const p=board[i]; if(!p) continue;
    if(byWhite ? !isWhite(p) : !isBlack(p)) continue;
    const P=p.toUpperCase(); 
    const dir=byWhite?-1:1;
    const fx=i%8, fy=Math.floor(i/8);
    const tx=idx%8, ty=Math.floor(idx/8);
    
    if(P==='P'){
      const pawnDir = byWhite ? -1 : 1;
      if(fy+pawnDir === ty && Math.abs(fx-tx) === 1) return true;
    } else if(P==='N'){
      if(knightReach(i,idx)) return true;
    } else if(P==='B'||P==='R'||P==='Q'){
      const rays=(P==='B')?[[1,1],[1,-1],[-1,1],[-1,-1]]
                 :(P==='R')?[[1,0],[-1,0],[0,1],[0,-1]]
                 :[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
      for(const [dx,dy] of rays){
        let x=fx+dx, y=fy+dy;
        while(x>=0&&x<8&&y>=0&&y<8){
          const tIdx=y*8+x;
          if(tIdx===idx) return true;
          if(board[tIdx]) break;
          x+=dx; y+=dy;
        }
      }
    } else if(P==='K'){
      if(Math.abs(fx-tx) <= 1 && Math.abs(fy-ty) <= 1) return true;
    }
  }
  return false;
}

export function findKingIdx(w){
  const k=w?'K':'k'; 
  for(let i=0;i<64;i++) if(state.board[i]===k) return i; 
  return -1;
}

export function inCheck(w){
  const kingIdx = findKingIdx(w);
  return kingIdx >= 0 && squareAttacked(kingIdx, !w, state.board);
}

// بقیه توابع بدون تغییر می‌مانند...
// [کدهای باقیمانده بدون تغییر]
