// =========================================================================
// بخش ۱: تعریف متغیرها و ترجمه‌ها در حوزه‌ی سراسری (Global Scope)
// این کار باعث می شود متغیر زبان در تمام توابع قابل دسترسی باشد.
// =========================================================================

// متغیر سراسری برای نگهداری زبان فعلی (در ابتدا فارسی)
let currentLanguage = 'fa'; 

// آرایه‌ای از ترجمه‌ها (ترجیحاً در Global برای دسترسی سریعتر)
const translations = {
    'fa': {
        'title': 'شطرنج هوشمند',
        'reset': 'شروع مجدد بازی',
        'white_turn': 'نوبت سفید است.',
        'black_turn': 'نوبت سیاه است.',
        'checkmate_white': 'کیش و مات! سیاه برنده شد.',
        'checkmate_black': 'کیش و مات! سفید برنده شد.',
        'draw': 'تساوی!',
        'stalemate': 'تساوی! بازی به بن‌بست رسید.',
        'check': '(کیش!)',
        'start_status': 'بازی شروع شد. نوبت سفید است.'
    },
    'en': {
        'title': 'Smart Chess',
        'reset': 'Reset Game',
        'white_turn': 'White to move.',
        'black_turn': 'Black to move.',
        'checkmate_white': 'Checkmate! Black wins.',
        'checkmate_black': 'Checkmate! White wins.',
        'draw': 'Draw!',
        'stalemate': 'Stalemate! Game is drawn.',
        'check': '(Check!)',
        'start_status': 'Game started. White to move.'
    }
};

// =========================================================================
// بخش ۲: منطق انتخاب زبان و شروع بازی (JQuery Ready)
// =========================================================================

$(document).ready(function() {
    
    const langSelector = $('#language-selector');
    const gameArea = $('#game-area');
    const faButton = $('#lang-fa');
    const enButton = $('#lang-en');
    const statusText = $('#status');
    const title = $('h1');

    // تابع برای به‌روزرسانی متن‌ها بر اساس زبان انتخاب شده
    function updateText(language) {
        currentLanguage = language; // به‌روزرسانی متغیر سراسری
        
        // به‌روزرسانی جهت (Direction) صفحه
        if (currentLanguage === 'fa') {
             $('html').attr('lang', 'fa').attr('dir', 'rtl');
             $('.game-container').css('direction', 'rtl');
        } else {
             $('html').attr('lang', 'en').attr('dir', 'ltr');
             $('.game-container').css('direction', 'ltr');
        }

        title.text(translations[language].title);
        $('#reset-button').text(translations[language].reset);
        statusText.text(translations[language].start_status);
    }
    
    // تابع برای شروع بازی پس از انتخاب زبان
    function startGame(language) {
        updateText(language); // ۱. به‌روزرسانی زبان
        langSelector.hide();   // ۲. مخفی کردن صفحه انتخاب زبان
        gameArea.show();      // ۳. نمایش صفحه بازی
        startChessGame();     // ۴. شروع تابع اصلی بازی
    }

    // اضافه کردن شنونده برای دکمه‌های زبان
    faButton.on('click', function() {
        startGame('fa'); // شروع با فارسی
    });

    enButton.on('click', function() {
        startGame('en'); // شروع با انگلیسی
    });
    
    // نمایش صفحه انتخاب زبان در ابتدای بارگذاری
    langSelector.show();
    gameArea.hide();
});

// =========================================================================
// بخش ۳: کتابخانه CHESS.JS (منطق بازی)
// ... (کد طولانی کتابخانه chess.js در اینجا قرار می‌گیرد) ...
// (همان کدی که در پاسخ قبل فرستادم و شما در script.js قرار دادید)
// =========================================================================
var Chess = function(fen) {
    // ... محتوای کامل تابع Chess ...
    // ... محتوای کامل تابع Chess ...
    // ... محتوای کامل تابع Chess ...
};


