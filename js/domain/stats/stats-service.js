// ========================================
// Stats Service
// 統計計算のビジネスロジック（UI操作なし）
// ========================================
import { CONFIG, UI_CONFIG } from '../../shared/constants.js';
import { getTimeSlotIndex } from '../../shared/utils.js';
import { stateManager } from '../../core/state-manager.js';

// ========================================
// 連続日数計算
// ========================================

/**
 * 連続読書日数（ストリーク）を計算
 * @returns {number}
 */
export function calculateStreak() {
  const state = stateManager.getState();
  if (!state.history.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const readingDays = new Set(state.history.map(h => new Date(h.d).toDateString()));
  let streak = 0;
  const checkDate = new Date(today);

  // 今日読んでいない場合は昨日から数え始める
  if (!readingDays.has(today.toDateString())) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (readingDays.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

// ========================================
// 予測計算
// ========================================

/**
 * 年間読書冊数を予測
 * @param {Book[]} books - 本の配列
 * @param {Array} history - 履歴配列
 * @returns {string} "XX冊" 形式
 */
export function calculateYearlyPrediction(books, history) {
  if (!books.length || !history.length) return '--冊';

  const now = new Date();
  const firstSession = new Date(history[0].d);
  const daysSinceStart = Math.max(1, Math.ceil((now - firstSession) / CONFIG.msPerDay));
  const booksPerDay = books.length / daysSinceStart;

  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const daysLeft = Math.ceil((endOfYear - now) / CONFIG.msPerDay);

  return (books.length + Math.round(booksPerDay * daysLeft)) + '冊';
}

// ========================================
// 統計データ取得
// ========================================

/**
 * 基本統計を取得
 * @returns {Object}
 */
export function getBasicStats() {
  const state = stateManager.getState();
  const startDate = state.stats.firstSessionDate || (state.history.length ? state.history[0].d : null);
  const days = startDate
    ? Math.max(1, Math.ceil((Date.now() - new Date(startDate)) / CONFIG.msPerDay))
    : 1;

  return {
    totalHours: Math.floor(state.stats.total / 60),
    totalMinutes: state.stats.total,
    totalSessions: state.stats.sessions,
    todayMinutes: state.stats.today,
    daysSinceStart: days,
    streak: calculateStreak()
  };
}

/**
 * 週間チャートデータを取得
 * @returns {Array<{ label: string, minutes: number, isToday: boolean }>}
 */
export function getWeekChartData() {
  const state = stateManager.getState();
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const now = new Date();
  const data = [];

  // 日付ごとの合計時間をマップ化（O(n) で history を 1 回だけ走査）
  const minutesByDate = {};
  for (const h of state.history) {
    const dateStr = h.d.split('T')[0];
    minutesByDate[dateStr] = (minutesByDate[dateStr] || 0) + h.m;
  }

  let max = 30;
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const minutes = minutesByDate[dateStr] || 0;
    max = Math.max(max, minutes);
    data.push({
      label: dayNames[date.getDay()],
      minutes,
      isToday: i === 0
    });
  }

  // バーの高さを計算
  return data.map(d => ({
    ...d,
    barHeight: d.minutes
      ? Math.max(UI_CONFIG.chartBarMinHeight, Math.round(d.minutes / max * UI_CONFIG.chartBarMaxHeight))
      : 4
  }));
}

/**
 * 読書インサイトを取得
 * @returns {Object}
 */
export function getReadingInsights() {
  const state = stateManager.getState();
  const history = state.history;

  // 年間予測
  const yearlyPrediction = calculateYearlyPrediction(state.books, history);

  // 平均集中時間
  const avgFocus = history.length
    ? Math.round(history.reduce((sum, h) => sum + h.m, 0) / history.length)
    : null;

  // 読書タイプ（時間帯別）
  let readingType = null;
  let readingTypeIcon = null;
  if (history.length >= 3) {
    const counts = [0, 0, 0, 0]; // 朝, 昼, 夜, 深夜
    for (const { h } of history) {
      counts[getTimeSlotIndex(h)]++;
    }
    const maxIndex = counts.indexOf(Math.max(...counts));
    const types = [
      { name: '朝型', icon: '🌅' },
      { name: '昼型', icon: '☀️' },
      { name: '夜型', icon: '🌙' },
      { name: '深夜型', icon: '🌃' }
    ];
    readingType = types[maxIndex].name;
    readingTypeIcon = types[maxIndex].icon;
  }

  // 追加のTips
  const tips = [];
  if (state.books.length > 0 && state.stats.total > 0) {
    tips.push(`平均1冊あたり${Math.round(state.stats.total / state.books.length)}分`);
  }
  if (state.stats.total >= 60) {
    tips.push(`合計${Math.floor(state.stats.total / 60)}時間読書`);
  }
  if (state.stats.total >= 120) {
    tips.push(`映画${Math.floor(state.stats.total / 120)}本分の時間`);
  }

  return {
    yearlyPrediction,
    avgFocus,
    readingType,
    readingTypeIcon,
    tips,
    defaultTip: '読書を始めて記録を作ろう'
  };
}
