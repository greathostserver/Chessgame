/**
 * سیستم چندزبانه شطرنج - Chess Multilingual System
 * کد کامل و آماده استفاده
 */

// ==================== بخش ۱: دیتابیس ترجمه‌ها ====================
const chessTranslations = {
    // انگلیسی
    'en': {
        // عناصر صفحه
        'title': 'Chess Master',
        'themeText': 'Change Theme',
        'aiText': 'AI Level',
        'undoText': 'Undo Move',
        'resetText': 'New Game',
        'moveHistoryTitle': 'Move History',
        'gameStatusTitle': 'Game Status',
        'colorTitle': 'Customize Colors',
        'boardColorLabel': 'Board Color:',
        'pieceColorLabel': 'Piece Style:',
        
        // دکمه‌های زبان
        'langEnglish': '🇺🇸 English',
        'langPersian': '🇮🇷 Persian',
        'langArabic': '🇸🇦 Arabic',
        'selectLang': 'Select Your Language',
        
        // سطوح AI
        'aiLevels': {
            'easy': 'Easy',
            'medium': 'Medium',
            'hard': 'Hard',
            'title': 'Select AI Difficulty'
        },
        
        // وضعیت بازی
        'status': {
            'waiting': 'Waiting to start...',
            'whiteTurn': '👑 White\'s Turn',
            'blackTurn': '⚫ Black\'s Turn',
            'check': 'Check!',
            'checkmate': 'Checkmate! Winner: ',
            'stalemate': 'Stalemate - Draw',
            'illegalMove': '⚠ Illegal move! Please try again.'
        },
        
        // پیام‌ها
        'modalTitle': 'Welcome to Chess Master',
        'playButton': 'Start Playing'
    },
    
    // فارسی
    'fa': {
        // عناصر صفحه
        'title': 'استاد شطرنج',
        'themeText': 'تغییر تم',
        'aiText': 'سطح هوش مصنوعی',
        'undoText': 'بازگرداندن حرکت',
        'resetText': 'بازی جدید',
        'moveHistoryTitle': 'تاریخچه حرکات',
        'gameStatusTitle': 'وضعیت بازی',
        'colorTitle': 'سفارشی‌سازی رنگ‌ها',
        'boardColorLabel': 'رنگ صفحه:',
        'pieceColorLabel': 'سبک مهره:',
        
        // دکمه‌های زبان
        'langEnglish': '🇺🇸 انگلیسی',
        'langPersian': '🇮🇷 فارسی',
        'langArabic': '🇸🇦 عربی',
        'selectLang': 'زبان خود را انتخاب کنید',
        
        // سطوح AI
        'aiLevels': {
            'easy': 'آسان',
            'medium': 'متوسط',
            'hard': 'سخت',
            'title': 'سطح دشواری هوش مصنوعی'
        },
        
        // وضعیت بازی
        'status': {
            'waiting': 'در انتظار شروع بازی...',
            'whiteTurn': '👑 نوبت سفید',
            'blackTurn': '⚫ نوبت سیاه',
            'check': 'کیش!',
            'checkmate': 'کیش و مات! برنده: ',
            'stalemate': 'پات - بازی مساوی',
            'illegalMove': '⚠ حرکت غیرمجاز! لطفا دوباره تلاش کنید.'
        },
        
        // پیام‌ها
        'modalTitle': 'به بازی استاد شطرنج خوش آمدید',
        'playButton': 'شروع بازی'
    },
    
    // عربی
    'ar': {
        // عناصر صفحه
        'title': 'سيد الشطرنج',
        'themeText': 'تغيير السمة',
        'aiText': 'مستوى الذكاء الاصطناعي',
        'undoText': 'تراجع عن الحركة',
        'resetText': 'لعبة جديدة',
        'moveHistoryTitle': 'سجل الحركات',
        'gameStatusTitle': 'حالة اللعبة',
        'colorTitle': 'تخصيص الألوان',
        'boardColorLabel': 'لون اللوحة:',
        'pieceColorLabel': 'نمط القطع:',
        
        // دکمه‌های زبان
        'langEnglish': '🇺🇸 الإنجليزية',
        'langPersian': '🇮🇷 الفارسية',
        'langArabic': '🇸🇦 العربية',
        'selectLang': 'اختر لغتك',
        
        // سطوح AI
        'aiLevels': {
            'easy': 'سهل',
            'medium': 'متوسط',
            'hard': 'صعب',
            'title': 'اختر صعوبة الذكاء الاصطناعي'
        },
        
        // وضعیت بازی
        'status': {
            'waiting': 'في انتظار البدء...',
            'whiteTurn': '👑 دور الأبيض',
            'blackTurn': '⚫ دور الأسود',
            'check': 'كش!',
            'checkmate': 'كش مات! الفائز: ',
            'stalemate': 'حصار - تعادل',
            'illegalMove': '⚠ حركة غير قانونية! يرجى المحاولة مرة أخرى.'
        },
        
        // پیام‌ها
        'modalTitle': 'مرحبا بك في سيد الشطرنج',
        'playButton': 'بدء اللعب'
    }
};

