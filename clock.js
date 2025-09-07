/**
 * OBSカスタム時計ジェネレーター - 時計表示ページロジック (改訂版 4.1)
 */
let clockInterval;
let clockSettings = {};

const defaultSettings = {
    showYear: true, showDate: true, showDay: true,
    dateFormat: 'japanese', dayFormat: 'short', timeFormat: 'colon-hm',
    layout: 'horizontal',
    spacingYearDate: 8, spacingDateDay: 15, spacingDayTime: 20, spacingDot: -2, lineSpacing: 0,
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
            else if (typeof defVal === 'number') clockSettings[key] = parseInt(value, 10);
            else clockSettings[key] = decodeURIComponent(value);
        }
    }
}
function loadGoogleFont() { if (clockSettings.googleFont) { const link = document.createElement('link'); link.href = clockSettings.googleFont; link.rel = 'stylesheet'; document.head.appendChild(link); } }
function updateClock() { const clockElement = document.getElementById('clockDisplay'); clockElement.innerHTML = generateClockHTML(new Date(), clockSettings); applyClockStyles(clockElement, clockSettings); }
function startClockTimer() { if (clockInterval) clearInterval(clockInterval); clockInterval = setInterval(updateClock, 1000); }

// --- HTML Generation and Styling (generator.jsと共通) ---
function generateClockHTML(date, settings) {
    const visibleParts = [];
    if (settings.showYear) visibleParts.push({ type: 'year', wrapperClass: 'year-wrapper', content: formatYear(date, settings) });
    if (settings.showDate) visibleParts.push({ type: 'date', wrapperClass: 'date-wrapper', content: formatDateOnly(date, settings) });
    if (settings.showDay) visibleParts.push({ type: 'day', wrapperClass: 'day-wrapper', content: `<span class="day-element">${formatDay(date, settings.dayFormat)}</span>` });
    visibleParts.push({ type: 'time', wrapperClass: 'time-wrapper', content: `<span class="time-element">${formatTime(date, settings.timeFormat)}</span>` });
    if (settings.layout === 'vertical') {
        const datePartsHtml = visibleParts.filter(p => p.type !== 'time').map(p => `<div class="part-wrapper ${p.wrapperClass}">${p.content}</div>`).join('');
        const timePartHtml = visibleParts.filter(p => p.type === 'time').map(p => `<div class="part-wrapper ${p.wrapperClass}">${p.content}</div>`).join('');
        return `<div class="date-section">${datePartsHtml}</div><div class="time-section">${timePartHtml}</div>`;
    }
    return visibleParts.map(p => `<div class="part-wrapper ${p.wrapperClass}">${p.content}</div>`).join('');
}
// --- バグ修正箇所 ---
function formatYear(date, settings) {
    const yearStr = `<span class="year-element">${date.getFullYear()}</span>`;
    let separator = '';

    if (settings.dateFormat === 'japanese') {
        separator = `<span class="year-element">年</span>`;
    } else if (settings.showDate) { // 日付も表示される場合のみ ./ を追加
        const sepStyle = `style="margin: 0 ${settings.spacingDot}px;"`;
        if (settings.dateFormat === 'slash') {
            separator = `<span class="date-element separator" ${sepStyle}>/</span>`;
        } else if (settings.dateFormat === 'dot') {
            separator = `<span class="date-element separator" ${sepStyle}>.</span>`;
        }
    }
    return yearStr + separator;
}
function formatDateOnly(date, settings) {
    const m = date.getMonth() + 1, d = date.getDate(), pad = (n) => String(n).padStart(2, '0');
    const sep = (s) => `<span class="date-element separator" style="margin: 0 ${settings.spacingDot}px;">${s}</span>`;
    switch (settings.dateFormat) {
        case 'japanese': return `<span class="date-element">${m}月${d}日</span>`;
        case 'slash': return `<span class="date-element">${pad(m)}</span>${sep('/')}<span class="date-element">${pad(d)}</span>`;
        case 'dot': return `<span class="date-element">${pad(m)}</span>${sep('.')}<span class="date-element">${pad(d)}</span>`;
    }
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
    const applyMargins = (container) => {
        container.querySelectorAll('.part-wrapper').forEach(w => w.style.marginRight = '0');
        const year = container.querySelector('.year-wrapper'), date = container.querySelector('.date-wrapper'), day = container.querySelector('.day-wrapper');
        if (year && date) year.style.marginRight = `${settings.spacingYearDate}px`;
        if (date && day) date.style.marginRight = `${settings.spacingDateDay}px`;
        if (day) day.style.marginRight = `${settings.spacingDayTime}px`;
        const wrappers = container.querySelectorAll('.part-wrapper');
        if (wrappers.length > 0) wrappers[wrappers.length - 1].style.marginRight = '0px';
    };
    if (settings.layout === 'horizontal') { applyMargins(element); } 
    else { element.style.gap = `${settings.lineSpacing}px`; const dateSection = element.querySelector('.date-section'); if(dateSection) applyMargins(dateSection); }
    element.querySelectorAll('.year-element').forEach(el => el.style.fontSize = `${settings.yearFontSize}px`);
    element.querySelectorAll('.date-element').forEach(el => el.style.fontSize = `${settings.dateFontSize}px`);
    element.querySelectorAll('.day-element').forEach(el => el.style.fontSize = `${settings.dayFontSize}px`);
    element.querySelectorAll('.time-element').forEach(el => el.style.fontSize = `${settings.timeFontSize}px`);
    if (settings.textStroke && settings.strokeWidth > 0) {
        const { strokeWidth, strokeColor } = settings, shadows = [];
        for(let i = 0; i < 360; i += 16) {
            const angle = i * (Math.PI / 180);
            shadows.push(`${strokeWidth * Math.cos(angle)}px ${strokeWidth * Math.sin(angle)}px 0 ${strokeColor}`);
        }
        element.style.textShadow = shadows.join(',');
    } else { element.style.textShadow = 'none'; }
}