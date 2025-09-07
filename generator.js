/**
 * OBSカスタム時計ジェネレーター - 設定ページロジック
 * 設定の変更を監視し、プレビューをリアルタイム更新、URL生成機能を提供
 */

// プレビュー更新用のタイマーID
let previewInterval;

// DOM読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updatePreview();
    startPreviewTimer();
});

/**
 * イベントリスナーを初期化
 */
function initializeEventListeners() {
    // すべての設定項目にイベントリスナーを追加
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', updatePreview);
        input.addEventListener('input', updatePreview);
    });

    // カラーピッカーとテキスト入力の連携
    setupColorInputSync('fontColor', 'fontColorText');
    setupColorInputSync('strokeColor', 'strokeColorText');

    // URL発行とコピー機能
    document.getElementById('generateUrl').addEventListener('click', generateUrl);
    document.getElementById('copyUrl').addEventListener('click', copyUrl);
}

/**
 * カラーピッカーとテキスト入力の同期設定
 * @param {string} pickerId - カラーピッカーのID
 * @param {string} textId - テキスト入力欄のID
 */
function setupColorInputSync(pickerId, textId) {
    const colorPicker = document.getElementById(pickerId);
    const colorText = document.getElementById(textId);
    
    colorPicker.addEventListener('input', (e) => {
        colorText.value = e.target.value;
        updatePreview();
    });
    
    colorText.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
            colorPicker.value = e.target.value;
            updatePreview();
        }
    });
}

/**
 * 現在の設定を取得
 */
function getCurrentSettings() {
    return {
        showYear: document.getElementById('showYear').checked,
        showDate: document.getElementById('showDate').checked,
        showDay: document.getElementById('showDay').checked,
        dateFormat: document.querySelector('input[name="dateFormat"]:checked')?.value || 'japanese',
        dayFormat: document.getElementById('dayFormat').value,
        timeFormat: document.querySelector('input[name="timeFormat"]:checked')?.value || 'colon-hm',
        layout: document.querySelector('input[name="layout"]:checked')?.value || 'horizontal',
        elementSpacing: parseInt(document.getElementById('elementSpacing').value) || 10,
        lineSpacing: parseInt(document.getElementById('lineSpacing').value) || 5,
        fontFamily: document.getElementById('fontFamily').value,
        fontColor: document.getElementById('fontColor').value,
        yearFontSize: parseInt(document.getElementById('yearFontSize').value),
        dateFontSize: parseInt(document.getElementById('dateFontSize').value),
        dayFontSize: parseInt(document.getElementById('dayFontSize').value),
        timeFontSize: parseInt(document.getElementById('timeFontSize').value),
        textStroke: document.getElementById('textStroke').checked,
        strokeWidth: parseInt(document.getElementById('strokeWidth').value),
        strokeColor: document.getElementById('strokeColor').value
    };
}

/**
 * プレビューを更新
 */
function updatePreview() {
    const settings = getCurrentSettings();
    const preview = document.getElementById('clockPreview');
    const now = new Date();
    
    preview.innerHTML = generateClockHTML(now, settings);
    applyClockStyles(preview, settings);
}

/**
 * 時計のHTML構造を生成
 */
function generateClockHTML(date, settings) {
    const parts = [];
    
    if (settings.showYear) {
        parts.push(`<span class="year-element">${date.getFullYear()}年</span>`);
    }
    if (settings.showDate) {
        parts.push(`<span class="date-element">${formatDate(date, settings.dateFormat)}</span>`);
    }
    if (settings.showDay) {
        parts.push(`<span class="day-element">${formatDay(date, settings.dayFormat)}</span>`);
    }
    parts.push(`<span class="time-element">${formatTime(date, settings.timeFormat)}</span>`);
    
    if (settings.layout === 'vertical') {
        const dateParts = [];
        if (settings.showYear) dateParts.push(parts.shift());
        if (settings.showDate) dateParts.push(parts.shift());
        if (settings.showDay) dateParts.push(parts.shift());
        const timePart = parts.join(' ');
        
        return `<div class="date-section">${dateParts.join(' ')}</div><div class="time-section">${timePart}</div>`;
    } else {
        return parts.join(' ');
    }
}

/**
 * 日付をフォーマット
 */
function formatDate(date, format) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    switch (format) {
        case 'japanese': return `${month}月${day}日`;
        case 'slash': return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
        case 'dot': return `${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
        default: return `${month}月${day}日`;
    }
}

/**
 * 曜日をフォーマット
 */
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

/**
 * 時間をフォーマット
 */
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

/**
 * 時計にスタイルを適用
 */
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
        // webkitTextStrokeも併用すると綺麗になる場合がある
        element.style.webkitTextStroke = `${strokeWidth}px ${strokeColor}`;
        element.style.webkitTextFillColor = fontColor;
    } else {
        element.style.textShadow = 'none';
        element.style.webkitTextStroke = 'none';
        element.style.webkitTextFillColor = 'inherit';
    }
}

/**
 * プレビュー更新タイマーを開始
 */
function startPreviewTimer() {
    if (previewInterval) clearInterval(previewInterval);
    previewInterval = setInterval(updatePreview, 1000);
}

/**
 * URLを生成
 */
function generateUrl() {
    const settings = getCurrentSettings();
    const path = window.location.pathname.replace('index.html', '').replace(/\/$/, '');
    const baseUrl = `${window.location.origin}${path}/clock.html`;
    const params = new URLSearchParams(settings);
    
    document.getElementById('generatedUrl').value = `${baseUrl}?${params.toString()}`;
}

/**
 * URLをクリップボードにコピー
 */
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