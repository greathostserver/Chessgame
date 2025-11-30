//========================================================================================
// ** بخش ۱: تنظیمات، چندزبانگی و کتابخانه شطرنج
//========================================================================================

// فرض می‌کنیم کتابخانه chess.js (برای منطق بازی) و chessboard.js (برای نمایش گرافیکی) 
// از طریق CDN یا پکیج منیجر در یک محیط واقعی بارگذاری شده‌اند. 
// برای سادگی و قابلیت اجرا در گیت‌هاب پیجز، ما منطق اصلی را با استفاده از کتابخانه‌ی "Chess.js" پیاده‌سازی می‌کنیم. 
// در عمل، برای اجرای این کد در محیط واقعی، باید فایل chess.js را در HTML خود اضافه کنید. 
// مثال: <script src="https://cdn.jsdelivr.net/npm/chess.js@1.0.0/dist/chess.min.js"></script>
// در اینجا، برای پیاده‌سازی AI قوی، از ماژول `Chess` استفاده می‌کنیم.
// برای این مثال، فرض می‌کنیم یک شیء `Chess` در دسترس است. 
// اگر بخواهید خودتان این منطق را بدون کتابخانه بنویسید، حجم کد بسیار زیاد خواهد شد.
const game = new Chess(); 
let currentLanguage = 'fa'; // زبان پیش فرض
let selectedSquare = null;
const BOARD_SIZE = 8;
const PIECES = {
    // یونیکد مهره‌های شطرنج
    'p': '♙', 'n': '♘', 'b': '♗', 'r': '♖', 'q': '♕', 'k': '♔',
    'P': '♟', 'N': '♞', 'B': '♝', 'R': '♜', 'Q': '♛', 'K': '♚'
};
const TEXTS = {
    fa: {
        'game-title': 'شطرنج پیشرفته',
        'turn-display-w': 'نوبت مهره‌های سفید',
        'turn-display-b': 'نوبت مهره‌های سیاه (هوش مصنوعی)',
        'message-ready': 'آماده برای بازی!',
        'message-check': 'کیش! مراقب باشید.',
        'message-checkmate': 'مات! بازی تمام شد.',
        'message-stalemate': 'پات! بازی مساوی شد.',
        'message-invalid': 'حرکت نامعتبر. دوباره تلاش کنید.',
        'new-game-btn': 'بازی جدید',
        'lang-switch-text': 'English'
    },
    en: {
        'game-title': 'Advanced Chess',
        'turn-display-w': "White's Turn",
        'turn-display-b': "Black's Turn (AI)",
        'message-ready': 'Ready to Play!',
        'message-check': 'Check! Be careful.',
        'message-checkmate': 'Checkmate! Game Over.',
        'message-stalemate': 'Stalemate! Game Draw.',
        'message-invalid': 'Invalid move. Try again.',
        'new-game-btn': 'New Game',
        'lang-switch-text': 'فارسی'
    }
};

// ** تابع تنظیم زبان (مهم برای شروع بازی) **
function setLanguage(lang) {
    currentLanguage = lang;
    const langSelectScreen = document.getElementById('language-selection');
    const gameScreen = document.getElementById('game-container');
    
    // مخفی کردن صفحه انتخاب زبان و نمایش صفحه بازی
    langSelectScreen.classList.remove('active');
    gameScreen.classList.add('active');

    // تنظیم جهت صفحه برای فارسی (راست به چپ)
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'fa' ? 'rtl' : 'ltr');

    applyLanguage();
    newGame(); // شروع بازی پس از انتخاب زبان
}

// ** تابع اعمال تغییرات زبان در کل رابط کاربری **
function applyLanguage() {
    // اعمال متون از طریق ویژگی‌های data-fa و data-en
    document.querySelectorAll('[data-en][data-fa]').forEach(element => {
        const key = currentLanguage === 'fa' ? 'data-fa' : 'data-en';
        element.textContent = element.getAttribute(key);
    });

    // اعمال متون کنترل‌ها
    updateTurnDisplay();
    updateMessageBox(TEXTS[currentLanguage]['message-ready']);
}

