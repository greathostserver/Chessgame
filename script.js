// 1. تعریف متغیرهای اصلی و پیکربندی
let board, game, stockfish, currentLanguage = 'en';
let moveSound = new Audio('audio/move.mp3');
let config;

$(document).ready(function() {
    // 2. مقداردهی اولیه
    game = new Chess();
    stockfish = new Worker('https://unpkg.com/stockfish.js@14.1.0/stockfish.js');
    
    // 3. پیکربندی chessboard.js
    config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        pieceTheme: 'lib/chessboardjs-1.0.0/img/chesspieces/alpha/{piece}.png',
        orientation: 'white' // کاربر همیشه سفید بازی می‌کند
    };
    board = Chessboard('board', config);
    
    // 4. مدیریت رویداد دکمه‌ها
    $('#resetBtn').on('click', function() {
        game.reset();
        board.start();
        updateStatus();
        $('#moveHistory').empty();
    });
    
    $('#themeBtn').on('click', function() {
        // تغییر تم بین تاریک و روشن
        $('body').toggleClass('light-theme');
    });
    
    // 5. تغییر رنگ صفحه به صورت زنده
    $('#boardColor').on('input', function() {
        $('.board-container .white-1e1d7').css('background-color', $(this).val());
    });
});

// 6. تابع اصلی کنترل کشیدن و رها کردن مهره
function onDragStart(source, piece) {
    // جلوگیری از حرکت اگر نوبت کاربر نباشد یا بازی تمام شده باشد
    if (game.game_over() || 
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function onDrop(source, target) {
    // 7. بررسی قانونی بودن حرکت با chess.js
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q' // پیش‌فرض تبدیل به وزیر
    });

    if (move === null) {
        // 8. هشدار برای حرکت غیرقانونی
        alert(i18n[currentLanguage].illegalMove || "Illegal move!");
        return 'snapback'; // بازگشت مهره به جای اول
    }

    // 9. پخش صدا
    moveSound.currentTime = 0;
    moveSound.play();
    
    // 10. به‌روزرسانی تاریخچه حرکات
    updateMoveHistory(move);
    
    // 11. اگر کاربر حرکت کرد، نوبت هوش مصنوعی
    if (game.turn() === 'b') {
        getAIMove();
    }
    
    updateStatus();
    return true;
}

// 12. گرفتن حرکت از هوش مصنوعی (Stockfish)
function getAIMove() {
    // ارسال موقعیت فعلی به استوک فیش
    stockfish.postMessage(`position fen ${game.fen()}`);
    // تنظیم سطح دشواری (مدت زمان فکر کردن)
    let level = $('#aiLevel').val() || 'medium';
    let depth = { easy: 10, medium: 15, hard: 20 }[level];
    stockfish.postMessage(`go depth ${depth}`);
}

// پردازش پاسخ استوک فیش
stockfish.onmessage = function(event) {
    if (event.data.startsWith('bestmove')) {
        let bestMove = event.data.split(' ')[1];
        if (bestMove && bestMove !== '(none)') {
            // اجرای حرکت پیشنهادی روی صفحه
            let move = game.move({
                from: bestMove.substring(0, 2),
                to: bestMove.substring(2, 4),
                promotion: bestMove.substring(4, 5) || 'q'
            });
            if (move) {
                board.position(game.fen());
                updateMoveHistory(move);
                updateStatus();
            }
        }
    }
};

// 13. تابع به‌روزرسانی تاریخچه حرکات
function updateMoveHistory(move) {
    let moveNumber = Math.ceil(game.history().length / 2);
    let moveText = `${moveNumber}. ${move.from} → ${move.to}`;
    if (move.flags.includes('c')) moveText += ' ⚔'; // علامت گرفتن
    if (move.flags.includes('e')) moveText += ' (en passant)';
    $('#moveHistory').append(`<div>${moveText}</div>`);
    $('#moveHistory').scrollTop($('#moveHistory')[0].scrollHeight);
}
