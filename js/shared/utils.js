// ========================================
// ユーティリティ関数
// ========================================

// ========================================
// 配列・ランダム
// ========================================
export const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ========================================
// エスケープ
// ========================================
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function escapeAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ========================================
// 色操作
// ========================================
export function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ========================================
// URL・Amazon関連
// ========================================
export const isValidUrl = (str) => str && /^https?:\/\//i.test(str);
export const isAmazonShortUrl = (url) => url && /^https?:\/\/(amzn\.asia|amzn\.to)\//i.test(url);

export function extractAsinFromUrl(url) {
  if (!url) return null;
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})/i,
    /\/ASIN\/([A-Z0-9]{10})/i,
    /amazon\.[a-z.]+\/.*?\/([A-Z0-9]{10})(?:[/?]|$)/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function getAmazonImageUrl(asin) {
  return asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.09.LZZZZZZZ.jpg` : null;
}

export function getCoverUrlFromLink(link, onShortUrl = null) {
  if (!link) return null;
  const asin = extractAsinFromUrl(link);
  if (asin) {
    return getAmazonImageUrl(asin);
  }
  if (isAmazonShortUrl(link) && onShortUrl) {
    onShortUrl();
  }
  return null;
}

// ========================================
// リンク操作
// ========================================
export function openLink(url, event) {
  if (event) event.preventDefault();
  window.open(url, '_blank');
}

// ========================================
// 時間帯判定
// ========================================
export function getTimeSlot(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// 時間帯のインデックスを返す（統計用: 朝=0, 昼=1, 夜=2, 深夜=3）
export function getTimeSlotIndex(hour) {
  if (hour >= 5 && hour < 12) return 0;  // 朝型
  if (hour >= 12 && hour < 18) return 1; // 昼型
  if (hour >= 18 && hour < 22) return 2; // 夜型
  return 3; // 深夜型
}

// ========================================
// 日付ユーティリティ（ローカルタイムゾーン対応）
// ========================================

/**
 * Dateオブジェクトからローカルタイムゾーンの日付文字列を取得
 * @param {Date} date - 日付
 * @returns {string} YYYY-MM-DD形式の文字列
 */
export function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
