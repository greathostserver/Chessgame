// Core chess rules: board, move generation, legality filter, check/mate/stalemate

export const files = ['a','b','c','d','e','f','g','h'];
export const ranks = ['8','7','6','5','4','3','2','1'];
export const initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

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
  const parts=fen.split('/'); let i=0;
  for(let row=0;row<8;row++){
    const s=parts[row];
    for(const ch of s){
      if(/[1-8]/.test(ch)) i+=parseInt(ch,10);
      else state.board[i++]=ch;
    }
  }
  state.whiteToMove=true;
  state.castleRights={K:true,Q:true,k:true,q:true};
  state.enPassant=null;
  state.halfmoveClock=0;
  state.fullmoveNumber=1;
  state.historySAN.length=0;
  state.undoStack.length=0;
}

function knightReach(f,t){const fx=f%8,fy=Math.floor(f/8),tx=t%8,ty=Math.floor(t/8);const dx=Math.abs(tx-fx),dy=Math.abs(ty-fy);return dx*dy===2;}
export function squareAttacked(idx,byWhite,board=state.board){
  for(let i=0;i<64;i++){
    const p=board[i]; if(!p) continue;
    if(byWhite ? !isWhite(p) : !isBlack(p)) continue;
    const P=p.toUpperCase(); const dir=byWhite?-1:1;
    const fx=i%8, fy=Math.floor(i/8);
    if(P==='P'){
      for(const [dx] of [[-1],[1]]){
        const x=fx+dx, y=fy+dir;
        if(x>=0&&x<8&&y>=0&&y<8){
          const tIdx=y*8+x;
          if(tIdx===idx) return true;
        }
      }
    } else if(P==='N'){
      for(const d of[15,17,6,10,-15,-17,-6,-10]){
        const to=i+d; if(inBoardIdx(to)&&to===idx&&knightReach(i,to)) return true;
      }
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
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const x=fx+dx, y=fy+dy;
        if(x>=0&&x<8&&y>=0&&y<8){
          const tIdx=y*8+x; if(tIdx===idx) return true;
        }
      }
    }
  }
  return false;
}
export function findKingIdx(w){const k=w?'K':'k'; for(let i=0;i<64;i++) if(state.board[i]===k) return i; return -1;}
export function inCheck(w){const k=findKingIdx(w); return squareAttacked(k,!w,state.board);}

