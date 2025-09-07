/**
 * OBSカスタム時計ジェネレーター - 時計表示ページロジック (改訂版)
 */

let clockInterval;
let clockSettings = {};

const defaultSettings = {
    showYear: true, showDate: true, showDay: true,
    dateFormat: 'japanese', dayFormat: 'short', timeFormat: 'colon-hm',
    layout: 'horizontal',
    elementSpacing: 15, lineSpacing: 10,
    fontFamily: "'Noto Sans JP', sans-serif", fontColor: '#ffffff',
    yearFontSize: 24, dateFontSize: 24, dayFontSize: 24, timeFontSize: 48,
    textStroke: true, strokeWidth: 2, strokeColor: '#000000',
    googleFont: ''
};

document.addEventListener('DOMContentLoaded', () => {
    loadSettingsFromURL();
    loadGoogleFont();
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
                clockSettings[key] = decodeURIComponent(value);
            }
        }
    }
}

function loadGoogleFont() {
    if (clockSettings.googleFont) {
        const link = document.createElement('link');
        link.href = clockSettings.googleFont;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
}

function updateClock() {
    const clockElement = document.getElementById('clockDisplay');
    clockElement.innerHTML = generateClockHTML(new Date(), clockSettings);
    applyClockStyles(clockElement, clockSettings);
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

function startClockTimer() {
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);
}