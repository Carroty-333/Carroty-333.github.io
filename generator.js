/**
 * OBSカスタム時計ジェネレーター - 設定ページロジック (改訂版)
 */

let previewInterval;

// Google Fontsの読み込み情報
const googleFonts = {
    "'Noto Sans JP', sans-serif": "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap",
    "'M PLUS Rounded 1c', sans-serif": "https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&display=swap",
    "'Kosugi Maru', sans-serif": "https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap",
};

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateDayFormatOptions();
    loadFont(document.getElementById('fontFamily').value);
    updatePreview();
    startPreviewTimer();
});

function initializeEventListeners() {
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', updatePreview);
        input.addEventListener('input', updatePreview);
    });

    setupColorInputSync('fontColor', 'fontColorText');
    setupColorInputSync('strokeColor', 'strokeColorText');
    setupColorInputSync('previewBgColor', 'previewBgColorText', true);

    document.getElementById('fontPreset').addEventListener('change', (e) => {
        const fontFamilyInput = document.getElementById('fontFamily');
        if (e.target.value) {
            fontFamilyInput.value = e.target.value;
            loadFont(e.target.value);
            updatePreview();
        }
    });

    document.getElementById('fontFamily').addEventListener('change', (e) => {
        loadFont(e.target.value);
    });

    document.getElementById('generateUrl').addEventListener('click', generateUrl);
    document.getElementById('copyUrl').addEventListener('click', copyUrl);
}

function setupColorInputSync(pickerId, textId, isPreviewBg = false) {
    const colorPicker = document.getElementById(pickerId);
    const colorText = document.getElementById(textId);
    
    const updateFunction = isPreviewBg ? updatePreviewBackground : updatePreview;

    colorPicker.addEventListener('input', (e) => {
        colorText.value = e.target.value;
        updateFunction();
    });
    
    colorText.addEventListener('input', (e) => {
        if (/^#[0-9a-f]{6}$/i.test(e.target.value)) {
            colorPicker.value = e.target.value;
            updateFunction();
        }
    });
}

function updateDayFormatOptions() {
    const now = new Date();
    const dayIndex = now.getDay();
    document.getElementById('day-format-short').textContent = ['(日)', '(月)', '(火)', '(水)', '(木)', '(金)', '(土)'][dayIndex];
    document.getElementById('day-format-medium').textContent = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'][dayIndex];
    document.getElementById('day-format-long').textContent = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'][dayIndex];
    document.getElementById('day-format-en-short').textContent = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
    document.getElementById('day-format-en-upper').textContent = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dayIndex];
}