// ==================== بخش ۲: تنظیمات و متغیرهای جهانی ====================
let currentLanguage = 'en';
let isInitialized = false;

// ==================== بخش ۳: توابع اصلی ====================

/**
 * اعمال ترجمه به تمام عناصر صفحه
 * @param {string} lang - کد زبان (en, fa, ar)
 */
function applyLanguage(lang) {
    // ذخیره زبان انتخاب شده
    currentLanguage = lang;
    localStorage.setItem('chessLanguage', lang);
    
    // دریافت ترجمه‌ها
    const t = chessTranslations[lang];
    if (!t) {
        console.error(`ترجمه برای زبان ${lang} یافت نشد!`);
        return;
    }
    
    console.log(`📢 زبان تغییر کرد به: ${lang}`);
    
    // ===== ۱. ترجمه عناصر اصلی صفحه =====
    const elementsToTranslate = {
        // عناصر با ID
        'title': t.title,
        'themeText': t.themeText,
        'aiText': t.aiText,
        'undoText': t.undoText,
        'resetText': t.resetText,
        'moveHistoryTitle': t.moveHistoryTitle,
        'gameStatusTitle': t.gameStatusTitle,
        'colorTitle': t.colorTitle,
        'boardColorLabel': t.boardColorLabel,
        'pieceColorLabel': t.pieceColorLabel,
        'modalTitle': t.modalTitle,
        'selectLang': t.selectLang,
        'playButton': t.playButton
    };
    
    // اعمال ترجمه به عناصر
    Object.keys(elementsToTranslate).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elementsToTranslate[id];
        }
    });
    
    // ===== ۲. ترجمه دکمه‌های زبان =====
    const langButtons = {
        'lang-en': t.langEnglish,
        'lang-fa': t.langPersian,
        'lang-ar': t.langArabic
    };
    
    Object.keys(langButtons).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.innerHTML = langButtons[id];
        }
    });
    
    // ===== ۳. ترجمه دکمه‌های سطح AI =====
    const aiButtons = document.querySelectorAll('.ai-level-btn');
    if (aiButtons.length > 0) {
        aiButtons.forEach(btn => {
            const level = btn.dataset.level;
            if (level && t.aiLevels[level]) {
                btn.textContent = t.aiLevels[level];
            }
        });
    }
    
    // ===== ۴. تنظیم جهت صفحه =====
    if (lang === 'fa' || lang === 'ar') {
        // حالت راست‌به‌چپ
        document.body.classList.add('rtl');
        document.body.classList.remove('ltr');
        document.body.style.direction = 'rtl';
        document.body.style.textAlign = 'right';
        
        // تنظیم مخصوص فارسی و عربی
        const containers = document.querySelectorAll('.container, .side-panel, .modal-content');
        containers.forEach(el => {
            el.style.textAlign = 'right';
            el.style.fontFamily = lang === 'fa' ? 
                '"Sahel", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif' :
                '"Cairo", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        });
    } else {
        // حالت چپ‌به‌راست
        document.body.classList.add('ltr');
        document.body.classList.remove('rtl');
        document.body.style.direction = 'ltr';
        document.body.style.textAlign = 'left';
        document.body.style.fontFamily = '"Poppins", sans-serif';
    }
    
    // ===== ۵. مخفی کردن مودال زبان =====
    const languageModal = document.getElementById('languageModal');
    if (languageModal && !isInitialized) {
        setTimeout(() => {
            languageModal.style.display = 'none';
            console.log('مودال زبان مخفی شد');
        }, 500);
    }
    
    isInitialized = true;
    return true;
}

/**
 * تغییر زبان بازی
 * @param {string} lang - کد زبان
 */
function changeLanguage(lang) {
    if (!chessTranslations[lang]) {
        console.error(`زبان ${lang} پشتیبانی نمی‌شود!`);
        return false;
    }
    
    // نمایش انیمیشن تغییر زبان
    document.body.style.opacity = '0.7';
    setTimeout(() => {
        applyLanguage(lang);
        document.body.style.opacity = '1';
    }, 200);
    
    // بازگشت به وضعیت اولیه بازی
    setTimeout(() => {
        const gameStatus = document.getElementById('gameStatus');
        if (gameStatus) {
            gameStatus.textContent = chessTranslations[lang].status.waiting;
        }
    }, 300);
    
    return true;
}

/**
 * تنظیم رویداد کلیک برای دکمه‌های زبان
 */
function setupLanguageButtons() {
    // دکمه انگلیسی
    const btnEn = document.getElementById('lang-en');
    if (btnEn) {
        btnEn.onclick = function() { changeLanguage('en'); };
    }
    
    // دکمه فارسی
    const btnFa = document.getElementById('lang-fa');
    if (btnFa) {
        btnFa.onclick = function() { changeLanguage('fa'); };
    }
    
    // دکمه عربی
    const btnAr = document.getElementById('lang-ar');
    if (btnAr) {
        btnAr.onclick = function() { changeLanguage('ar'); };
    }
    
    // دکمه شروع بازی در مودال
    const playBtn = document.getElementById('playButton');
    if (playBtn) {
        playBtn.onclick = function() {
            const modal = document.getElementById('languageModal');
            if (modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        };
    }
    
    console.log('✅ دکمه‌های زبان تنظیم شدند');
}

/**
 * مقداردهی اولیه سیستم زبان
 */
function initLanguageSystem() {
    console.log('🚀 شروع سیستم چندزبانه...');
    
    // ۱. بررسی زبان ذخیره شده در localStorage
    const savedLang = localStorage.getItem('chessLanguage');
    
    // ۲. بررسی زبان مرورگر کاربر
    const browserLang = navigator.language || navigator.userLanguage;
    let detectedLang = 'en';
    
    if (savedLang && chessTranslations[savedLang]) {
        detectedLang = savedLang;
    } else if (browserLang.startsWith('fa') || browserLang.startsWith('ar')) {
        detectedLang = browserLang.substring(0, 2);
    }
    
    // ۳. اعمال زبان
    setTimeout(() => {
        applyLanguage(detectedLang);
        setupLanguageButtons();
    }, 100);
    
    // ۴. نمایش مودال اگر اولین بار است
    setTimeout(() => {
        const modal = document.getElementById('languageModal');
        if (modal && !savedLang) {
            modal.style.display = 'flex';
            modal.style.opacity = '1';
        }
    }, 1500);
    
    console.log(`🌍 زبان تشخیص داده شده: ${detectedLang}`);
    return detectedLang;
}

// ==================== بخش ۴: راه‌اندازی خودکار ====================

// فعال شدن پس از بارگذاری صفحه
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSystem);
} else {
    initLanguageSystem();
}

// در دسترس قرار دادن توابع برای استفاده در script.js
window.changeLanguage = changeLanguage;
window.currentLanguage = currentLanguage;
window.getTranslation = function(key) {
    const t = chessTranslations[currentLanguage];
    const keys = key.split('.');
    let result = t;
    
    for (const k of keys) {
        if (result && result[k] !== undefined) {
            result = result[k];
        } else {
            console.warn(`ترجمه برای کلید ${key} یافت نشد`);
            return key;
        }
    }
    
    return result;
};

console.log('✅ سیستم چندزبانه شطرنج بارگذاری شد!');