function addPawnAdvance(moves,from,to,w){
  const toRank=Math.floor(to/8), promRank=w?0:7;
  if(toRank===promRank){for(const promo of['Q','R','B','N']) moves.push({from,to,piece:state.board[from],prom:promo,capture:null});}
  else moves.push({from,to,piece:state.board[from],prom:null,capture:null});
}
export function generatePseudoMoves(w=true){
  const moves=[]; const board=state.board;
  for(let from=0;from<64;from++){
    const p=board[from]; if(!p) continue;
    if(w?!isWhite(p):!isBlack(p)) continue;
    const P=p.toUpperCase(); const dir=w?-1:1;
    const fx=from%8, fy=Math.floor(from/8);

    if(P==='P'){
      const one=from+8*dir, two=from+16*dir, startRank=w?6:1;
      if(inBoardIdx(one)&&!board[one]) addPawnAdvance(moves,from,one,w);
      if(Math.floor(from/8)===startRank && inBoardIdx(one) && inBoardIdx(two) && !board[one] && !board[two]){
        moves.push({from,to:two,piece:p,capture:null,prom:null,double:true});
      }
      for(const df of[-1,1]){
        const cap=from+8*dir+df; if(!inBoardIdx(cap)) continue;
        const t=board[cap];
        if(t&&(w?isBlack(t):isWhite(t))) moves.push({from,to:cap,piece:p,capture:t,prom:null,enp:false});
        else {const toC=idxToCoord(cap); if(state.enPassant===toC) moves.push({from,to:cap,piece:p,capture:w?'p':'P',enp:true});}
      }
    } else if(P==='N'){
      for(const d of[15,17,6,10,-15,-17,-6,-10]){
        const to=from+d; if(!inBoardIdx(to)||!knightReach(from,to)) continue;
        const t=board[to]; if(!t||(w?isBlack(t):isWhite(t))) moves.push({from,to,piece:p,capture:t||null});
      }
    } else if(P==='B'||P==='R'||P==='Q'){
      const rays=(P==='B')?[[1,1],[1,-1],[-1,1],[-1,-1]]
                 :(P==='R')?[[1,0],[-1,0],[0,1],[0,-1]]
                 :[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
      for(const [dx,dy] of rays){
        let x=fx+dx, y=fy+dy;
        while(x>=0&&x<8&&y>=0&&y<8){
          const to=y*8+x; const t=board[to];
          if(!t) moves.push({from,to,piece:p,capture:null});
          else { if(w?isBlack(t):isWhite(t)) moves.push({from,to,piece:p,capture:t}); break; }
          x+=dx; y+=dy;
        }
      }
    } else if(P==='K'){
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const x=fx+dx, y=fy+dy;
        if(x>=0&&x<8&&y>=0&&y<8){
          const to=y*8+x; const t=board[to];
          if(!t||(w?isBlack(t):isWhite(t))) moves.push({from,to,piece:p,capture:t||null});
        }
      }
      // Castling (simplified but safe squares checked)
      if(w){
        const e1=coordToIdx('e1'),f1=coordToIdx('f1'),g1=coordToIdx('g1'),d1=coordToIdx('d1'),c1=coordToIdx('c1'),b1=coordToIdx('b1');
        if(from===e1&&state.castleRights.K&&!board[f1]&&!board[g1]&&!squareAttacked(e1,false,board)&&!squareAttacked(f1,false,board)&&!squareAttacked(g1,false,board)) moves.push({from:e1,to:g1,piece:p,castle:'K'});
        if(from===e1&&state.castleRights.Q&&!board[d1]&&!board[c1]&&!board[b1]&&!squareAttacked(e1,false,board)&&!squareAttacked(d1,false,board)&&!squareAttacked(c1,false,board)) moves.push({from:e1,to:c1,piece:p,castle:'Q'});
      } else {
        const e8=coordToIdx('e8'),f8=coordToIdx('f8'),g8=coordToIdx('g8'),d8=coordToIdx('d8'),c8=coordToIdx('c8'),b8=coordToIdx('b8');
        if(from===e8&&state.castleRights.k&&!board[f8]&&!board[g8]&&!squareAttacked(e8,true,board)&&!squareAttacked(f8,true,board)&&!squareAttacked(g8,true,board)) moves.push({from:e8,to:g8,piece:p,castle:'k'});
        if(from===e8&&state.castleRights.q&&!board[d8]&&!board[c8]&&!board[b8]&&!squareAttacked(e8,true,board)&&!squareAttacked(d8,true,board)&&!squareAttacked(c8,true,board)) moves.push({from:e8,to:c8,piece:p,castle:'q'});
      }
    }
  }
  return moves;
}

function snapshot(){return{board:state.board.slice(),whiteToMove:state.whiteToMove,castleRights:{...state.castleRights},enPassant:state.enPassant,halfmoveClock:state.halfmoveClock,fullmoveNumber:state.fullmoveNumber};}
function restore(s){state.board=s.board.slice();state.whiteToMove=s.whiteToMove;state.castleRights={...s.castleRights};state.enPassant=s.enPassant;state.halfmoveClock=s.halfmoveClock;state.fullmoveNumber=s.fullmoveNumber;}

function applyMoveNoTurn(move){
  const from=move.from,to=move.to; const piece=state.board[from];
  if(move.enp){const dir=isWhite(piece)?-1:1; const behind=to-8*dir; state.board[behind]=null;}
  if(move.castle){
    if(move.castle==='K'){state.board[coordToIdx('f1')]=state.board[coordToIdx('h1')]; state.board[coordToIdx('h1')]=null;}
    else if(move.castle==='Q'){state.board[coordToIdx('d1')]=state.board[coordToIdx('a1')]; state.board[coordToIdx('a1')]=null;}
    else if(move.castle==='k'){state.board[coordToIdx('f8')]=state.board[coordToIdx('h8')]; state.board[coordToIdx('h8')]=null;}
    else if(move.castle==='q'){state.board[coordToIdx('d8')]=state.board[coordToIdx('a8')]; state.board[coordToIdx('a8')]=null;}
  }
  state.board[to]=move.prom?(isWhite(piece)?move.prom:move.prom.toLowerCase()):piece;
  state.board[from]=null;
}

