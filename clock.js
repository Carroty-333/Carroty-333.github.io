/**
 * OBSカスタム時計ジェネレーター - 時計表示ページロジック
 * URLパラメータから設定を読み込み、動的に時計を表示
 */

let clockInterval;
let clockSettings = {};

const defaultSettings = {
    showYear: true, showDate: true, showDay: true,
    dateFormat: 'japanese', dayFormat: 'short', timeFormat: 'colon-hm',
    layout: 'horizontal',
    elementSpacing: 10, lineSpacing: 5,
    fontFamily: 'Arial, sans-serif', fontColor: '#ffffff',
    yearFontSize: 24, dateFontSize: 24, dayFontSize: 24, timeFontSize: 32,
    textStroke: false, strokeWidth: 2, strokeColor: '#000000'
};

document.addEventListener('DOMContentLoaded', function() {
    loadSettingsFromURL();
    updateClock();
    startClockTimer();
});

function loadSettingsFromURL() {
    const params = new URLSearchParams(window.location.search);
    clockSettings = { ...defaultSettings };
    for (const [key, value] of params.entries()) {
        if (key in defaultSettings) {
            const defaultValue = defaultSettings[key];
            if (typeof defaultValue === 'boolean') {
                clockSettings[key] = value === 'true';
            } else if (typeof defaultValue === 'number') {
                clockSettings[key] = parseInt(value, 10) || defaultValue;
            } else {
                clockSettings[key] = value;
            }
        }
    }
}

function updateClock() {
    const clockElement = document.getElementById('clockDisplay');
    const now = new Date();
    clockElement.innerHTML = generateClockHTML(now, clockSettings);
    applyClockStyles(clockElement, clockSettings);
}

function generateClockHTML(date, settings) {
    const parts = [];
    if (settings.showYear) parts.push(`<span class="year-element">${date.getFullYear()}年</span>`);
    if (settings.showDate) parts.push(`<span class="date-element">${formatDate(date, settings.dateFormat)}</span>`);
    if (settings.showDay) parts.push(`<span class="day-element">${formatDay(date, settings.dayFormat)}</span>`);
    parts.push(`<span class="time-element">${formatTime(date, settings.timeFormat)}</span>`);
    if (settings.layout === 'vertical') {
        const dateParts = [];
        if (settings.showYear) dateParts.push(parts.shift());
        if (settings.showDate) dateParts.push(parts.shift());
        if (settings.showDay) dateParts.push(parts.shift());
        const timePart = parts.join(' ');
        return `<div class="date-section">${dateParts.join(' ')}</div><div class="time-section">${timePart}</div>`;
    }
    return parts.join(' ');
}

function formatDate(date, format) {
    const m = date.getMonth() + 1, d = date.getDate();
    switch (format) {
        case 'japanese': return `${m}月${d}日`;
        case 'slash': return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
        case 'dot': return `${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
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
        case 'colon-hm': return `${pad(h)}:${pad(m)}`;
        case 'japanese-hms': return `${h}時${m}分${s}秒`;
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
        const el = element.querySelector(selector);
        if (el) el.style[prop] = value;
    };
    setStyle('.year-element', 'fontSize', `${settings.yearFontSize}px`);
    setStyle('.date-element', 'fontSize', `${settings.dateFontSize}px`);
    setStyle('.day-element', 'fontSize', `${settings.dayFontSize}px`);
    setStyle('.time-element', 'fontSize', `${settings.timeFontSize}px`);
    if (settings.textStroke && settings.strokeWidth > 0) {
        const { strokeWidth, strokeColor, fontColor } = settings;
        let shadowParts = [];
        for (let i = -strokeWidth; i <= strokeWidth; i++) {
            for (let j = -strokeWidth; j <= strokeWidth; j++) {
                if (i !== 0 || j !== 0) {
                    shadowParts.push(`${i}px ${j}px 0 ${strokeColor}`);
                }
            }
        }
        element.style.textShadow = shadowParts.join(', ');
        element.style.webkitTextStroke = `${strokeWidth}px ${strokeColor}`;
        element.style.webkitTextFillColor = fontColor;
    } else {
        element.style.textShadow = 'none';
        element.style.webkitTextStroke = 'none';
        element.style.webkitTextFillColor = 'inherit';
    }
}

function startClockTimer() {
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);
}