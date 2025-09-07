/**
 * OBSカスタム時計ジェネレーター - 設定ページロジック (改訂版 4)
 */
let previewInterval;

const googleFonts = {
    "'Noto Sans JP', sans-serif": "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap",
    "'M PLUS Rounded 1c', sans-serif": "https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&display=swap",
    "'Kosugi Maru', sans-serif": "https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap",
};

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    populateFontSelector();
    updateDayFormatOptions();
    loadFont(document.getElementById('fontFamily').value);
    updatePreview();
    startPreviewTimer();
});

function initializeEventListeners() {
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', updatePreview); input.addEventListener('input', updatePreview);
    });
    setupColorInputSync('fontColor', 'fontColorText');
    setupColorInputSync('strokeColor', 'strokeColorText');
    setupColorInputSync('previewBgColor', 'previewBgColorText', true);
    document.getElementById('fontPreset').addEventListener('change', (e) => {
        const fontFamilyInput = document.getElementById('fontFamily');
        if (e.target.value) {
            fontFamilyInput.value = e.target.value;
            loadFont(e.target.value); updatePreview();
        }
    });
    document.getElementById('fontFamily').addEventListener('change', (e) => loadFont(e.target.value));
    document.getElementById('generateUrl').addEventListener('click', generateUrl);
    document.getElementById('copyUrl').addEventListener('click', copyUrl);
}

async function populateFontSelector() {
    const select = document.getElementById('fontPreset');
    select.innerHTML = '<option value="" disabled>-- Webフォント (全環境共通) --</option>';
    for (const font in googleFonts) {
        select.add(new Option(font.split(',')[0].replace(/'/g, ""), font));
    }
    select.value = "'Noto Sans JP', sans-serif";
    const localFontsSeparator = new Option('--- PCのフォント (Chrome/Edge推奨) ---', '');
    localFontsSeparator.disabled = true;
    select.add(localFontsSeparator);
    if ('queryLocalFonts' in window) {
        try {
            const fonts = await window.queryLocalFonts();
            [...new Set(fonts.map(f => f.family))].sort().forEach(family => select.add(new Option(family, `"${family}"`)));
        } catch (err) { select.add(new Option('取得に失敗しました', '', false, false)).disabled = true; console.warn(err); }
    } else { select.add(new Option('お使いのブラウザは非対応です', '', false, false)).disabled = true; }
}

function setupColorInputSync(pickerId, textId, isPreviewBg = false) {
    const picker = document.getElementById(pickerId), text = document.getElementById(textId);
    const updateFn = isPreviewBg ? updatePreviewBackground : updatePreview;
    picker.addEventListener('input', e => { text.value = e.target.value; updateFn(); });
    text.addEventListener('input', e => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { picker.value = e.target.value; updateFn(); } });
}

function updateDayFormatOptions() {
    const now = new Date(), dayIndex = now.getDay();
    document.getElementById('day-format-short').textContent = ['(日)','(月)','(火)','(水)','(木)','(金)','(土)'][dayIndex];
    document.getElementById('day-format-medium').textContent = ['日曜','月曜','火曜','水曜','木曜','金曜','土曜'][dayIndex];
    document.getElementById('day-format-long').textContent = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'][dayIndex];
    document.getElementById('day-format-en-short').textContent = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayIndex];
    document.getElementById('day-format-en-upper').textContent = ['SUN','MON','TUE','WED','THU','FRI','SAT'][dayIndex];
}

function loadFont(fontFamily) { document.getElementById('googleFontLink').href = googleFonts[fontFamily] || ""; }

function getCurrentSettings() {
    return {
        showYear: document.getElementById('showYear').checked, showDate: document.getElementById('showDate').checked, showDay: document.getElementById('showDay').checked,
        dateFormat: document.querySelector('input[name="dateFormat"]:checked')?.value, dayFormat: document.getElementById('dayFormat').value, timeFormat: document.querySelector('input[name="timeFormat"]:checked')?.value,
        layout: document.querySelector('input[name="layout"]:checked')?.value,
        spacingYearDate: parseInt(document.getElementById('spacingYearDate').value), spacingDateDay: parseInt(document.getElementById('spacingDateDay').value), spacingDayTime: parseInt(document.getElementById('spacingDayTime').value), spacingDot: parseInt(document.getElementById('spacingDot').value), lineSpacing: parseInt(document.getElementById('lineSpacing').value),
        fontFamily: document.getElementById('fontFamily').value, fontColor: document.getElementById('fontColor').value,
        yearFontSize: parseInt(document.getElementById('yearFontSize').value), dateFontSize: parseInt(document.getElementById('dateFontSize').value), dayFontSize: parseInt(document.getElementById('dayFontSize').value), timeFontSize: parseInt(document.getElementById('timeFontSize').value),
        textStroke: document.getElementById('textStroke').checked, strokeWidth: parseInt(document.getElementById('strokeWidth').value), strokeColor: document.getElementById('strokeColor').value,
    };
}

function updatePreview() {
    const settings = getCurrentSettings();
    const preview = document.getElementById('clockPreview');
    preview.innerHTML = generateClockHTML(new Date(), settings);
    applyClockStyles(preview, settings);
    updatePreviewBackground();
}

function updatePreviewBackground() { document.getElementById('previewArea').style.backgroundColor = document.getElementById('previewBgColor').value; }

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
function formatYear(date, settings) { return `<span class="year-element">${date.getFullYear()}${settings.dateFormat === 'japanese' ? '年' : ''}</span>`; }
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
        if (year) year.style.marginRight = `${settings.spacingYearDate}px`;
        if (date) date.style.marginRight = `${settings.spacingDateDay}px`;
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

function startPreviewTimer() { if (previewInterval) clearInterval(previewInterval); previewInterval = setInterval(updatePreview, 1000); }

function generateUrl() {
    const settings = getCurrentSettings();
    if (googleFonts[settings.fontFamily]) { settings.googleFont = encodeURIComponent(googleFonts[settings.fontFamily]); }
    const path = window.location.pathname.replace('index.html', '').replace(/\/$/, '');
    const baseUrl = `${window.location.origin}${path}/clock.html`;
    const params = new URLSearchParams(settings);
    document.getElementById('generatedUrl').value = `${baseUrl}?${params.toString()}`;
}

async function copyUrl() {
    const urlTextarea = document.getElementById('generatedUrl');
    if (!urlTextarea.value) { alert('まずURLを発行してください。'); return; }
    try {
        await navigator.clipboard.writeText(urlTextarea.value);
        const btn = document.getElementById('copyUrl'), originalText = btn.textContent;
        btn.textContent = 'コピーしました！'; btn.style.backgroundColor = '#4CAF50';
        setTimeout(() => { btn.textContent = originalText; btn.style.backgroundColor = ''; }, 2000);
    } catch (err) { urlTextarea.select(); document.execCommand('copy'); alert('URLをクリップボードにコピーしました。'); }
}