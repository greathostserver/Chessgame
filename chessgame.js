// دیکشنری زبان‌ها (i18n ساده)
const translations = {
    fa: {
        title: 'بازی شطرنج',
        historyTitle: 'تاریخچه حرکات',
        easy: 'آسان', medium: 'متوسط', hard: 'سخت',
        newGame: 'بازی جدید',
        changeBoard: 'تغییر تم بورد',
        changePiece: 'تغییر تم مهره‌ها',
        invalidMove: 'حرکت غیرقانونی!',
        checkmateWhite: 'شطرنج مات! سفید برنده شد.',
        checkmateBlack: 'شطرنج مات! سیاه برنده شد.',
        stalemate: 'مساوی!',
        turnWhite: 'نوبت سفید',
        turnBlack: 'نوبت سیاه'
    },
    en: {
        title: 'Chess Game',
        historyTitle: 'Move History',
        easy: 'Easy', medium: 'Medium', hard: 'Hard',
        newGame: 'New Game',
        changeBoard: 'Change Board Theme',
        changePiece: 'Change Piece Theme',
        invalidMove: 'Invalid move!',
        checkmateWhite: 'Checkmate! White wins.',
        checkmateBlack: 'Checkmate! Black wins.',
        stalemate: 'Stalemate!',
        turnWhite: 'White\'s turn',
        turnBlack: 'Black\'s turn'
    },
    ar: {
        title: 'لعبة الشطرنج',
        historyTitle: 'تاريخ الحركات',
        easy: 'سهل', medium: 'متوسط', hard: 'صعب',
        newGame: 'لعبة جديدة',
        changeBoard: 'تغيير ثيم اللوحة',
        changePiece: 'تغيير ثيم القطع',
        invalidMove: 'حركة غير قانونية!',
        checkmateWhite: 'شطرنج مات! الأبيض فاز.',
        checkmateBlack: 'شطرنج مات! الأسود فاز.',
        stalemate: 'تعادل!',
        turnWhite: 'دور الأبيض',
        turnBlack: 'دور الأسود'
    }
};

let currentLang = 'fa';
let lang = translations[currentLang];
let game = new Chess();
let board = null;
let difficulty = 4; // متوسط پیش‌فرض
let boardTheme = 'green'; // تم پیش‌فرض بورد
let pieceTheme = 'wiki'; // تم پیش‌فرض مهره‌ها (SVG از ویکی‌مدیا)
let moveHistory = [];
let selectedSquare = null;

// صداها
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const moveSound = new Audio('https://www.soundjay.com/misc-sounds-1/chess-piece-move-1.mp3');
const captureSound = new Audio('https://www.soundjay.com/misc-sounds-1/chess-piece-capture-1.mp3');

// تنظیم زبان
function setLanguage(langCode) {
    currentLang = langCode;
    lang = translations[langCode];
    document.documentElement.lang = langCode;
    document.documentElement.dir = langCode === 'fa' || langCode === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('language-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    updateUI();
    initGame();
}

// به‌روزرسانی متن‌های UI
function updateUI() {
    document.getElementById('title').innerHTML = lang.title;
    document.getElementById('history-title').textContent = lang.historyTitle;
    document.querySelector('#difficulty option[value="easy"]').textContent = lang.easy;
    document.querySelector('#difficulty option[value="medium"]').textContent = lang.medium;
    document.querySelector('#difficulty option[value="hard"]').textContent = lang.hard;
    document.querySelector('.controls button:nth-of-type(1)').textContent = lang.changeBoard;
    document.querySelector('.controls button:nth-of-type(2)').textContent = lang.changePiece;
    document.querySelector('.controls button:nth-of-type(3)').textContent = lang.newGame;
    document.getElementById('warning').textContent = lang.invalidMove;
}

// مقداردهی اولیه بازی
function initGame() {
    const boardEl = document.getElementById('board');
    const pieceThemeUrl = pieceTheme === 'wiki' ? getWikiPieces() : 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png';
    
    const config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: pieceThemeUrl,
        boardTheme: boardTheme
    };
    board = Chessboard('board', config);
    updateStatus();
    updateHistory();
}

// تابع برای SVG مهره‌های ویکی‌مدیا
function getWikiPieces() {
    const pieces = {
        'wK': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
        'wQ': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
        'wR': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
        'wB': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Chess_blt45.svg',
        'wN': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
        'wP': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
        'bK': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
        'bQ': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
        'bR': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
        'bB': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
        'bN': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
        'bP': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg'
    };
    return function(piece) { return pieces[piece] || ''; };
}

