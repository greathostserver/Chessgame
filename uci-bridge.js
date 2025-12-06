let engineWorker = null;
let engineReady = false;
const listeners = new Set();

export function onBestMove(cb){ 
  listeners.add(cb); 
  return ()=>listeners.delete(cb); 
}

export function initEngine(){
  if(engineWorker) return;

  try {
    engineWorker = new Worker(
      new URL('./engine/stockfish.js', import.meta.url),
      { type: 'classic' }
    );
  } catch (err) {
    console.error('Stockfish Worker Load Failed:', err);
    return;
  }

  engineReady = false;

  engineWorker.onmessage = (e) => {
    const msg = String(e.data || '').trim();
    console.log('STOCKFISH >', msg);

    if (msg.includes('uciok')) {
      engineWorker.postMessage('isready');
    }

    if (msg.includes('readyok')) {
      engineReady = true;
      engineWorker.postMessage('ucinewgame');
    }

    if (msg.startsWith('bestmove')) {
      const move = msg.split(' ')[1];
      if (move) {
        for (const cb of listeners) cb(move);
      }
    }
  };

  engineWorker.postMessage('uci');
}

export function goBestMove(fen, depth=12){
  if(!engineWorker || !engineReady) return;

  engineWorker.postMessage(`position fen ${fen}`);
  engineWorker.postMessage(`go depth ${depth}`);
}
