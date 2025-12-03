// دیکشنری زبان‌ها (i18n)
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
let game;
let board;
let difficulty = 4;
let boardThemeIndex = 0;
let pieceThemeIndex = 0;
let moveHistory = [];
let selectedSquare = null;

// صداهای جدید از Lichess (royalty-free)
const moveSound = new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/move.mp3');
const captureSound = new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/capture.mp3');

// تابع boardTheme سفارشی (function برمی‌گردونه CSS)
function getBoardTheme() {
    const themes = [
        { light: '#f0d9b5', dark: '#b58863' }, // green
        { light: '#e6f3ff', dark: '#4a90e2' }, // blue
        { light: '#d18b47', dark: '#ffce9e' }  // dark
    ];
    const theme = themes[boardThemeIndex];
    return function(square) {
        // محاسبه رنگ بر اساس موقعیت (a1 dark)
        const isDark = (square.charCodeAt(0) - 97 + parseInt(square[1])) % 2 === 0;
        return isDark ? `background-color: ${theme.dark};` : `background-color: ${theme.light};`;
    };
}

// تابع pieceTheme (wiki SVG)
function getPieceTheme() {
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
    return pieces;
}

// تنظیم زبان
function setLanguage(langCode) {
    try {
        currentLang = langCode;
        lang = translations[langCode];
        document.documentElement.lang = langCode;
        document.documentElement.dir = langCode === 'fa' || langCode === 'ar' ? 'rtl' : 'ltr';
        document.body.className = `board-theme-${['green', 'blue', 'dark'][boardThemeIndex]}`;
        document.getElementById('language-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        updateUI();
        initGame();
    } catch (e) {
        console.error('Language set error:', e);
    }
}

// به‌روزرسانی UI
function updateUI() {
    document.getElementById('title').textContent = lang.title;
    document.getElementById('history-title').textContent = lang.historyTitle;
    const options = document.querySelectorAll('#difficulty option');
    options[0].textContent = lang.easy;
    options[1].textContent = lang.medium;
    options[2].textContent = lang.hard;
    document.querySelectorAll('.controls button')[0].textContent = lang.changeBoard;
    document.querySelectorAll('.controls button')[1].textContent = lang.changePiece;
    document.querySelectorAll('.controls button')[2].textContent = lang.newGame;
    document.getElementById('warning').textContent = lang.invalidMove;
}

// مقداردهی اولیه
function initGame() {
    try {
        if (typeof Chess === 'undefined') throw new Error('Chess.js not loaded');
        game = new Chess();
        const boardEl = document.getElementById('board');
        const config = {
            draggable: true,
            position: 'start',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd,
            pieceTheme: getPieceTheme(),
            boardTheme: getBoardTheme()
        };
        board = Chessboard('board', config);
        updateStatus();
        updateHistory();
    } catch (e) {
        console.error('Init error:', e);
        alert('خطا در لود بازی. اینترنت چک کن.');
    }
}

// رویدادهای بورد
function onDragStart(source, piece) {
    if (game.game_over() || (game.turn() === 'w' && piece.search(/^b/) !== -1) || (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) {
        showWarning();
        return 'snapback';
    }

    moveHistory.push(move.san);
    if (move.captured) {
        captureSound.play().catch(e => console.log('Capture sound error:', e));
    } else {
        moveSound.play().catch(e => console.log('Move sound error:', e));
    }
    updateStatus();
    if (game.turn() === 'b') {
        setTimeout(() => makeRandomMove(), 500); // تاخیر برای AI
    }
    updateHistory();
}

function onSnapEnd() {
    board.position(game.fen());
}

// AI Minimax (بهینه)
function makeRandomMove() {
    if (game.game_over()) return;
    const bestMove = minimaxRoot(difficulty, game);
    game.move(bestMove);
    moveHistory.push(bestMove.san);
    board.position(game.fen());
    if (bestMove.captured) captureSound.play().catch(() => {});
    else moveSound.play().catch(() => {});
    updateStatus();
    updateHistory();
}

function minimaxRoot(depth, game) {
    let bestMove = null;
    let bestValue = -Infinity;
    game.moves().forEach(move => {
        game.move(move);
        const value = minimax(depth - 1, game, -Infinity, Infinity, false);
        game.undo();
        if (value > bestValue) {
            bestValue = value;
            bestMove = move;
        }
    });
    return bestMove;
}

function minimax(depth, game, alpha, beta, maximizing) {
    if (depth === 0 || game.game_over()) return evaluateBoard(game.board());
    if (maximizing) {
        let maxEval = -Infinity;
        game.moves().forEach(move => {
            game.move(move);
            maxEval = Math.max(maxEval, minimax(depth - 1, game, alpha, beta, false));
            game.undo();
            alpha = Math.max(alpha, maxEval);
            if (beta <= alpha) return;
        });
        return maxEval;
    } else {
        let minEval = Infinity;
        game.moves().forEach(move => {
            game.move(move);
            minEval = Math.min(minEval, minimax(depth - 1, game, alpha, beta, true));
            game.undo();
            beta = Math.min(beta, minEval);
            if (beta <= alpha) return;
        });
        return minEval;
    }
}

function evaluateBoard(board) {
    const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    let score = 0;
    board.forEach(row => row.forEach(piece => {
        if (piece) score += (piece.color === 'w' ? values[piece.type] : -values[piece.type]);
    }));
    return score;
}

// وضعیت و تاریخچه
function updateStatus() {
    let status = '';
    if (game.in_checkmate()) status = game.turn() === 'w' ? lang.checkmateBlack : lang.checkmateWhite;
    else if (game.in_stalemate()) status = lang.stalemate;
    else status = game.turn() === 'w' ? lang.turnWhite : lang.turnBlack;
    document.getElementById('status').innerHTML = status;
}

function updateHistory() {
    const el = document.getElementById('move-history');
    el.innerHTML = '';
    moveHistory.forEach((move, i) => {
        const li = document.createElement('li');
        li.textContent = `${Math.floor(i/2)+1}. ${move}`;
        li.onclick = () => goToMove(i);
        el.appendChild(li);
    });
}

function goToMove(index) {
    const history = game.history({ verbose: true });
    game.load('');
    history.slice(0, index + 1).forEach(m => game.move(m));
    board.position(game.fen());
    moveHistory = game.history();
    updateStatus();
    updateHistory();
}

// کنترل‌ها
function setDifficulty(level) {
    difficulty = { easy: 2, medium: 4, hard: 6 }[level];
}

function changeBoardTheme() {
    boardThemeIndex = (boardThemeIndex + 1) % 3;
    document.body.className = `board-theme-${['green', 'blue', 'dark'][boardThemeIndex]}`;
    if (board) board.start(); // اعمال
}

function changePieceTheme() {
    pieceThemeIndex = (pieceThemeIndex + 1) % 3; // می‌تونی تم‌های بیشتر اضافه کنی
    initGame(); // بازسازی
}

function newGame() {
    game.reset();
    moveHistory = [];
    board.start();
    updateStatus();
    updateHistory();
}

function showWarning() {
    const warning = document.getElementById('warning');
    warning.classList.remove('hidden');
    setTimeout(() => warning.classList.add('hidden'), 3000);
}

// شروع
document.addEventListener('DOMContentLoaded', () => {
    // preload sounds
    moveSound.load();
    captureSound.load();
});