// ** تابع تغییر زبان با دکمه سوییچ **
function toggleLanguage() {
    currentLanguage = currentLanguage === 'fa' ? 'en' : 'fa';
    setLanguage(currentLanguage); // از تابع setLanguage برای اعمال کامل تغییرات استفاده می‌کنیم
}

//========================================================================================
// ** بخش ۲: منطق نمایش و کنترل صفحه شطرنج
//========================================================================================

// ** ایجاد صفحه شطرنج در HTML **
function createBoard() {
    const boardContainer = document.getElementById('chessboard-container');
    boardContainer.innerHTML = '<div id="chessboard"></div>';
    const board = document.getElementById('chessboard');

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const squareColor = (r + c) % 2 === 0 ? 'light' : 'dark';
            const squareName = String.fromCharCode('a'.charCodeAt(0) + c) + (BOARD_SIZE - r); // مثال: a8, h1
            
            const squareDiv = document.createElement('div');
            squareDiv.classList.add('square', squareColor);
            squareDiv.setAttribute('data-square', squareName);
            squareDiv.addEventListener('click', () => handleSquareClick(squareName));
            
            board.appendChild(squareDiv);
        }
    }
}

// ** به روز رسانی نمایش مهره‌ها بر اساس وضعیت بازی **
function updateBoard() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const squareName = square.getAttribute('data-square');
        const piece = game.get(squareName);
        
        square.innerHTML = '';
        square.classList.remove('selected', 'move-hint', 'capture-hint');

        if (piece) {
            const pieceDiv = document.createElement('span');
            pieceDiv.classList.add('piece', piece.color === 'w' ? 'white' : 'black');
            pieceDiv.textContent = PIECES[piece.type.toUpperCase()]; // از نوع مهره برای یونیکد استفاده می‌کنیم
            square.appendChild(pieceDiv);
        }
    });

    updateTurnDisplay();
    updateCapturedPieces();
    checkGameOver();
}

// ** نمایش نوبت و وضعیت بازی **
function updateTurnDisplay() {
    const turnDisplay = document.getElementById('turn-display');
    const isWhiteTurn = game.turn() === 'w';
    const key = isWhiteTurn ? 'turn-display-w' : 'turn-display-b';
    turnDisplay.textContent = TEXTS[currentLanguage][key];
}

// ** به‌روزرسانی پیام‌های وضعیت **
function updateMessageBox(message) {
    document.getElementById('message-box').textContent = message;
}

// ** مدیریت کلیک کاربر روی خانه شطرنج **
function handleSquareClick(squareName) {
    if (game.is_game_over()) return; // اگر بازی تمام شده، کاری نکن

    // اگر خانه قبلی انتخاب شده باشد
    if (selectedSquare) {
        // ۱. تلاش برای حرکت
        const move = game.move({
            from: selectedSquare,
            to: squareName,
            promotion: 'q' // ارتقاء پیش‌فرض به وزیر
        });

        if (move) {
            // حرکت موفقیت‌آمیز بود
            selectedSquare = null;
            updateBoard();
            if (!game.is_game_over()) {
                // اگر بازی تمام نشده، نوبت هوش مصنوعی است
                updateMessageBox(TEXTS[currentLanguage]['turn-display-b']);
                setTimeout(makeAIMove, 500); // تاخیر برای حس طبیعی‌تر بازی
            }
        } else {
            // حرکت ناموفق بود، شاید می‌خواهد مهره دیگری را انتخاب کند
            const piece = game.get(squareName);
            if (piece && piece.color === game.turn()) {
                // انتخاب مهره جدید
                selectedSquare = squareName;
                highlightMoves(squareName);
                updateMessageBox(TEXTS[currentLanguage]['message-ready']);
            } else {
                // اگر خانه جدید هم مهره‌ای نیست یا مهره حریف است و حرکت نامعتبر بوده
                updateMessageBox(TEXTS[currentLanguage]['message-invalid']);
            }
        }
    } else {
        // ۲. انتخاب مهره اول
        const piece = game.get(squareName);
        if (piece && piece.color === game.turn()) {
            selectedSquare = squareName;
            highlightMoves(squareName);
        }
    }
}