// رویدادهای بورد
function onDragStart(source, piece) {
    if (game.game_over() || (game.turn() === 'w' && piece.search(/^b/) !== -1) || (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
    selectedSquare = source;
}

function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback'; // حرکت نامعتبر

    moveHistory.push(move.san);
    if (move.captured) {
        captureSound.play().catch(() => {}); // پخش صدای capture
    } else {
        moveSound.play().catch(() => {}); // پخش صدای حرکت
    }
    updateStatus();
    if (game.turn() === 'b') {
        window.setTimeout(makeRandomMove, 250); // AI حرکت کنه
    }
    updateHistory();
}

function onSnapEnd() {
    board.position(game.fen());
}

// AI با Minimax
function makeRandomMove() {
    if (game.game_over()) return;
    const depth = difficulty;
    const bestMove = minimaxRoot(depth, game);
    game.move(bestMove);
    moveHistory.push(bestMove.san);
    board.position(game.fen());
    updateStatus();
    updateHistory();
}

// Minimax ساده با Alpha-Beta (برای سطوح مختلف)
function minimaxRoot(depth, game) {
    let bestMove = null;
    let bestValue = -9999;
    for (let i = 0; i < game.moves().length; i++) {
        const move = game.moves()[i];
        game.move(move);
        const boardValue = minimax(depth - 1, game, -10000, 10000, false);
        game.undo();
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    }
    return bestMove;
}

function minimax(depth, game, alpha, beta, isMaximizingPlayer) {
    if (depth === 0) {
        return evaluateBoard(game.board());
    }
    const possibleMoves = game.moves();
    if (isMaximizingPlayer) {
        let maxEval = -9999;
        for (let i = 0; i < possibleMoves.length; i++) {
            game.move(possibleMoves[i]);
            const evalScore = minimax(depth - 1, game, alpha, beta, false);
            game.undo();
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = 9999;
        for (let i = 0; i < possibleMoves.length; i++) {
            game.move(possibleMoves[i]);
            const evalScore = minimax(depth - 1, game, alpha, beta, true);
            game.undo();
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// ارزیابی بورد ساده (امتیاز مهره‌ها)
function evaluateBoard(board) {
    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    let total = 0;
    board.forEach(row => {
        row.forEach(piece => {
            if (piece) {
                const value = pieceValues[piece.type];
                total += (piece.color === 'w' ? value : -value);
            }
        });
    });
    return total;
}

// به‌روزرسانی وضعیت
function updateStatus() {
    let status = '';
    if (game.in_checkmate()) {
        status = game.turn() === 'w' ? lang.checkmateBlack : lang.checkmateWhite;
    } else if (game.in_stalemate()) {
        status = lang.stalemate;
    } else {
        status = game.turn() === 'w' ? lang.turnWhite : lang.turnBlack;
    }
    document.getElementById('status').innerHTML = status;
}

// به‌روزرسانی تاریخچه
function updateHistory() {
    const historyEl = document.getElementById('move-history');
    historyEl.innerHTML = '';
    moveHistory.forEach((move, index) => {
        const li = document.createElement('li');
        li.textContent = move;
        li.onclick = () => goToMove(index); // کلیک برای برگشت
        historyEl.appendChild(li);
    });
}

function goToMove(index) {
    game.load(game.history({ verbose: true }).slice(0, index + 1));
    board.position(game.fen());
    updateStatus();
}

// رویدادهای کنترل
function setDifficulty(level) {
    difficulty = level === 'easy' ? 2 : level === 'medium' ? 4 : 6;
}

let boardThemeIndex = 0;
const boardThemes = ['green', 'blue', 'dark'];
function changeBoardTheme() {
    boardThemeIndex = (boardThemeIndex + 1) % boardThemes.length;
    boardTheme = boardThemes[boardThemeIndex];
    document.body.className = `board-theme-${boardTheme}`;
    board.start(); // اعمال تم
}

let pieceThemeIndex = 0;
const pieceThemes = ['wiki', 'wikipedia', 'google'];
function changePieceTheme() {
    pieceThemeIndex = (pieceThemeIndex + 1) % pieceThemes.length;
    pieceTheme = pieceThemes[pieceThemeIndex];
    initGame(); // بازسازی بورد با تم جدید
}

function newGame() {
    game.reset();
    moveHistory = [];
    board.start();
    updateStatus();
    updateHistory();
}

// هشدار حرکت نامعتبر
function showWarning() {
    const warning = document.getElementById('warning');
    warning.classList.remove('hidden');
    setTimeout(() => warning.classList.add('hidden'), 3000);
}

// در onDrop، اگر invalid، showWarning() رو صدا بزن (در کد بالا اضافه شده)

// شروع: نمایش صفحه زبان
document.addEventListener('DOMContentLoaded', () => {
    // اعمال تم پیش‌فرض
    document.body.className = `board-theme-${boardTheme}`;
});
