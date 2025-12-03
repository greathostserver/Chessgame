// دیکشنری زبان‌ها
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
let pieceThemeIndex = 0; // فعلاً فقط یک تم، می‌تونی اضافه کنی
let moveHistory = [];

// صداها
const moveSound = new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/move.mp3');
const captureSound = new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/capture.mp3');

// boardTheme function
function getBoardTheme() {
    const themes = [
        { light: '#f0d9b5', dark: '#b58863' }, // green
        { light: '#e6f3ff', dark: '#4a90e2' }, // blue
        { light: '#d18b47', dark: '#ffce9e' }  // dark
    ];
    const theme = themes[boardThemeIndex % themes.length];
    return function(square) {
        const isEven = ((square.charCodeAt(0) - 97) + parseInt(square[1])) % 2 === 0;
        return isEven ? `background-color: ${theme.dark};` : `background-color: ${theme.light};`;
    };
}

// pieceTheme function - فیکس اصلی!
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
    return function(piece) { // function برمی‌گردونه!
        return pieces[piece] || '';
    };
}

function setLanguage(langCode) {
    currentLang = langCode;
    lang = translations[langCode];
    document.documentElement.lang = langCode;
    document.documentElement.dir = langCode === 'fa' || langCode === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('language-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    updateUI();
    setTimeout(initGame, 100); // تاخیر برای لود DOM
}

function updateUI() {
    document.getElementById('title').textContent = lang.title;
    document.getElementById('history-title').textContent = lang.historyTitle;
    const options = document.querySelectorAll('#difficulty option');
    options[0].textContent = lang.easy;
    options[1].textContent = lang.medium;
    options[2].textContent = lang.hard;
    const buttons = document.querySelectorAll('.controls button');
    buttons[0].textContent = lang.changeBoard;
    buttons[1].textContent = lang.changePiece;
    buttons[2].textContent = lang.newGame;
    document.getElementById('warning').textContent = lang.invalidMove;
}

function initGame() {
    try {
        if (typeof Chessboard === 'undefined') {
            throw new Error('Chessboard.js not loaded. Check internet.');
        }
        if (game) game.reset();
        else game = new Chess();
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
        console.log('Board initialized successfully!');
        updateStatus();
        updateHistory();
    } catch (e) {
        console.error('Init error:', e);
        alert('خطا: ' + e.message + '\nکنسول (F12) رو چک کن.');
    }
}

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
    (move.captured ? captureSound : moveSound).play().catch(e => console.log('Sound error:', e));
    updateStatus();
    if (game.turn() === 'b') setTimeout(makeRandomMove, 300);
    updateHistory();
}

function onSnapEnd() {
    board.position(game.fen());
}

function makeRandomMove() {
    if (game.game_over()) return;
    const bestMove = minimaxRoot(difficulty, game);
    game.move(bestMove);
    moveHistory.push(bestMove.san);
    (bestMove.captured ? captureSound : moveSound).play().catch(() => {});
    board.position(game.fen());
    updateStatus();
    updateHistory();
}

function minimaxRoot(depth, game) {
    let best = -Infinity;
    let move = null;
    game.moves().forEach(m => {
        game.move(m);
        const val = minimax(depth - 1, game, -Infinity, Infinity, false);
        game.undo();
        if (val > best) {
            best = val;
            move = m;
        }
    });
    return move;
}

function minimax(depth, game, alpha, beta, max) {
    if (depth === 0 || game.game_over()) return evaluateBoard(game.board());
    if (max) {
        let best = -Infinity;
        game.moves().forEach(m => {
            game.move(m);
            best = Math.max(best, minimax(depth - 1, game, alpha, beta, false));
            game.undo();
            alpha = Math.max(alpha, best);
            if (beta <= alpha) return;
        });
        return best;
    } else {
        let best = Infinity;
        game.moves().forEach(m => {
            game.move(m);
            best = Math.min(best, minimax(depth - 1, game, alpha, beta, true));
            game.undo();
            beta = Math.min(beta, best);
            if (beta <= alpha) return;
        });
        return best;
    }
}

function evaluateBoard(board) {
    const val = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    let score = 0;
    board.flat().forEach(p => { if (p) score += (p.color === 'w' ? val[p.type] : -val[p.type]); });
    return score;
}

function updateStatus() {
    let msg = '';
    if (game.in_checkmate()) msg = game.turn() === 'w' ? lang.checkmateBlack : lang.checkmateWhite;
    else if (game.in_stalemate()) msg = lang.stalemate;
    else msg = game.turn() === 'w' ? lang.turnWhite : lang.turnBlack;
    document.getElementById('status').innerHTML = msg;
}

function updateHistory() {
    const el = document.getElementById('move-history');
    el.innerHTML = '';
    moveHistory.forEach((move, i) => {
        const li = document.createElement('li');
        li.textContent = `${Math.floor(i / 2) + 1}. ${move}`;
        li.onclick = () => goToMove(i);
        el.appendChild(li);
    });
}

function goToMove(index) {
    game.reset();
    moveHistory.slice(0, index + 1).forEach(m => game.move(m));
    board.position(game.fen());
    updateStatus();
    updateHistory();
}

function setDifficulty(level) {
    difficulty = { easy: 2, medium: 4, hard: 6 }[level] || 4;
    console.log('Difficulty set to:', difficulty);
}

function changeBoardTheme() {
    boardThemeIndex = (boardThemeIndex + 1) % 3;
    console.log('Board theme changed to:', boardThemeIndex);
    if (board) {
        board.destroy();
        initGame(); // بازسازی برای apply تم
    }
}

function changePieceTheme() {
    pieceThemeIndex = (pieceThemeIndex + 1) % 2; // فعلاً ۲ تم، یکی wiki یکی default
    console.log('Piece theme changed');
    if (board) {
        board.destroy();
        initGame();
    }
}

function newGame() {
    game.reset();
    moveHistory = [];
    if (board) board.start();
    updateStatus();
    updateHistory();
    console.log('New game started');
}

function showWarning() {
    const w = document.getElementById('warning');
    w.classList.remove('hidden');
    setTimeout(() => w.classList.add('hidden'), 3000);
}

// شروع
document.addEventListener('DOMContentLoaded', () => {
    moveSound.load();
    captureSound.load();
    console.log('DOM loaded, ready for language select.');
});
