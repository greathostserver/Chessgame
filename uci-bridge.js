let engineWorker = null;
let engineReady = false;
const listeners = new Set();

export function onBestMove(cb){ listeners.add(cb); return ()=>listeners.delete(cb); }

export function initEngine(){
  if(engineWorker) return;
  try {
    engineWorker = new Worker(new URL('./engine/stockfish.js', import.meta.url), { type: 'classic' });
  } catch(e){
    console.error('Could not create worker:', e);
    return;
  }
  engineReady = false;
  engineWorker.onmessage = (e)=>{
    const msg = String(e.data||'').trim();
    console.log('STOCKFISH >', msg);
    if(msg.includes('uciok')) engineWorker.postMessage('isready');
    if(msg.includes('readyok')){
      engineReady = true;
      engineWorker.postMessage('ucinewgame');
    }
    const lines = msg.split(/\r?\n/);
    for(const line of lines){
      if(line.startsWith('bestmove')){
        const mv = line.split(' ')[1] || '';
        for(const cb of listeners) cb(mv);
      }
    }
  };
  engineWorker.postMessage('uci');
}

export function setOptions(opts = {}){
  if(!engineWorker) return;
  for(const [k,v] of Object.entries(opts)) engineWorker.postMessage(`setoption name ${k} value ${v}`);
}

export function goBestMove(fen, depth=12, movelistLAN=''){
  if(!engineWorker) return;
  if(!engineReady){
    setTimeout(()=>goBestMove(fen, depth, movelistLAN), 150);
    return;
  }
  const pos = movelistLAN ? `position fen ${fen} moves ${movelistLAN}` : `position fen ${fen}`;
  engineWorker.postMessage(pos);
  engineWorker.postMessage(`go depth ${depth}`);
}
