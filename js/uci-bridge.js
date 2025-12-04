// Bridge to Stockfish UCI engine running in a WebWorker.
// Provides initEngine(), setOptions(), goBestMove(fen, depth), and emits bestmove.

import { state, initialFEN } from './chess-rules.js';

let engineWorker = null;
let engineReady = false;
const listeners = new Set();

export function onBestMove(cb){ listeners.add(cb); return ()=>listeners.delete(cb); }

export function initEngine(){
  if(engineWorker) return;
  engineWorker = new Worker('../engine/stockfish.js');
  engineWorker.onmessage = (e)=>{
    const msg = String(e.data);
    // console.log('Engine:', msg);
    if(msg.includes('uciok')) engineReady = true;
    if(msg.startsWith('bestmove')){
      const parts = msg.split(' ');
      const move = parts[1] || '';
      for(const cb of listeners) cb(move);
    }
  };
  engineWorker.postMessage('uci');
  engineWorker.postMessage('isready');
  engineWorker.postMessage('ucinewgame');
}

export function setOptions(opts = {}){
  if(!engineWorker) return;
  for(const [k,v] of Object.entries(opts)){
    engineWorker.postMessage(`setoption name ${k} value ${v}`);
  }
}

export function positionFromHistory(){
  // Build moves string from SAN history by replaying to UCI LAN (simple approach uses internal stack; here we recompute from stored undo)
  // For robustness, we’ll reconstruct using our board snapshots externally if needed.
  // Simpler: we track moves in LAN in UI code; see chess-ui.js.
}

export function goBestMove(fen, depth=12, movelistLAN=''){
  if(!engineWorker || !engineReady) return;
  const pos = movelistLAN ? `position fen ${fen} moves ${movelistLAN}` : `position fen ${fen}`;
  engineWorker.postMessage(pos);
  engineWorker.postMessage(`go depth ${depth}`);
}
