// بخش مدیریت چندزبانی در script.js
let translations = {};
let currentLanguage = 'en';

// تابع بارگذاری ترجمه‌ها
async function loadTranslations(lang) {
    try {
        const response = await fetch(`i18n/${lang}.json`);
        translations[lang] = await response.json();
        applyTranslations(lang);
    } catch (error) {
        console.error(`Error loading ${lang} translation:`, error);
        // Fallback به انگلیسی
        if (lang !== 'en') loadTranslations('en');
    }
}

// تابع اعمال ترجمه‌ها به عناصر صفحه
function applyTranslations(lang) {
    currentLanguage = lang;
    const t = translations[lang];
    
    // ترجمه عناصر با id مشخص
    document.getElementById('title').textContent = t.title;
    document.getElementById('themeText').textContent = t.themeText;
    document.getElementById('aiText').textContent = t.aiText;
    document.getElementById('undoText').textContent = t.undoText;
    document.getElementById('resetText').textContent = t.resetText;
    document.getElementById('moveHistoryTitle').textContent = t.moveHistoryTitle;
    document.getElementById('gameStatusTitle').textContent = t.gameStatusTitle;
    document.getElementById('colorTitle').textContent = t.colorTitle;
    document.getElementById('boardColorLabel').textContent = t.boardColorLabel;
    document.getElementById('pieceColorLabel').textContent = t.pieceColorLabel;
    
    // تغییر جهت صفحه برای فارسی و عربی
    if (lang === 'fa' || lang === 'ar') {
        document.body.style.direction = 'rtl';
        document.querySelector('.container').style.textAlign = 'right';
    } else {
        document.body.style.direction = 'ltr';
        document.querySelector('.container').style.textAlign = 'left';
    }
}

// تابع تغییر زبان
function setLanguage(lang) {
    document.getElementById('languageModal').style.display = 'none';
    loadTranslations(lang);
    localStorage.setItem('chessLanguage', lang); // ذخیره در حافظه مرورگر
}

// در بارگذاری اولیه صفحه
document.addEventListener('DOMContentLoaded', function() {
    // بررسی زبان ذخیره شده یا پیش‌فرض
    const savedLang = localStorage.getItem('chessLanguage') || 'en';
    loadTranslations(savedLang);
    
    // اگر زبان ذخیره شده دارد، مودال را نشان نده
    if (!localStorage.getItem('chessLanguage')) {
        document.getElementById('languageModal').style.display = 'flex';
    }
});