function loadFont(fontFamily) {
    const fontName = fontFamily.split(',')[0].replace(/'/g, "").trim();
    const googleFontLink = document.getElementById('googleFontLink');
    const url = Object.keys(googleFonts).find(key => key.includes(fontName));
    if (url && googleFonts[url]) {
        googleFontLink.href = googleFonts[url];
    } else {
        googleFontLink.href = "";
    }
}

function getCurrentSettings() {
    return {
        showYear: document.getElementById('showYear').checked,
        showDate: document.getElementById('showDate').checked,
        showDay: document.getElementById('showDay').checked,
        dateFormat: document.querySelector('input[name="dateFormat"]:checked')?.value || 'japanese',
        dayFormat: document.getElementById('dayFormat').value,
        timeFormat: document.querySelector('input[name="timeFormat"]:checked')?.value || 'colon-hm',
        layout: document.querySelector('input[name="layout"]:checked')?.value || 'horizontal',
        elementSpacing: parseInt(document.getElementById('elementSpacing').value),
        lineSpacing: parseInt(document.getElementById('lineSpacing').value),
        fontFamily: document.getElementById('fontFamily').value,
        fontColor: document.getElementById('fontColor').value,
        yearFontSize: parseInt(document.getElementById('yearFontSize').value),
        dateFontSize: parseInt(document.getElementById('dateFontSize').value),
        dayFontSize: parseInt(document.getElementById('dayFontSize').value),
        timeFontSize: parseInt(document.getElementById('timeFontSize').value),
        textStroke: document.getElementById('textStroke').checked,
        strokeWidth: parseInt(document.getElementById('strokeWidth').value),
        strokeColor: document.getElementById('strokeColor').value,
    };
}

function updatePreview() {
    const settings = getCurrentSettings();
    const preview = document.getElementById('clockPreview');
    preview.innerHTML = generateClockHTML(new Date(), settings);
    applyClockStyles(preview, settings);
    updatePreviewBackground();
}

function updatePreviewBackground() {
    const bgColor = document.getElementById('previewBgColor').value;
    document.getElementById('previewArea').style.backgroundColor = bgColor;
}

function generateClockHTML(date, settings) {
    const dateSectionParts = [];
    if (settings.showYear && settings.showDate) {
        const year = `<span class="year-element">${date.getFullYear()}</span>`;
        const dateStr = `<span class="date-element">${formatDate(date, settings.dateFormat)}</span>`;
        if (settings.dateFormat === 'japanese') dateSectionParts.push(`${year}年${dateStr}`);
        else if (settings.dateFormat === 'slash') dateSectionParts.push(`${year}/${dateStr}`);
        else if (settings.dateFormat === 'dot') dateSectionParts.push(`${year}.${dateStr}`);
    } else if (settings.showYear) {
        dateSectionParts.push(`<span class="year-element">${date.getFullYear()}年</span>`);
    } else if (settings.showDate) {
        dateSectionParts.push(`<span class="date-element">${formatDate(date, settings.dateFormat, true)}</span>`);
    }

    if (settings.showDay) {
        dateSectionParts.push(`<span class="day-element">${formatDay(date, settings.dayFormat)}</span>`);
    }

    const timePart = `<span class="time-element">${formatTime(date, settings.timeFormat)}</span>`;

    if (settings.layout === 'vertical') {
        const dateHtml = dateSectionParts.length > 0 ? `<div class="date-section">${dateSectionParts.join(' ')}</div>` : '';
        const timeHtml = `<div class="time-section">${timePart}</div>`;
        return `${dateHtml}${timeHtml}`;
    } else {
        const allParts = [...dateSectionParts, timePart];
        return allParts.join(' ');
    }
}

function formatDate(date, format, single = false) {
    const m = date.getMonth() + 1, d = date.getDate();
    const pad = (num) => String(num).padStart(2, '0');
    if (single && format === 'japanese') return `${m}月${d}日`;
    switch (format) {
        case 'japanese': return `${m}月${d}日`;
        case 'slash': return `${pad(m)}/${pad(d)}`;
        case 'dot': return `${pad(m)}.${pad(d)}`;
        default: return `${m}月${d}日`;
    }
}

function formatDay(date, format) {
    const dayIndex = date.getDay();
    const days = {
        short: ['(日)', '(月)', '(火)', '(水)', '(木)', '(金)', '(土)'],
        medium: ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'],
        long: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
        'en-short': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        'en-upper': ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    };
    return (days[format] || days.short)[dayIndex];
}

function formatTime(date, format) {
    const h = date.getHours(), m = date.getMinutes(), s = date.getSeconds();
    const pad = (num) => String(num).padStart(2, '0');
    switch (format) {
        case 'japanese-hm': return `${h}時${m}分`;
        case 'japanese-hms': return `${h}時${m}分${s}秒`;
        case 'colon-hm': return `${pad(h)}:${pad(m)}`;
        case 'colon-hms': return `${pad(h)}:${pad(m)}:${pad(s)}`;
        default: return `${pad(h)}:${pad(m)}`;
    }
}

function applyClockStyles(element, settings) {
    element.className = `clock-display ${settings.layout}`;
    element.style.fontFamily = settings.fontFamily;
    element.style.color = settings.fontColor;

    if (settings.layout === 'horizontal') {
        element.style.gap = `${settings.elementSpacing}px`;
    } else {
        element.style.gap = `${settings.lineSpacing}px`;
        const dateSection = element.querySelector('.date-section');
        if (dateSection) dateSection.style.gap = `${settings.elementSpacing}px`;
    }
    
    const setStyle = (selector, prop, value) => {
        element.querySelectorAll(selector).forEach(el => el.style[prop] = value);
    };
    
    setStyle('.year-element', 'fontSize', `${settings.yearFontSize}px`);
    setStyle('.date-element', 'fontSize', `${settings.dateFontSize}px`);
    setStyle('.day-element', 'fontSize', `${settings.dayFontSize}px`);
    setStyle('.time-element', 'fontSize', `${settings.timeFontSize}px`);
    
    if (settings.textStroke && settings.strokeWidth > 0) {
        const { strokeWidth, strokeColor } = settings;
        const shadows = [];
        const step = 22.5; // 360 / 16
        for(let i = 0; i < 360; i += step) {
            const angle = i * (Math.PI / 180);
            const x = strokeWidth * Math.cos(angle);
            const y = strokeWidth * Math.sin(angle);
            shadows.push(`${x}px ${y}px 0 ${strokeColor}`);
        }
        element.style.textShadow = shadows.join(',');
    } else {
        element.style.textShadow = 'none';
    }
}

function startPreviewTimer() {
    if (previewInterval) clearInterval(previewInterval);
    previewInterval = setInterval(updatePreview, 1000);
}

function generateUrl() {
    const settings = getCurrentSettings();
    const fontName = settings.fontFamily.split(',')[0].replace(/'/g, "").trim();
    const googleFontUrl = Object.keys(googleFonts).find(key => key.includes(fontName));
    if (googleFontUrl) {
        settings.googleFont = encodeURIComponent(googleFonts[googleFontUrl]);
    }
    
    const path = window.location.pathname.replace('index.html', '').replace(/\/$/, '');
    const baseUrl = `${window.location.origin}${path}/clock.html`;
    const params = new URLSearchParams(settings);
    
    document.getElementById('generatedUrl').value = `${baseUrl}?${params.toString()}`;
}

async function copyUrl() {
    const urlTextarea = document.getElementById('generatedUrl');
    if (!urlTextarea.value) {
        alert('まずURLを発行してください。');
        return;
    }
    try {
        await navigator.clipboard.writeText(urlTextarea.value);
        const copyBtn = document.getElementById('copyUrl');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'コピーしました！';
        copyBtn.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.backgroundColor = '';
        }, 2000);
    } catch (err) {
        urlTextarea.select();
        document.execCommand('copy');
        alert('URLをクリップボードにコピーしました。');
    }
}