// =========================================================================
// بخش ۴: موتور هوش مصنوعی (Minimax)
// ... (کد طولانی Minimax در اینجا قرار می‌گیرد) ...
// (همان کدی که در پاسخ قبل فرستادم و شما در script.js قرار دادید)
// =========================================================================
var minimax = function() {
    // ... محتوای کامل تابع minimax ...
    // ... محتوای کامل تابع minimax ...
    // ... محتوای کامل تابع minimax ...
};


// =========================================================================
// بخش ۵: منطق اصلی بازی (ChessBoard.js) - شامل اصلاحات زبان
// =========================================================================

var startChessGame = function() {
    
    // متغیرهای بازی
    var game = new Chess();
    var board;
    var $status = $('#status');
    var $resetButton = $('#reset-button');
    
    // برای سادگی، عمق جستجوی هوش مصنوعی را ۲ قرار می دهیم (سریعتر است)
    var AI_DEPTH = 2; 

    // تنظیمات برد شطرنج
    var cfg = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };

    // مقداردهی اولیه به برد
    board = Chessboard('board', cfg);
    
    // ---------------------------------------------------------------------
    // توابع رابط کاربری (بدون تغییر)
    // ---------------------------------------------------------------------

    function onDragStart(source, piece, position, orientation) {
        if (game.game_over() || piece.search(/^b/) !== -1) {
            return false;
        }
    }

    function onDrop(source, target) {
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q' 
        });

        if (move === null) return 'snapback';
        
        updateStatus();
        window.setTimeout(makeAiMove, 250);
    }

    function onSnapEnd() {
        board.position(game.fen());
    }
    
    // ---------------------------------------------------------------------
    // توابع هوش مصنوعی (بدون تغییر)
    // ---------------------------------------------------------------------

    function makeAiMove() {
        var bestMove = minimax.getBestMove(game, AI_DEPTH);
        game.move(bestMove);
        board.position(game.fen());
        updateStatus();
    }
    
    // ---------------------------------------------------------------------
    // توابع وضعیت بازی (با استفاده از متغیر سراسری currentLanguage)
    // ---------------------------------------------------------------------

    function updateStatus() {
        var status = '';
        var moveColor = (currentLanguage === 'fa' ? 'سفید' : 'White'); // از متغیر سراسری استفاده می کند
        
        // ۱. بررسی وضعیت‌های پایان بازی
        if (game.in_checkmate()) {
            // Checkmate
            status = (game.turn() === 'w' ? translations[currentLanguage].checkmate_white : translations[currentLanguage].checkmate_black);

        } else if (game.in_draw()) {
            // Draw
            status = translations[currentLanguage].draw;

        } else {
            // ۲. نمایش نوبت
            if (game.turn() === 'b') {
                moveColor = (currentLanguage === 'fa' ? 'سیاه' : 'Black');
            }
            
            // نمایش وضعیت فعلی
            status = translations[currentLanguage][game.turn() + '_turn'].replace(game.turn() === 'w' ? 'سفید' : 'سیاه', moveColor);

            // اگر کیش باشد، هشدار دهید
            if (game.in_check()) {
                status += ' ' + translations[currentLanguage].check;
            }
        }

        $status.html(status);
        
        // تنظیم جهت متن
        if (currentLanguage === 'fa') {
             $status.css('direction', 'rtl').css('text-align', 'right');
        } else {
             $status.css('direction', 'ltr').css('text-align', 'center');
        }
    }
    
    // ---------------------------------------------------------------------
    // کنترل دکمه ریست
    // ---------------------------------------------------------------------
    
    $resetButton.on('click', function() {
        game.reset(); 
        board.position('start'); 
        updateStatus(); // وضعیت جدید را با زبان فعلی به‌روز می‌کند
    });

    // در این قسمت، نیازی به updateStatus() نیست چون قبلاً توسط تابع startGame فراخوانی شده است.
    // اما برای اطمینان از تنظیمات اولیه برد، آن را می‌گذاریم:
    board.position(game.fen());
    
};
