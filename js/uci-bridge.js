// Bridge to Stockfish UCI engine running in a WebWorker.
// Fixed worker path and improved initialization logic.

let engineWorker = null;
let engineReady = false;
const listeners = new Set();

export function onBestMove(cb){ listeners.add(cb); return ()=>listeners.delete(cb); }

export function initEngine(){
  return new Promise((resolve, reject) => {
    if(engineWorker) {
      if(engineReady) resolve();
      return;
    }

    try {
      // مسیر صحیح فایل استاکفیش (بسته به ساختار پروژه تنظیم شود)
      engineWorker = new Worker('./engine/stockfish.js');
      
      engineWorker.onmessage = (e)=>{
        const msg = String(e.data || '').trim();
        console.log('Stockfish:', msg); // برای دیباگ
        
        if(msg.includes('uciok') || msg.includes('readyok')){
          engineReady = true;
          engineWorker.postMessage('ucinewgame');
          resolve();
        }
        
        // پردازش حرکت برگشتی از موتور
        const line = msg.split('\n').find(l => l.startsWith('bestmove'));
        if(line){
          const move = line.split(' ')[1] || '';
          if(move && move !== '(none)') {
            for(const cb of listeners) cb(move);
          }
        }
      };

      engineWorker.onerror = (err) => {
        console.error('Worker error:', err);
        reject(new Error('Stockfish Worker failed to load'));
      };

      // راه‌اندازی اولیه UCI
      engineWorker.postMessage('uci');
      engineWorker.postMessage('isready');

      // تایم‌اوت برای جلوگیری از انتظار نامحدود
      setTimeout(() => {
        if(!engineReady) {
          console.warn('Stockfish timeout, assuming ready');
          engineReady = true;
          resolve();
        }
      }, 5000);

    } catch(err) {
      reject(err);
    }
  });
}

export function setOptions(opts = {}){
  if(!engineWorker || !engineReady) return;
  for(const [k,v] of Object.entries(opts)){
    engineWorker.postMessage(`setoption name ${k} value ${v}`);
  }
  engineWorker.postMessage('isready');
}

export function goBestMove(fen, depth=12, movelistLAN=''){
  if(!engineWorker || !engineReady) {
    console.warn('Engine not ready yet');
    setTimeout(() => goBestMove(fen, depth, movelistLAN), 100);
    return;
  }
  
  const pos = movelistLAN ? `position fen ${fen} moves ${movelistLAN}` : `position fen ${fen}`;
  engineWorker.postMessage(pos);
  engineWorker.postMessage(`go depth ${depth}`);
}

export function isEngineReady() { return engineReady; }