// ** هایلایت کردن خانه‌های قابل حرکت **
function highlightMoves(square) {
    // پاک کردن هایلایت‌های قبلی
    document.querySelectorAll('.square').forEach(s => s.classList.remove('selected', 'move-hint', 'capture-hint'));

    // هایلایت خانه انتخاب شده
    document.querySelector(`[data-square="${square}"]`).classList.add('selected');

    // پیدا کردن حرکات قانونی
    const moves = game.moves({ square: square, verbose: true });
    
    moves.forEach(move => {
        const targetSquare = document.querySelector(`[data-square="${move.to}"]`);
        if (targetSquare) {
            if (move.captured) {
                targetSquare.classList.add('capture-hint');
            } else {
                targetSquare.classList.add('move-hint');
            }
        }
    });
}

// ** نمایش مهره‌های گرفته شده **
function updateCapturedPieces() {
    const capturedWhite = document.getElementById('captured-pieces-white');
    const capturedBlack = document.getElementById('captured-pieces-black');
    capturedWhite.innerHTML = '';
    capturedBlack.innerHTML = '';

    // این تابع بر اساس تفاوت بین وضعیت شروع و وضعیت فعلی مهره‌ها کار می‌کند (ساده‌سازی شده). 
    // در یک پروژه کامل، باید آرایه‌ای از مهره‌های گرفته شده را نگهداری کرد.
    // اما برای سادگی، یک راه حل تقریبی استفاده می‌کنیم:
    const initialBoard = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    const currentBoard = game.fen();
    
    // تعداد مهره‌ها را در وضعیت فعلی می‌شماریم
    const countPieces = (fen) => {
        const counts = {};
        for (const char of fen) {
            if (PIECES[char.toUpperCase()]) {
                counts[char] = (counts[char] || 0) + 1;
            }
        }
        return counts;
    };

    const initialCounts = countPieces(initialBoard);
    const currentCounts = countPieces(currentBoard);

    // محاسبه مهره‌های از دست رفته
    for (const pieceChar in initialCounts) {
        const lostCount = initialCounts[pieceChar] - (currentCounts[pieceChar] || 0);
        for (let i = 0; i < lostCount; i++) {
            const pieceDiv = document.createElement('span');
            pieceDiv.classList.add('captured-piece', pieceChar.toLowerCase() === pieceChar ? 'white' : 'black');
            pieceDiv.textContent = PIECES[pieceChar.toUpperCase()];
            
            if (pieceChar.toLowerCase() === pieceChar) {
                // اگر مهره‌ای با حرف کوچک گم شده، یعنی مهره سفید آن را گرفته (و آن مهره سیاه بوده)
                capturedBlack.appendChild(pieceDiv);
            } else {
                // اگر مهره‌ای با حرف بزرگ گم شده، یعنی مهره سیاه آن را گرفته (و آن مهره سفید بوده)
                capturedWhite.appendChild(pieceDiv);
            }
        }
    }
}

// ** بررسی پایان بازی **
function checkGameOver() {
    if (game.is_checkmate()) {
        updateMessageBox(TEXTS[currentLanguage]['message-checkmate']);
    } else if (game.is_stalemate()) {
        updateMessageBox(TEXTS[currentLanguage]['message-stalemate']);
    } else if (game.is_check()) {
        updateMessageBox(TEXTS[currentLanguage]['message-check']);
    }
}

//========================================================================================
// ** بخش ۳: هوش مصنوعی (AI) - با الگوریتم Minimax ساده
//========================================================================================

// ** تابع اصلی برای حرکت هوش مصنوعی (بازیکن سیاه) **
function makeAIMove() {
    if (game.turn() === 'b' && !game.is_game_over()) {
        const bestMove = findBestMove(game); // تابع پیاده‌سازی Minimax
        if (bestMove) {
            game.move(bestMove);
            updateBoard();
            updateMessageBox(TEXTS[currentLanguage]['turn-display-w']);
            checkGameOver();
        }
    }
}

