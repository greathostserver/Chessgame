// ایجاد دو شیء: 
// 1. game: منطق قوانین شطرنج را نگه می‌دارد. (از کتابخانه chess.js)
// 2. board: نمایش گرافیکی صفحه شطرنج را مدیریت می‌کند. (از کتابخانه chessboard.js)
var game = new Chess();
var board = null;

// سرعت حرکت AI بر حسب میلی ثانیه (برای اینکه حرکت کامپیوتر قابل مشاهده باشد)
var AI_MOVE_TIME = 200; 

// --- بخش ۱: هوش مصنوعی (AI Logic) ---
// تابع انتخاب حرکت توسط کامپیوتر
// توجه: برای سادگی، این تابع یک حرکت "نیمه تصادفی" (Random Legal Move) را انتخاب می‌کند، 
// که پایه و اساس هوش مصنوعی‌های پیچیده‌تر است.
function chooseAIMove() {
    var possibleMoves = game.moves();

    // اگر بازی تمام شده است
    if (possibleMoves.length === 0) return;

    // انتخاب ساده: حرکت تصادفی
    var randomIdx = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIdx];
}

// تابع اصلی برای حرکت دادن کامپیوتر
function makeAIMove() {
    // 1. اگر نوبت سیاه (b) نیست، کاری انجام نده
    if (game.turn() !== 'b') return; 

    // 2. حرکت را انتخاب کن
    var move = chooseAIMove();
    
    // 3. حرکت را با تاخیر انجام بده تا کاربر ببیند
    window.setTimeout(function() {
        game.move(move);
        board.position(game.fen()); // به‌روزرسانی صفحه نمایش
        updateStatus(); // به‌روزرسانی وضعیت بازی
    }, AI_MOVE_TIME);
}
// ------------------------------------


// --- بخش ۲: منطق نمایش و تعامل (User Interaction) ---

// تابعی که بعد از کشیدن مهره توسط کاربر، اجرا می‌شود
function onDrop(source, target) {
    // بررسی کن آیا حرکت مجاز است؟
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // همیشه به وزیر تبدیل کن (برای سادگی)
    });

    // اگر حرکت غیرمجاز بود
    if (move === null) return 'snapback';

    // اگر حرکت مجاز بود، وضعیت را به‌روز کن و نوبت AI است
    updateStatus();
    window.setTimeout(makeAIMove, 250); // کمی تاخیر قبل از حرکت AI

}

// تابعی که وضعیت بازی را در صفحه (ID="status") نمایش می‌دهد
function updateStatus() {
    var status = '';

    var moveColor = 'سفید';
    if (game.turn() === 'b') {
        moveColor = 'سیاه';
    }

    // بررسی اتمام بازی
    if (game.in_checkmate()) {
        status = 'بازی تمام شد. ' + moveColor + ' کیش و مات شد.';
    } else if (game.in_draw()) {
        status = 'بازی مساوی شد.';
    } else {
        status = 'نوبت: ' + moveColor;
        if (game.in_check()) {
            status += ' (' + moveColor + ' در کیش است)';
        }
    }
    
    document.getElementById('status').innerHTML = status;
}

// تنظیمات اصلی صفحه شطرنج
var config = {
    draggable: true, // امکان کشیدن مهره
    position: 'start', // شروع از موقعیت استاندارد
    onDrop: onDrop, // تابعی که بعد از رها کردن مهره صدا زده می‌شود
    orientation: 'white' // نمای صفحه از دید سفید
};
board = Chessboard('board', config); // ساخت صفحه شطرنج

// --- بخش ۳: کنترل‌های دکمه‌ها ---

// دکمه شروع مجدد بازی
document.getElementById('startBtn').addEventListener('click', function() {
    game.reset(); // ریست کردن منطق بازی
    board.start(); // ریست کردن صفحه نمایش
    updateStatus();
});

// دکمه عقب‌گرد (Undo)
document.getElementById('undoBtn').addEventListener('click', function() {
    game.undo(); // یک حرکت را برگردان
    board.position(game.fen()); // به‌روزرسانی نمایش
    updateStatus();
});

// هنگام بارگذاری صفحه، وضعیت را نمایش بده
updateStatus();
