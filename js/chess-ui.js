let engineWorker = null;
let engineReady = false;
const listeners = new Set();

export function onBestMove(cb){ listeners.add(cb); return ()=>listeners.delete(cb); }

export function initEngine(){
  if(engineWorker) return;
  // مسیر درست برای Pages
  engineWorker = new Worker('./engine/stockfish.js');

  engineWorker.onmessage = (e)=>{
    const msg = String(e.data || '');
    if(msg.includes('uciok')) engineReady = true;
    if(msg.startsWith('bestmove')){
      const move = msg.split(' ')[1] || '';
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

export function goBestMove(fen, depth=12, movelistLAN=''){
  if(!engineWorker || !engineReady) return;
  const pos = movelistLAN ? `position fen ${fen} moves ${movelistLAN}` : `position fen ${fen}`;
  engineWorker.postMessage(pos);
  engineWorker.postMessage(`go depth ${depth}`);
}
