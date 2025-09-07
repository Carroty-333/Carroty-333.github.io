/**
 * OBSカスタム時計ジェネレーター - 時計表示ページロジック (改訂版 2)
 */
let clockInterval;
let clockSettings = {};

const defaultSettings = {
    showYear: true, showDate: true, showDay: true,
    dateFormat: 'japanese', dayFormat: 'short', timeFormat: 'colon-hm',
    layout: 'horizontal',
    spacingYearDate: 8, spacingDateDay: 15, spacingDayTime: 20, lineSpacing: 5,
    fontFamily: "'Noto Sans JP', sans-serif", fontColor: '#ffffff',
    yearFontSize: 32, dateFontSize: 32, dayFontSize: 32, timeFontSize: 48,
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
            const defVal = defaultSettings[key];
            if (typeof defVal === 'boolean') clockSettings[key] = value === 'true';
            else if (typeof defVal === 'number') clockSettings[key] = parseInt(value, 10) || defVal;
            else clockSettings[key] = decodeURIComponent(value);
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
function startClockTimer() {
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);
}

// --- HTML Generation and Styling (generator.jsと共通) ---
function generateClockHTML(date, settings) {
    const parts = [];
    if (settings.showYear || settings.showDate) { parts.push({ type: 'date', wrapperClass: 'date-wrapper', content: formatDate(date, settings) }); }
    if (settings.showDay) { parts.push({ type: 'day', wrapperClass: 'day-wrapper', content: `<span class="day-element">${formatDay(date, settings.dayFormat)}</span>` }); }
    parts.push({ type: 'time', wrapperClass: 'time-wrapper', content: `<span class="time-element">${formatTime(date, settings.timeFormat)}</span>` });

    if (settings.layout === 'vertical') {
        const datePartsHtml = parts.filter(p => p.type !== 'time').map(p => `<div class="part-wrapper ${p.wrapperClass}">${p.content}</div>`).join('');
        const timePartHtml = parts.filter(p => p.type === 'time').map(p => `<div class="part-wrapper ${p.wrapperClass}">${p.content}</div>`).join('');
        return `<div class="date-section">${datePartsHtml}</div><div class="time-section">${timePartHtml}</div>`;
    }
    return parts.map(p => `<div class="part-wrapper ${p.wrapperClass}">${p.content}</div>`).join('');
}
function formatDate(date, settings) {
    if (!settings.showYear && !settings.showDate) return '';
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    const pad = (n) => String(n).padStart(2, '0');
    const sep = (s) => `<span class="date-element separator">${s}</span>`;
    let yearPart = settings.showYear ? `<span class="year-element">${y}</span>` : '';
    let datePart = '';
    if (settings.showDate) {
        switch (settings.dateFormat) {
            case 'japanese': datePart = (settings.showYear ? `<span class="year-element">年</span>` : '') + `<span class="date-element">${m}</span><span class="date-element">月</span><span class="date-element">${d}</span><span class="date-element">日</span>`; break;
            case 'slash': datePart = (settings.showYear ? sep('/') : '') + `<span class="date-element">${pad(m)}</span>${sep('/')}<span class="date-element">${pad(d)}</span>`; break;
            case 'dot': datePart = (settings.showYear ? sep('.') : '') + `<span class="date-element">${pad(m)}</span>${sep('.')}<span class="date-element">${pad(d)}</span>`; break;
        }
    } else if (settings.showYear) { datePart = '年'; }
    return yearPart + datePart;
}
function formatDay(date, format) {
    const days = { short: ['(日)','(月)','(火)','(水)','(木)','(金)','(土)'], medium: ['日曜','月曜','火曜','水曜','木曜','金曜','土曜'], long: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'], 'en-short': ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], 'en-upper': ['SUN','MON','TUE','WED','THU','FRI','SAT'] };
    return (days[format] || days.short)[date.getDay()];
}
function formatTime(date, format) {
    const h = date.getHours(), m = date.getMinutes(), s = date.getSeconds();
    const pad = (n) => String(n).padStart(2, '0');
    switch (format) {
        case 'japanese-hm': return `${h}時${m}分`; case 'japanese-hms': return `${h}時${m}分${s}秒`;
        case 'colon-hm': return `${pad(h)}:${pad(m)}`; case 'colon-hms': return `${pad(h)}:${pad(m)}:${pad(s)}`;
        default: return `${pad(h)}:${pad(m)}`;
    }
}
function applyClockStyles(element, settings) {
    element.className = `clock-display ${settings.layout}`;
    element.style.fontFamily = settings.fontFamily;
    element.style.color = settings.fontColor;
    
    // Individual Spacing for horizontal layout
    if (settings.layout === 'horizontal') {
        const dateWrapper = element.querySelector('.date-wrapper'), dayWrapper = element.querySelector('.day-wrapper'), timeWrapper = element.querySelector('.time-wrapper');
        if (dateWrapper && dayWrapper) { dateWrapper.style.marginRight = `${settings.spacingDateDay}px`; }
        else if (dateWrapper && timeWrapper) { dateWrapper.style.marginRight = `${settings.spacingDayTime}px`; }
        if (dayWrapper && timeWrapper) { dayWrapper.style.marginRight = `${settings.spacingDayTime}px`; }
    } else {
        // Spacing for vertical layout
        element.style.gap = `${settings.lineSpacing}px`;
        const dateSection = element.querySelector('.date-section');
        if(dateSection) {
            const dateWrapper = dateSection.querySelector('.date-wrapper'), dayWrapper = dateSection.querySelector('.day-wrapper');
            if (dateWrapper && dayWrapper) dateWrapper.style.marginRight = `${settings.spacingDateDay}px`;
        }
    }
    
    element.querySelectorAll('.year-element').forEach(el => el.style.fontSize = `${settings.yearFontSize}px`);
    element.querySelectorAll('.date-element').forEach(el => el.style.fontSize = `${settings.dateFontSize}px`);
    element.querySelectorAll('.day-element').forEach(el => el.style.fontSize = `${settings.dayFontSize}px`);
    element.querySelectorAll('.time-element').forEach(el => el.style.fontSize = `${settings.timeFontSize}px`);
    
    if (settings.textStroke && settings.strokeWidth > 0) {
        const { strokeWidth, strokeColor } = settings, shadows = [];
        for(let i = 0; i < 360; i += 22.5) {
            const angle = i * (Math.PI / 180);
            shadows.push(`${strokeWidth * Math.cos(angle)}px ${strokeWidth * Math.sin(angle)}px 0 ${strokeColor}`);
        }
        element.style.textShadow = shadows.join(',');
    } else {
        element.style.textShadow = 'none';
    }
}