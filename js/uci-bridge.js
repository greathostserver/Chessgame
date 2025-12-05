// Bridge to Stockfish UCI engine running in a WebWorker.
// Resilient readiness detection and retry if called too early.

let engineWorker = null;
let engineReady = false;
const listeners = new Set();
let readyPollTimer = null;

export function onBestMove(cb){ listeners.add(cb); return ()=>listeners.delete(cb); }

function normalizeMessage(e){
  const d = e?.data;
  if(d == null) return '';
  if(typeof d === 'string') return d;
  if(typeof d === 'object'){
    if('data' in d && typeof d.data === 'string') return d.data;
    try { return JSON.stringify(d); } catch { return String(d); }
  }
  return String(d);
}

function markReady(){
  if(engineReady) return;
  engineReady = true;
  engineWorker.postMessage('ucinewgame');
}

export function initEngine(){
  if(engineWorker) return;

  // مسیر سازگار با GitHub Pages
  engineWorker = new Worker('./engine/stockfish.js');

  engineWorker.onmessage = (e)=>{
    const msg = normalizeMessage(e).trim();

    // آماده‌بودن
    if(msg.includes('uciok') || msg.includes('readyok') || msg.toLowerCase().includes('stockfish')) markReady();

    // خروجی bestmove (در پیام‌های چندخطی هم پیدا کن)
    const line = msg.split('\n').find(l => l.startsWith('bestmove'));
    if(line){
      const move = line.split(' ')[1] || '';
      for(const cb of listeners) cb(move);
    }

    if(engineReady && readyPollTimer){ clearInterval(readyPollTimer); readyPollTimer = null; }
  };

  // آغاز UCI
  engineWorker.postMessage('uci');

  // پولینگ isready تا آماده شود
  let tries = 0;
  readyPollTimer = setInterval(()=>{
    if(engineReady){ clearInterval(readyPollTimer); readyPollTimer = null; return; }
    if(++tries > 20){ clearInterval(readyPollTimer); readyPollTimer = null; markReady(); return; }
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