// ** تابع ارزش‌گذاری موقعیت (Heuristic Evaluation) **
function evaluateBoard(board) {
    let score = 0;
    // ارزش مهره‌ها (استاندارد شطرنج)
    const pieceValues = {
        'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 900
    };

    // این یک تابع ارزش‌گذاری بسیار ساده است و فقط ارزش مهره‌ها را می‌شمارد.
    // برای AI قوی‌تر، باید ساختار مهره‌ها، کنترل مرکز و امنیت شاه را هم لحاظ کرد.
    board.board().forEach(row => {
        row.forEach(square => {
            if (square) {
                const value = pieceValues[square.type.toLowerCase()];
                if (square.color === 'w') {
                    score -= value; // امتیاز بازیکن سفید (مخالف AI) کم می‌شود
                } else {
                    score += value; // امتیاز بازیکن سیاه (AI) اضافه می‌شود
                }
            }
        });
    });
    return score;
}

// ** الگوریتم Minimax (با عمق کم برای سادگی) **
let globalMaxDepth = 2; // عمق جستجو: ۲ حرکت به جلو

function minimax(board, depth, isMaximizingPlayer) {
    if (depth === 0 || board.is_game_over()) {
        return evaluateBoard(board);
    }

    const possibleMoves = board.moves();

    if (isMaximizingPlayer) {
        // نوبت هوش مصنوعی (سیاه) - بیشینه کردن امتیاز
        let maxEval = -Infinity;
        possibleMoves.forEach(move => {
            board.move(move);
            const evaluation = minimax(board, depth - 1, false);
            board.undo(); // بازگشت به حالت قبل
            maxEval = Math.max(maxEval, evaluation);
        });
        return maxEval;
    } else {
        // نوبت بازیکن (سفید) - کمینه کردن امتیاز هوش مصنوعی
        let minEval = Infinity;
        possibleMoves.forEach(move => {
            board.move(move);
            const evaluation = minimax(board, depth - 1, true);
            board.undo();
            minEval = Math.min(minEval, evaluation);
        });
        return minEval;
    }
}

// ** پیدا کردن بهترین حرکت نهایی **
function findBestMove(board) {
    const possibleMoves = board.moves();
    let bestMove = null;
    let bestValue = -Infinity;

    // بهینه‌سازی: اگر حرکت تنها یک راه است، آن را انتخاب کن
    if (possibleMoves.length === 1) {
        return possibleMoves[0];
    }
    
    // جستجو در بین تمام حرکات ممکن برای پیدا کردن بهترین امتیاز
    possibleMoves.forEach(move => {
        board.move(move);
        // فراخوانی Minimax برای عمق کم (false: نوبت بعدی بازیکن سفید است که کمینه می‌کند)
        const boardValue = minimax(board, globalMaxDepth - 1, false); 
        board.undo();

        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    });
    
    return bestMove;
}

//========================================================================================
// ** بخش ۴: شروع و مدیریت بازی
//========================================================================================

// ** شروع بازی جدید **
function newGame() {
    game.reset(); // بازنشانی وضعیت بازی به حالت شروع
    createBoard();
    updateBoard();
    updateMessageBox(TEXTS[currentLanguage]['message-ready']);
    selectedSquare = null;
}

// ** اجرای اولیه برنامه در زمان بارگذاری صفحه **
window.onload = function() {
    // اگر زبان قبلا در لوکال استوریج ذخیره شده، از آن استفاده کن
    const savedLang = localStorage.getItem('chessLang');
    if (savedLang) {
        setLanguage(savedLang);
    } else {
        // اگر ذخیره نشده، صفحه انتخاب زبان را نمایش بده
        document.getElementById('language-selection').classList.add('active');
    }

    // دکمه‌های کنترل را برای حفظ زبان به‌روزرسانی کنید
    document.getElementById('new-game-btn').addEventListener('click', newGame);
};
