import { state, initialFEN, loadFEN, isCheckmate, isStalemate, inCheck, legalMoves, makeMove, moveToSAN, idxToCoord, undo } from './chess-rules.js';
import { initEngine, setOptions, goBestMove, onBestMove, isEngineReady } from './uci-bridge.js';

const i18n = {
  fa: {
    newGame: "شروع بازی جدید", flip: "چرخش صفحه", undo: "بازگشت حرکت",
    langLabel: "انتخاب زبان", applyLang: "اعمال زبان",
    themeLabel: "تنظیمات ظاهر و رنگ‌ها", lightLabel: "خانه‌های روشن",
    darkLabel: "خانه‌های تیره", whitePieceLabel: "رنگ مهره‌های سفید",
    blackPieceLabel: "رنگ مهره‌های سیاه", applyTheme: "اعمال رنگ‌ها",
    aiLabel: "هوش مصنوعی: سمت و سطح", applyAI: "اعمال هوش مصنوعی",
    turnWhite: "نوبت سفید", turnBlack: "نوبت سیاه",
    statePlaying: "در حال بازی", stateCheck: "کیش!",
    stateMate: "کیش و مات", stateStalemate: "بن‌بست",
    illegal: "حرکت غیرقانونی است.", applied: "تنظیمات اعمال شد",
    engineLoading: "در حال بارگذاری موتور...", engineReady: "موتور آماده است"
  },
  en: {
    newGame: "New game", flip: "Flip board", undo: "Undo",
    langLabel: "Choose language", applyLang: "Apply language",
    themeLabel: "Appearance & colors", lightLabel: "Light squares",
    darkLabel: "Dark squares", whitePieceLabel: "White pieces color",
    blackPieceLabel: "Black pieces color", applyTheme: "Apply colors",
    aiLabel: "AI: side & level", applyAI: "Apply AI",
    turnWhite: "White to move", turnBlack: "Black to move",
    statePlaying: "Playing", stateCheck: "Check!",
    stateMate: "Checkmate", stateStalemate: "Stalemate",
    illegal: "Illegal move.", applied: "Settings applied",
    engineLoading: "Loading engine...", engineReady: "Engine ready"
  },
  ar: {
    newGame: "بدء لعبة جديدة", flip: "تدوير اللوحة", undo: "تراجع",
    langLabel: "اختر اللغة", applyLang: "تطبيق اللغة",
    themeLabel: "إعدادات المظهر والألوان", lightLabel: "المربعات الفاتحة",
    darkLabel: "المربعات الداكنة", whitePieceLabel: "لون قطع الأبيض",
    blackPieceLabel: "لون قطع الأسود", applyTheme: "تطبيق الألوان",
    aiLabel: "الذكاء الاصطناعي: الجانب والمستوى", applyAI: "تطبيق الذكاء الاصطناعي",
    turnWhite: "دور الأبيض", turnBlack: "دور الأسود",
    statePlaying: "جارٍ اللعب", stateCheck: "كش!",
    stateMate: "كش مات", stateStalemate: "تعادل",
    illegal: "حركة غير قانونية.", applied: "تم تطبيق الإعدادات",
    engineLoading: "جاري تحميل المحرك...", engineReady: "المحرك جاهز"
  }
};

// [تعریف dom و uiState بدون تغییر]

async function boot(){
  console.log('Starting chess application...');
  
  // بارگذاری اولیه صفحه
  applyLang();
  applyTheme();
  
  // نمایش وضعیت بارگذاری موتور
  showModal(i18n[uiState.lang].engineLoading, 'ok');
  
  try {
    // راه‌اندازی موتور استاکفیش
    await initEngine();
    console.log('✅ Stockfish engine initialized successfully');
    
    // تنظیم پارامترهای موتور
    setOptions({ 
      Threads: 2, 
      Hash: 64,
      Skill_Level: 20,
      Contempt: 0,
      Move_Overhead: 10
    });
    
    showModal(i18n[uiState.lang].engineReady, 'ok', 1000);
    
  } catch(err) {
    console.error('❌ Failed to initialize Stockfish:', err);
    showModal('خطا در بارگذاری هوش مصنوعی. لطفاً صفحه را رفرش کنید.', 'warning', 3000);
  }
  
  // بارگذاری تنظیمات ذخیره شده
  dom.langSel.value = uiState.lang;
  dom.aiSide.value = uiState.aiSide;
  dom.aiLevel.value = String(uiState.aiDepth);
  
  // رویدادها
  dom.newBtn.addEventListener('click', () => {
    loadFEN(initialFEN);
    uiState.moveListLAN = [];
    renderBoard(); 
    renderHistory(); 
    setUndoEnabled(false);
    showModal(i18n[uiState.lang].applied, 'ok');
    
    // اگر AI فعال است، حرکت کند
    if(uiState.aiSide === 'b') {
      setTimeout(() => scheduleAI(), 500);
    }
  });
  
  // [بقیه رویدادها بدون تغییر]
  
  // ثبت listener برای حرکات AI
  onBestMove((move) => {
    console.log('AI best move:', move);
    if(move && move !== '(none)') {
      setTimeout(() => processAIMove(move), 100);
    }
  });
  
  // بارگذاری وضعیت اولیه بازی
  loadFEN(initialFEN);
  renderBoard();
  renderHistory();
  
  // اگر AI سیاه است، حرکت اول را انجام دهد
  if(uiState.aiSide === 'b') {
    setTimeout(() => scheduleAI(), 1000);
  }
}

