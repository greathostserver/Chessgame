// Bridge to Stockfish UCI engine running in a WebWorker.
// Fixed absolute worker path for GitHub Pages, resilient readiness, and retry.

let engineWorker = null;
let engineReady = false;
const listeners = new Set();
let readyPollTimer = null;

export function onBestMove(cb){ listeners.add(cb); return ()=>listeners.delete(cb); }

export function initEngine(){
  if(engineWorker) return;

  // مسیر مطلق برای GitHub Pages: greathostserver.github.io/Chessgame
  engineWorker = new Worker('/Chessgame/engine/stockfish.js');

  engineWorker.onmessage = (e)=>{
    const msg = String(e.data || '').trim();
    if(msg.includes('uciok') || msg.includes('readyok') || msg.toLowerCase().includes('stockfish')){
      engineReady = true;
      engineWorker.postMessage('ucinewgame');
    }
    const line = msg.split('\n').find(l => l.startsWith('bestmove'));
    if(line){
      const move = line.split(' ')[1] || '';
      for(const cb of listeners) cb(move);
    }
    if(engineReady && readyPollTimer){ clearInterval(readyPollTimer); readyPollTimer = null; }
  };

  // UCI init
  engineWorker.postMessage('uci');

  // Poll isready until ready
  let tries = 0;
  readyPollTimer = setInterval(()=>{
    if(engineReady){ clearInterval(readyPollTimer); readyPollTimer = null; return; }
    if(++tries > 20){ clearInterval(readyPollTimer); readyPollTimer = null; engineReady = true; engineWorker.postMessage('ucinewgame'); return; }
    engineWorker.postMessage('isready');
  }, 250);
}

export function setOptions(opts = {}){
  if(!engineWorker) return;
  for(const [k,v] of Object.entries(opts)){
    engineWorker.postMessage(`setoption name ${k} value ${v}`);
  }
}

export function goBestMove(fen, depth=12, movelistLAN=''){
  if(!engineWorker) return;
  if(!engineReady){
    engineWorker.postMessage('isready');
    setTimeout(()=>goBestMove(fen, depth, movelistLAN), 150);
    return;
  }
  const pos = movelistLAN ? `position fen ${fen} moves ${movelistLAN}` : `position fen ${fen}`;
  engineWorker.postMessage(pos);
  engineWorker.postMessage(`go depth ${depth}`);
}
