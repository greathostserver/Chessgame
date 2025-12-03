// در ابتدای فایل script.js، بعد از تعریف متغیرها:
let game, board, stockfish;
let moveSound = new Audio('audio/move.mp3');

// ========== ۱. تابع به‌روزرسانی وضعیت بازی با ترجمه ==========
function updateGameStatus() {
    const statusElement = document.getElementById('gameStatus');
    if (!statusElement) return;
    
    // دریافت ترجمه متناسب با زبان فعلی
    const t = window.getTranslation('status');
    
    if (game.game_over()) {
        if (game.in_checkmate()) {
            const winner = game.turn() === 'w' ? 'سیاه' : 'سفید';
            statusElement.innerHTML = `<span style="color: #ff6b6b">${t.checkmate} ${winner}</span>`;
        } else if (game.in_stalemate()) {
            statusElement.innerHTML = `<span style="color: #feca57">${t.stalemate}</span>`;
        } else {
            statusElement.textContent = t.waiting;
        }
    } else {
        if (game.in_check()) {
            statusElement.innerHTML = `<span style="color: #ff9f43">${t.check}</span>`;
        } else {
            statusElement.textContent = game.turn() === 'w' ? t.whiteTurn : t.blackTurn;
        }
    }
}

// ========== ۲. تابع هشدار حرکت غیرقانونی ==========
function showIllegalMoveWarning() {
    const t = window.getTranslation('status.illegalMove');
    alert(t);
    
    // یا نمایش در صفحه (حرفه‌ای‌تر)
    const warning = document.createElement('div');
    warning.textContent = t;
    warning.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 15px;
        border-radius: 10px;
        z-index: 10000;
        animation: fadeInOut 3s;
    `;
    document.body.appendChild(warning);
    
    setTimeout(() => warning.remove(), 3000);
}

// ========== ۳. تابع onDrop با ترجمه ==========
function onDrop(source, target) {
    try {
        let move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) {
            showIllegalMoveWarning();
            return 'snapback';
        }

        // پخش صدا
        moveSound.currentTime = 0;
        moveSound.play();
        
        // به‌روزرسانی وضعیت
        updateGameStatus();
        
        // به‌روزرسانی تاریخچه حرکات
        updateMoveHistory(move);
        
        // اگر کاربر حرکت کرد، نوبت AI
        if (game.turn() === 'b') {
            setTimeout(getAIMove, 500);
        }
        
        return true;
    } catch (error) {
        console.error('خطا در حرکت:', error);
        return 'snapback';
    }
}

// ========== ۴. تابع اصلی راه‌اندازی ==========
$(document).ready(function() {
    console.log('♟️ شروع بازی شطرنج...');
    
    // مقداردهی اولیه بازی
    game = new Chess();
    
    // پیکربندی تخته
    const boardConfig = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: 'lib/chessboardjs-1.0.0/img/chesspieces/alpha/{piece}.png',
        orientation: 'white'
    };
    
    board = Chessboard('board', boardConfig);
    
    // تنظیم وضعیت اولیه
    updateGameStatus();
    
    // ========== ۵. تنظیم رویداد دکمه‌ها ==========
    
    // دکمه تغییر تم
    $('#themeBtn').click(function() {
        $('body').toggleClass('light-theme');
        const isLight = $('body').hasClass('light-theme');
        $(this).html(`<i class="fas fa-${isLight ? 'moon' : 'sun'}"></i> ${isLight ? 'Dark' : 'Light'} Mode`);
    });
    
    // دکمه سطح AI
    $('#aiBtn').click(function() {
        // ساخت منوی انتخاب سطح AI
        const aiLevels = window.getTranslation('aiLevels');
        const aiTitle = aiLevels.title || 'Select AI Level';
        
        let menu = `<div class="ai-menu">
            <h4>${aiTitle}</h4>
            <button class="ai-level-btn" data-level="easy">${aiLevels.easy}</button>
            <button class="ai-level-btn" data-level="medium">${aiLevels.medium}</button>
            <button class="ai-level-btn" data-level="hard">${aiLevels.hard}</button>
        </div>`;
        
        // نمایش منو (می‌توانید از یک modal یا popup استفاده کنید)
        alert(menu); // اینجا می‌توانید با یک کتابخانه modal جایگزین کنید
    });
    
    // دکمه بازی جدید
    $('#resetBtn').click(function() {
        game.reset();
        board.position('start');
        updateGameStatus();
        $('#moveHistory').empty();
        console.log('🔄 بازی جدید شروع شد');
    });
    
    // دکمه بازگشت
    $('#undoBtn').click(function() {
        const moves = game.history();
        if (moves.length > 0) {
            game.undo();
            board.position(game.fen());
            updateGameStatus();
            
            // حذف آخرین حرکت از تاریخچه
            $('#moveHistory div:last-child').remove();
        }
    });
    
    // تغییر رنگ صفحه
    $('#boardColor').change(function() {
        const color = $(this).val();
        $('.board-container .square-55d63').css('background-color', color);
    });
    
    console.log('✅ بازی آماده است!');
});

// ========== ۶. تابع به‌روزرسانی تاریخچه حرکات ==========
function updateMoveHistory(move) {
    const moveHistory = document.getElementById('moveHistory');
    if (!moveHistory) return;
    
    const moveNumber = Math.ceil(game.history().length / 2);
    const fromSquare = move.from.toUpperCase();
    const toSquare = move.to.toUpperCase();
    
    let moveText = `${moveNumber}. ${fromSquare} → ${toSquare}`;
    
    // افزودن نمادهای ویژه
    if (move.flags.includes('c')) moveText += ' ⚔'; // گرفتن
    if (move.flags.includes('e')) moveText += ' (e.p.)'; // آن پاسان
    if (move.promotion) moveText += ` → ${move.promotion.toUpperCase()}`; // ارتقاء
    
    const moveElement = document.createElement('div');
    moveElement.textContent = moveText;
    moveElement.style.cssText = `
        padding: 8px 12px;
        margin: 4px 0;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        border-left: 3px solid #4e54c8;
        font-family: 'Courier New', monospace;
    `;
    
    moveHistory.appendChild(moveElement);
    moveHistory.scrollTop = moveHistory.scrollHeight;
}

// ========== ۷. توابع کمکی chessboard.js ==========
function onDragStart(source, piece, position, orientation) {
    if (game.game_over() || 
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function onSnapEnd() {
    board.position(game.fen());
}
