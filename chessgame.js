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

// صداها
const moveSound = new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/move.mp3');
const captureSound = new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/capture.mp3');

// boardTheme function
function getBoardTheme() {
    const themes = [
        { light: '#f0d9b5', dark: '#b58863' },
        { light: '#e6f3ff', dark: '#4a90e2' },
        { light: '#d18b47', dark: '#ffce9e' }
    ];
    const theme = themes[boardThemeIndex % 3];
    return function(square) {
        const isEven = ((square.charCodeAt(0) - 97) + parseInt(square[1])) % 2 === 0;
        return isEven ? `background-color: ${theme.dark};` : `background-color: ${theme.light};`;
    };
}

// pieceTheme unicode - فیکس CORS!
function getPieceTheme() {
    const unicodePieces = {
        'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
        'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
    };
    return function(piece) {
        return `<div class="chess-piece">${unicodePieces[piece] || ''}</div>`;
    };
}

function setLanguage(langCode) {
    currentLang = langCode;
    lang = translations[langCode];
    document.documentElement.lang = langCode;
    document.documentElement.dir = (langCode === 'fa' || langCode === 'ar') ? 'rtl' : 'ltr';
    document.getElementById('language-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    updateUI();
    setTimeout(initGame, 100);
}

function updateUI() {
    document.getElementById('title').textContent = lang.title;
    document.getElementById('history-title').textContent = lang.historyTitle;
    const options = document.querySelectorAll('#difficulty option');
    [lang.easy, lang.medium, lang.hard].forEach((text, i) => options[i].textContent = text);
    const buttons = document.querySelectorAll('.controls button');
    buttons[0].textContent = lang.changeBoard;
    buttons[1].textContent = lang.changePiece;
    buttons[2].textContent = lang.newGame;
    document.getElementById('warning').textContent = lang.invalidMove;
}

function initGame() {
    try {
        game = new Chess();
        const config = {
            draggable: true,
            position: 'start',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd,
            pieceTheme: getPieceTheme(),
            boardTheme: getBoardTheme(),
            showNotation: false
        };
        board = Chessboard('board', config);
        console.log('بازی لود شد! Board ready.');
        updateStatus();
        updateHistory();
    } catch (e) {
        console.error('خطا:', e);
        alert('خطا در لود: ' + e.message + ' - اینترنت یا مرورگر چک کن.');
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
    (move.captured ? captureSound : moveSound).play().catch(console.log);
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
    (bestMove.captured ? captureSound : moveSound).play().catch(console.log);
    board.position(game.fen());
    updateStatus();
    updateHistory();
}

function minimaxRoot(depth, game) {
    let bestValue = -Infinity;
    let bestMove = null;
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
    board.flat().forEach(p => { if (p) score += p.color === 'w' ? values[p.type] : -values[p.type]; });
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
    for (let i = 0; i < moveHistory.length; i += 2) {
        const li = document.createElement('li');
        li.textContent = `${Math.floor(i / 2) + 1}. ${moveHistory[i]}${moveHistory[i+1] ? ' ' + moveHistory[i+1] : ''}`;
        li.onclick = () => goToMove(i / 2);
        el.appendChild(li);
    }
}

function goToMove(index) {
    game.reset();
    for (let i = 0; i < index * 2; i++) {
        if (moveHistory[i]) game.move(moveHistory[i]);
    }
    board.position(game.fen());
    updateStatus();
    updateHistory();
}

function setDifficulty(level) {
    difficulty = { easy: 2, medium: 4, hard: 6 }[level] || 4;
}

function changeBoardTheme() {
    boardThemeIndex = (boardThemeIndex + 1) % 3;
    if (board) board.start();
}

function changePieceTheme() {
    pieceThemeIndex = (pieceThemeIndex + 1) % 2; // unicode vs simple text
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
    const w = document.getElementById('warning');
    w.classList.remove('hidden');
    setTimeout(() => w.classList.add('hidden'), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    moveSound.load();
    captureSound.load();
});