// تابع جدید برای پردازش حرکت AI
function processAIMove(bestmove){
  if(!bestmove || bestmove === '(none)' || bestmove.length < 4) {
    console.warn('Invalid AI move:', bestmove);
    return;
  }
  
  // تبدیل حرکت LAN به indices
  const fromFile = bestmove[0], fromRank = bestmove[1];
  const toFile = bestmove[2], toRank = bestmove[3];
  const promotion = bestmove[4] || null;
  
  // تبدیل مختصات به index
  const fromIdx = (8 - parseInt(fromRank, 10)) * 8 + 'abcdefgh'.indexOf(fromFile);
  const toIdx = (8 - parseInt(toRank, 10)) * 8 + 'abcdefgh'.indexOf(toFile);
  
  // یافتن حرکت قانونی
  const legalMovesList = legalMoves(state.whiteToMove);
  let move = legalMovesList.find(m => 
    m.from === fromIdx && 
    m.to === toIdx
  );
  
  // اگر حرکت ارتقا پیاده باشد
  if(!move && promotion) {
    move = legalMovesList.find(m => 
      m.from === fromIdx && 
      m.to === toIdx && 
      m.prom === promotion.toUpperCase()
    );
  }
  
  if(move) {
    console.log('Executing AI move:', move);
    const san = moveToSAN(move);
    const from = idxToCoord(move.from);
    const to = idxToCoord(move.to);
    const lan = move.prom ? `${from}${to}${move.prom.toLowerCase()}` : `${from}${to}`;
    
    uiState.moveListLAN.push(lan);
    makeMove(move);
    state.historySAN.push(san);
    
    setUndoEnabled(state.undoStack.length > 0);
    renderBoard();
    renderHistory();
    
    // بررسی وضعیت پایان بازی
    const side = state.whiteToMove ? 'w' : 'b';
    if(isCheckmate(state.whiteToMove)) {
      showModal(`${side === 'w' ? 'سیاه' : 'سفید'} برنده شد!`, 'warning', 3000);
    } else if(isStalemate(state.whiteToMove)) {
      showModal('بازی مساوی شد!', 'warning', 3000);
    }
  } else {
    console.warn('AI move not found in legal moves:', bestmove);
  }
}

// اصلاح تابع scheduleAI
function scheduleAI(){
  if(uiState.aiSide === 'none') return;
  
  const sideToMove = state.whiteToMove ? 'w' : 'b';
  if(uiState.aiSide !== sideToMove) return;
  
  // اگر بازی تمام شده باشد
  if(isCheckmate(state.whiteToMove) || isStalemate(state.whiteToMove)) {
    return;
  }
  
  console.log('Asking AI for move...');
  const fen = fenFromBoard();
  const depth = uiState.aiDepth || 12;
  const movesStr = uiState.moveListLAN.join(' ');
  
  goBestMove(fen, depth, movesStr);
}

// اصلاح تابع fenFromBoard برای ساخت FEN کامل
function fenFromBoard(){
  let fen = '';
  
  // 1. موقعیت مهره‌ها
  for(let r = 0; r < 8; r++){
    let empty = 0;
    for(let f = 0; f < 8; f++){
      const idx = r * 8 + f;
      const p = state.board[idx];
      if(!p) {
        empty++;
      } else {
        if(empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += p;
      }
    }
    if(empty > 0) fen += empty;
    if(r < 7) fen += '/';
  }
  
  // 2. نوبت حرکت
  fen += state.whiteToMove ? ' w ' : ' b ';
  
  // 3. حقوق قلعه‌روی
  let castling = '';
  if(state.castleRights.K) castling += 'K';
  if(state.castleRights.Q) castling += 'Q';
  if(state.castleRights.k) castling += 'k';
  if(state.castleRights.q) castling += 'q';
  fen += castling || '-';
  
  // 4. آنپاسان
  fen += ' ' + (state.enPassant || '-');
  
  // 5 و 6. شمارنده‌ها
  fen += ' ' + state.halfmoveClock;
  fen += ' ' + state.fullmoveNumber;
  
  return fen;
}

// فراخوانی اصلی
boot();