export function legalMoves(w=true){
  const pseudo=generatePseudoMoves(w); const legal=[];
  for(const mv of pseudo){
    const snap=snapshot();
    applyMoveNoTurn(mv);
    const bad=inCheck(w);
    restore(snap);
    if(!bad) legal.push(mv);
  }
  return legal;
}

export function makeMove(move){
  state.undoStack.push(snapshot());
  const from=move.from,to=move.to; const piece=state.board[from];
  if(move.enp){const dir=isWhite(piece)?-1:1; const behind=to-8*dir; state.board[behind]=null;}
  if(move.castle){
    if(move.castle==='K'){state.board[coordToIdx('f1')]=state.board[coordToIdx('h1')]; state.board[coordToIdx('h1')]=null;}
    else if(move.castle==='Q'){state.board[coordToIdx('d1')]=state.board[coordToIdx('a1')]; state.board[coordToIdx('a1')]=null;}
    else if(move.castle==='k'){state.board[coordToIdx('f8')]=state.board[coordToIdx('h8')]; state.board[coordToIdx('h8')]=null;}
    else if(move.castle==='q'){state.board[coordToIdx('d8')]=state.board[coordToIdx('a8')]; state.board[coordToIdx('a8')]=null;}
  }
  state.board[to]=move.prom?(isWhite(piece)?move.prom:move.prom.toLowerCase()):piece;
  state.board[from]=null;

  if(move.double){
    const toC=idxToCoord(to); const file=toC[0]; const rank=parseInt(toC[1],10);
    const epRank=isWhite(piece)?rank+1:rank-1;
    state.enPassant=file+epRank;
  } else state.enPassant=null;

  const fromC=idxToCoord(from); const toC=idxToCoord(to); const Pu=piece.toUpperCase();
  if(Pu==='K'){if(isWhite(piece)){state.castleRights.K=false; state.castleRights.Q=false;} else {state.castleRights.k=false; state.castleRights.q=false;}}
  if(Pu==='R'){
    if(fromC==='h1'||toC==='h1') state.castleRights.K=false;
    if(fromC==='a1'||toC==='a1') state.castleRights.Q=false;
    if(fromC==='h8'||toC==='h8') state.castleRights.k=false;
    if(fromC==='a8'||toC==='a8') state.castleRights.q=false;
  }
  if(move.capture && move.capture.toUpperCase()==='R'){
    if(toC==='h1') state.castleRights.K=false;
    if(toC==='a1') state.castleRights.Q=false;
    if(toC==='h8') state.castleRights.k=false;
    if(toC==='a8') state.castleRights.q=false;
  }

  const isPawn=Pu==='P';
  if(isPawn||move.capture) state.halfmoveClock=0; else state.halfmoveClock++;
  if(!state.whiteToMove) state.fullmoveNumber++;
  state.whiteToMove=!state.whiteToMove;
}

export function isCheckmate(w){return inCheck(w)&&legalMoves(w).length===0;}
export function isStalemate(w){return !inCheck(w)&&legalMoves(w).length===0;}

export function moveToSAN(mv){
  const from=idxToCoord(mv.from); const to=idxToCoord(mv.to); const p=mv.piece.toUpperCase();
  if(mv.castle==='K'||mv.castle==='k') return 'O-O';
  if(mv.castle==='Q'||mv.castle==='q') return 'O-O-O';
  const pieceChar=(p==='P')?'':p;
  const capture=mv.capture?'x':'';
  const promo=mv.prom?'='+mv.prom:'';
  return pieceChar+(capture?from[0]:'')+capture+to+promo;
}

export function undo(){
  if(!state.undoStack.length) return false;
  const snap=state.undoStack.pop();
  restore(snap);
  if(state.historySAN.length) state.historySAN.pop();
  return true;
}
