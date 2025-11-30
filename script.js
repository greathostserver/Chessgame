//========================================================================================
// ** بخش ۱: تنظیمات، چندزبانگی و کتابخانه شطرنج
//========================================================================================

// برای اجرای این کد در گیت‌هاب پیجز، باید فایل chess.js را در HTML اضافه کنید.
// اگر این کار را نکرده‌اید، این کد کار نخواهد کرد.
const Chess = window.Chess; 
const game = new Chess(); 
let currentLanguage = 'fa'; 
let selectedSquare = null;
const BOARD_SIZE = 8;
const PIECES = {
    // یونیکد مهره‌های شطرنج
    'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
    'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'
};
const TEXTS = {
    fa: {
        'game-title': 'شطرنج پیشرفته',
        'turn-display-w': 'نوبت مهره‌های سفید (شما)',
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
        'turn-display-w': "White's Turn (You)",
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

// ** تابع تنظیم زبان (اصلاح شده برای رفع مشکل نمایش) **
function setLanguage(lang) {
    currentLanguage = lang;
    const langSelectScreen = document.getElementById('language-selection');
    const gameScreen = document.getElementById('game-container');
    
    // ۱. مخفی کردن صفحه انتخاب زبان
    langSelectScreen.classList.remove('active');
    
    // ۲. نمایش صفحه اصلی بازی
    gameScreen.classList.add('active');

    // ۳. ذخیره زبان در حافظه مرورگر
    localStorage.setItem('chessLang', lang); 

    // ۴. تنظیم جهت صفحه 
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'fa' ? 'rtl' : 'ltr');

    applyLanguage();
    newGame(); // شروع بازی پس از انتخاب زبان
}

// ** تابع اعمال تغییرات زبان در کل رابط کاربری **
function applyLanguage() {
    document.querySelectorAll('[data-en][data-fa]').forEach(element => {
        const key = currentLanguage === 'fa' ? 'data-fa' : 'data-en';
        element.textContent = element.getAttribute(key);
    });

    updateTurnDisplay();
    updateMessageBox(TEXTS[currentLanguage]['message-ready']);
}

// ** تابع تغییر زبان با دکمه سوییچ **
function toggleLanguage() {
    currentLanguage = currentLanguage === 'fa' ? 'en' : 'fa';
    setLanguage(currentLanguage); 
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
            const squareName = String.fromCharCode('a'.charCodeAt(0) + c) + (BOARD_SIZE - r); 
            
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
            pieceDiv.textContent = PIECES[piece.type + (piece.color === 'w' ? 'P' : 'p')]; // نمایش یونیکد صحیح
            pieceDiv.textContent = PIECES[piece.type.toUpperCase()]; 
            
            // اصلاح برای نمایش رنگ صحیح مهره در یونیکد
            if (piece.color === 'w') {
                pieceDiv.textContent = PIECES[piece.type.toUpperCase()]; 
            } else {
                pieceDiv.textContent = PIECES[piece.type.toLowerCase()]; 
            }
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
    if (game.is_game_over() || game.turn() === 'b') return; 

    if (selectedSquare) {
        // ۱. تلاش برای حرکت
        const move = game.move({
            from: selectedSquare,
            to: squareName,
            promotion: 'q' 
        });

        if (move) {
            selectedSquare = null;
            updateBoard();
            if (!game.is_game_over()) {
                updateMessageBox(TEXTS[currentLanguage]['turn-display-b']);
                setTimeout(makeAIMove, 500); 
            }
        } else {
            // حرکت ناموفق بود یا مهره جدید انتخاب شد
            const piece = game.get(squareName);
            if (piece && piece.color === game.turn()) {
                selectedSquare = squareName;
                highlightMoves(squareName);
                updateMessageBox(TEXTS[currentLanguage]['message-ready']);
            } else {
                updateMessageBox(TEXTS[currentLanguage]['message-invalid']);
                // اگر حرکت نامعتبر بود، انتخاب قبلی را لغو کن
                selectedSquare = null;
                updateBoard(); 
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
    document.querySelectorAll('.square').forEach(s => s.classList.remove('selected', 'move-hint', 'capture-hint'));

    const selectedDiv = document.querySelector(`[data-square="${square}"]`);
    if (selectedDiv) {
        selectedDiv.classList.add('selected');
    }

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
    const capturedWhiteDiv = document.getElementById('captured-pieces-white');
    const capturedBlackDiv = document.getElementById('captured-pieces-black');
    capturedWhiteDiv.innerHTML = '';
    capturedBlackDiv.innerHTML = '';

    const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const initialGame = new Chess(initialFen);
    
    // یک کپی از مهره‌های شروع و فعلی برای مقایسه
    const getPieceCounts = (board) => {
        const counts = {};
        board.board().forEach(row => {
            row.forEach(square => {
                if (square) {
                    counts[square.type + square.color] = (counts[square.type + square.color] || 0) + 1;
                }
            });
        });
        return counts;
    };

    const initialCounts = getPieceCounts(initialGame);
    const currentCounts = getPieceCounts(game);

    const allPieces = ['p', 'n', 'b', 'r', 'q', 'k'];
    
    allPieces.forEach(type => {
        // مهره‌های سفید گرفته شده (تفاوت بین شروع و اکنون)
        const whiteCapturedCount = (initialCounts[type.toUpperCase() + 'w'] || 0) - (currentCounts[type.toUpperCase() + 'w'] || 0);
        for (let i = 0; i < whiteCapturedCount; i++) {
            const pieceDiv = document.createElement('span');
            pieceDiv.classList.add('captured-piece', 'white');
            pieceDiv.textContent = PIECES[type.toUpperCase()];
            capturedWhiteDiv.appendChild(pieceDiv);
        }
        
        // مهره‌های سیاه گرفته شده
        const blackCapturedCount = (initialCounts[type.toLowerCase() + 'b'] || 0) - (currentCounts[type.toLowerCase() + 'b'] || 0);
        for (let i = 0; i < blackCapturedCount; i++) {
            const pieceDiv = document.createElement('span');
            pieceDiv.classList.add('captured-piece', 'black');
            pieceDiv.textContent = PIECES[type.toLowerCase()];
            capturedBlackDiv.appendChild(pieceDiv);
        }
    });
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

let globalMaxDepth = 2; // عمق جستجو: ۲ حرکت به جلو

function makeAIMove() {
    if (game.turn() === 'b' && !game.is_game_over()) {
        const bestMove = findBestMove(game); 
        if (bestMove) {
            game.move(bestMove);
            updateBoard();
            updateMessageBox(TEXTS[currentLanguage]['turn-display-w']);
            checkGameOver();
        }
    }
}

function evaluateBoard(board) {
    let score = 0;
    const pieceValues = {
        'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 900
    };

    board.board().forEach(row => {
        row.forEach(square => {
            if (square) {
                const value = pieceValues[square.type.toLowerCase()];
                if (square.color === 'w') {
                    score -= value; 
                } else {
                    score += value; 
                }
            }
        });
    });
    return score;
}

function minimax(board, depth, isMaximizingPlayer) {
    if (depth === 0 || board.is_game_over()) {
        return evaluateBoard(board);
    }

    const possibleMoves = board.moves();

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        possibleMoves.forEach(move => {
            board.move(move);
            const evaluation = minimax(board, depth - 1, false);
            board.undo(); 
            maxEval = Math.max(maxEval, evaluation);
        });
        return maxEval;
    } else {
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

function findBestMove(board) {
    const possibleMoves = board.moves();
    let bestMove = null;
    let bestValue = -Infinity;

    if (possibleMoves.length === 1) {
        return possibleMoves[0];
    }
    
    possibleMoves.forEach(move => {
        board.move(move);
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
    game.reset(); 
    createBoard();
    updateBoard();
    updateMessageBox(TEXTS[currentLanguage]['message-ready']);
    selectedSquare = null;
}

// ** اجرای اولیه برنامه در زمان بارگذاری صفحه **
window.onload = function() {
    const langSelectScreen = document.getElementById('language-selection');
    const gameScreen = document.getElementById('game-container');
    const newGameBtn = document.getElementById('new-game-btn');

    // اتصال دکمه بازی جدید
    newGameBtn.addEventListener('click', newGame);

    // مدیریت نمایش صفحات هنگام بارگذاری اولیه
    gameScreen.classList.remove('active');
    langSelectScreen.classList.remove('active');

    const savedLang = localStorage.getItem('chessLang');

    if (savedLang) {
        // اگر زبان ذخیره شده بود، مستقیماً بازی را شروع کن
        setLanguage(savedLang); 
    } else {
        // اگر ذخیره نشده، صفحه انتخاب زبان را نمایش بده
        langSelectScreen.classList.add('active');
    }
};
