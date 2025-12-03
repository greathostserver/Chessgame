// i18n: دیکشنری زبان‌ها
const translations = {
    fa: {
        title: 'بازی شطرنج',
        difficultyLabel: 'سطح AI:',
        resetBtn: 'شروع مجدد',
        historyTitle: 'تاریخچه حرکات',
        invalidMove: 'حرکت غیرقانونی! دوباره امتحان کنید.',
        check: 'کیش!',
        checkmate: 'کیش و مات! شما بردید.' // یا باخت بسته به طرف
    },
    ar: {
        title: 'لعبة الشطرنج',
        difficultyLabel: 'مستوى الذكاء الاصطناعي:',
        resetBtn: 'إعادة تعيين',
        historyTitle: 'تاريخ الحركات',
        invalidMove: 'حركة غير قانونية! جرب مرة أخرى.',
        check: 'كش!',
        checkmate: 'كش مات! فزت.'
    },
    en: {
        title: 'Chess Game',
        difficultyLabel: 'AI Level:',
        resetBtn: 'Reset',
        historyTitle: 'Move History',
        invalidMove: 'Illegal move! Try again.',
        check: 'Check!',
        checkmate: 'Checkmate! You win.'
    }
};

let currentLang = 'fa'; // پیش‌فرض فارسی
let game = new Chess();
let board = null;
let difficulty = 3; // عمق minimax
let moveAudio = new Audio('sounds/move.mp3');
let captureAudio = new Audio('sounds/capture.mp3');

// تابع تنظیم زبان
function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('languageModal').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    updateUI();
    initBoard();
}

// به‌روزرسانی UI با زبان
function updateUI() {
    const t = translations[currentLang];
    document.getElementById('title').textContent = t.title;
    document.getElementById('difficultyLabel').textContent = t.difficultyLabel;
    document.getElementById('resetBtn').textContent = t.resetBtn;
    document.getElementById('historyTitle').textContent = t.historyTitle;
    document.getElementById('pieceLabel').textContent = currentLang === 'fa' ? 'تم مهره:' : currentLang === 'ar' ? 'ثيم القطع:' : 'Piece Theme:';
    document.getElementById('themeLabel').textContent = currentLang === 'fa' ? 'تم بورد:' : currentLang === 'ar' ? 'ثيم اللوحة:' : 'Board Theme:';
}

// تنظیم سطح سختی
function setDifficulty(depth) {
    difficulty = parseInt(depth);
    document.getElementById('difficultyLabel').textContent = translations[currentLang].difficultyLabel + (currentLang === 'fa' ? ['آسان', 'متوسط', 'سخت'][difficulty > 3 ? 2 : difficulty === 1 ? 0 : 1] : difficulty === 1 ? 'Easy' : difficulty === 3 ? 'Medium' : 'Hard');
}

// تغییر تم
function changeTheme() {
    const boardTheme = document.getElementById('boardTheme').value; // در chessboard.js، تم بورد با CSS classes
    const pieceTheme = document.getElementById('pieceTheme').value;
    board.start(false); // reset
    board.option('pieceTheme', pieceTheme); // تغییر مهره
    // برای تم بورد، CSS classes رو تغییر بده (ساده‌سازی: از chessboard.js default استفاده کن، یا custom CSS)
}

// مقداردهی بورد
function initBoard() {
    const cfg = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg'.replace('klt45', '{piece}'), // پیش‌فرض SVG
        boardTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png' // dummy, actual via CSS
    };
    board = Chessboard('board', cfg);
    updateStatus();
    updateHistory();
}

// رویدادهای بورد
function onDragStart(source, piece) {
    // فقط مهره‌های سفید (کاربر) رو بکش
    if (game.game_over() || (game.turn() === 'b' || piece.search(/^b/) !== -1)) return false;
}

function onDrop(source, target) {
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // همیشه به queen
    });

    if (move === null) return 'snapback'; // برگردون اگر غیرقانونی

    // صدا
    if (move.captured) captureAudio.play();
    else moveAudio.play();

    updateStatus();
    window.setTimeout(makeRandomMove, 250); // AI حرکت کنه
}

function onSnapEnd() {
    board.position(game.fen());
}

function updateStatus() {
    let status = '';
    const t = translations[currentLang];
    if (game.in_checkmate()) {
        status = t.checkmate;
    } else if (game.in_check()) {
        status = t.check;
    } else if (game.in_draw()) {
        status = 'مساوی / Draw / تعادل';
    }
    document.getElementById('status').textContent = status || '';
}

function updateHistory() {
    const history = game.history({ verbose: false });
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    history.forEach((move, i) => {
        const li = document.createElement('li');
        li.textContent = `${Math.floor(i/2)+1}. ${move}`;
        list.appendChild(li);
    });
}

// AI: Minimax با alpha-beta
function minimax(position, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || position.isGameOver()) {
        return -evaluateBoard(position.board(), isMaximizing ? 1 : -1);
    }

    const moves = position.moves();
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of moves) {
            position.move(move);
            const eval = minimax(position, depth - 1, alpha, beta, false);
            position.undo();
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of moves) {
            position.move(move);
            const eval = minimax(position, depth - 1, alpha, beta, true);
            position.undo();
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluateBoard(board, color) {
    let score = 0;
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                const value = pieceValues[piece.type];
                if ((piece.color === 'w' && color > 0) || (piece.color === 'b' && color < 0)) {
                    score += value;
                } else {
                    score -= value;
                }
            }
        }
    }
    return score;
}

function makeRandomMove() { // در واقع minimax
    if (game.game_over()) return;

    let bestMove = null;
    let bestValue = -Infinity;
    const possibleMoves = game.moves();
    for (let i = 0; i < possibleMoves.length; i++) {
        game.move(possibleMoves[i]);
        const boardValue = minimax(game, difficulty, -Infinity, Infinity, false);
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = possibleMoves[i];
        }
        game.undo();
    }

    if (bestMove) {
        game.move(bestMove);
        // صدا برای AI
        if (bestMove.captured) captureAudio.play();
        else moveAudio.play();
        board.position(game.fen());
        updateStatus();
        updateHistory();
    }
}

// ریست بازی
function resetGame() {
    game.reset();
    board.start();
    updateStatus();
    updateHistory();
}

// شروع: نشون دادن مودال
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('languageModal').classList.remove('hidden');
});
