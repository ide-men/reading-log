// ========================================
// Stats Service
// 統計計算のビジネスロジック（UI操作なし）
// ========================================
import { CONFIG, UI_CONFIG } from '../../shared/constants.js';
import { getTimeSlotIndex, toLocalDateString } from '../../shared/utils.js';
import { stateManager } from '../../core/state-manager.js';

// ========================================
// 純粋関数版（テスト用・状態を引数で受け取る）
// ========================================

/**
 * 連続読書日数（ストリーク）を計算（純粋関数版）
 * @param {Array} history - 読書履歴
 * @param {Date} [today] - 基準日（テスト用）
 * @returns {number}
 */
export function calculateStreakPure(history, today = new Date()) {
  if (!history.length) return 0;

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const readingDays = new Set(history.map(h => new Date(h.d).toDateString()));
  let streak = 0;
  const checkDate = new Date(todayStart);

  // 今日読んでいない場合は昨日から数え始める
  if (!readingDays.has(todayStart.toDateString())) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (readingDays.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

/**
 * 年間読書冊数を予測（純粋関数版）
 * @param {Book[]} books - 本の配列
 * @param {Array} history - 履歴配列
 * @param {Date} [now] - 基準日（テスト用）
 * @returns {string} "XX冊" 形式
 */
export function calculateYearlyPredictionPure(books, history, now = new Date()) {
  if (!books.length || !history.length) return '--冊';

  const firstSession = new Date(history[0].d);
  const daysSinceStart = Math.max(1, Math.ceil((now - firstSession) / CONFIG.msPerDay));
  const booksPerDay = books.length / daysSinceStart;

  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const daysLeft = Math.ceil((endOfYear - now) / CONFIG.msPerDay);

  return (books.length + Math.round(booksPerDay * daysLeft)) + '冊';
}

/**
 * 基本統計を取得（純粋関数版）
 * @param {Object} state - アプリケーション状態
 * @param {Date} [now] - 基準日（テスト用）
 * @returns {Object}
 */
export function getBasicStatsPure(state, now = new Date()) {
  const startDate = state.stats.firstSessionDate || (state.history.length ? state.history[0].d : null);
  const days = startDate
    ? Math.max(1, Math.ceil((now.getTime() - new Date(startDate).getTime()) / CONFIG.msPerDay))
    : 1;

  return {
    totalHours: Math.floor(state.stats.total / 60),
    totalMinutes: state.stats.total,
    totalSessions: state.stats.sessions,
    todayMinutes: state.stats.today,
    daysSinceStart: days,
    streak: calculateStreakPure(state.history, now)
  };
}

/**
 * 週間チャートデータを取得（純粋関数版）
 * @param {Array} history - 読書履歴
 * @param {Date} [now] - 基準日（テスト用）
 * @returns {Array<{ label: string, minutes: number, isToday: boolean, barHeight: number }>}
 */
export function getWeekChartDataPure(history, now = new Date()) {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const data = [];

  // 日付ごとの合計時間をマップ化（O(n) で history を 1 回だけ走査）
  const minutesByDate = {};
  for (const h of history) {
    const dateStr = h.d.split('T')[0];
    minutesByDate[dateStr] = (minutesByDate[dateStr] || 0) + h.m;
  }

  let max = 30;
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = toLocalDateString(date);
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
 * 月間カレンダーデータを取得（純粋関数版）
 * @param {Array} history - 読書履歴
 * @param {Date} [now] - 基準日（テスト用）
 * @returns {Object} { days: Array, maxMinutes: number }
 */
export function getMonthCalendarDataPure(history, now = new Date()) {
  // 日付ごとの合計時間をマップ化
  const minutesByDate = {};
  for (const h of history) {
    const dateStr = h.d.split('T')[0];
    minutesByDate[dateStr] = (minutesByDate[dateStr] || 0) + h.m;
  }

  // 過去1ヶ月のデータを生成
  const days = [];
  let maxMinutes = 30; // 最小スケール
  const todayStr = toLocalDateString(now);

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = toLocalDateString(date);
    const minutes = minutesByDate[dateStr] || 0;
    maxMinutes = Math.max(maxMinutes, minutes);

    days.push({
      date: dateStr,
      dayOfMonth: date.getDate(),
      dayOfWeek: date.getDay(),
      minutes,
      isToday: dateStr === todayStr
    });
  }

  // レベル計算（0-4の5段階）
  return {
    days: days.map(d => ({
      ...d,
      level: d.minutes === 0 ? 0 : Math.min(4, Math.ceil(d.minutes / maxMinutes * 4))
    })),
    maxMinutes
  };
}

/**
 * 3ヶ月分のカレンダーデータを取得（純粋関数版）
 * 本物のカレンダー形式（週ごとの行、曜日ヘッダー付き）
 * @param {Array} history - 読書履歴
 * @param {Date} [now] - 基準日（テスト用）
 * @returns {Object} { months: Array, maxMinutes: number }
 */
export function getThreeMonthCalendarDataPure(history, now = new Date()) {
  // 日付ごとの合計時間をマップ化
  const minutesByDate = {};
  for (const h of history) {
    const dateStr = h.d.split('T')[0];
    minutesByDate[dateStr] = (minutesByDate[dateStr] || 0) + h.m;
  }

  // 今日の日付文字列（ローカルタイムゾーン）
  const todayStr = toLocalDateString(now);

  // 3ヶ月分のデータを生成（今月、先月、先々月）
  const months = [];
  let maxMinutes = 30; // 最小スケール

  for (let monthOffset = -2; monthOffset <= 0; monthOffset++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    // 月の最初の日と最後の日
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 月初の曜日（0=日曜日）

    // 週ごとにデータを整理
    const weeks = [];
    let currentWeek = [];

    // 月初までの空白セル
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ isEmpty: true });
    }

    // 各日のデータ
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = toLocalDateString(date);
      const minutes = minutesByDate[dateStr] || 0;
      maxMinutes = Math.max(maxMinutes, minutes);

      currentWeek.push({
        date: dateStr,
        dayOfMonth: day,
        dayOfWeek: date.getDay(),
        minutes,
        isToday: dateStr === todayStr,
        isEmpty: false
      });

      // 土曜日で週を区切る
      if (date.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // 最後の週に残りがあれば追加（月末までの空白も追加）
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ isEmpty: true });
      }
      weeks.push(currentWeek);
    }

    months.push({
      year,
      month: month + 1, // 1-indexed
      monthName: `${month + 1}月`,
      weeks
    });
  }

  // レベル計算（0-4の5段階）
  for (const monthData of months) {
    for (const week of monthData.weeks) {
      for (const day of week) {
        if (!day.isEmpty) {
          day.level = day.minutes === 0 ? 0 : Math.min(4, Math.ceil(day.minutes / maxMinutes * 4));
        }
      }
    }
  }

  return { months, maxMinutes };
}

/**
 * 読書リズムヒートマップデータを取得（純粋関数版）
 * @param {Array} history - 読書履歴
 * @returns {Object} { grid: number[][], insight: string, rawGrid: number[][] }
 */
export function getReadingRhythmDataPure(history) {
  // 時間帯×曜日のグリッド（4時間帯 × 7曜日）
  // 時間帯: 朝(5-11), 昼(11-17), 夜(17-23), 深夜(23-5)
  const grid = Array.from({ length: 4 }, () => Array(7).fill(0));

  for (const { h, d } of history) {
    const dayOfWeek = new Date(d).getDay();
    const slotIndex = getTimeSlotIndex(h);
    grid[slotIndex][dayOfWeek]++;
  }

  // 最大値を求める
  let maxCount = 1;
  for (const row of grid) {
    for (const count of row) {
      maxCount = Math.max(maxCount, count);
    }
  }

  // レベル（0-4）に変換
  const levelGrid = grid.map(row =>
    row.map(count => count === 0 ? 0 : Math.min(4, Math.ceil(count / maxCount * 4)))
  );

  // インサイト生成
  let insight = '';
  if (history.length >= 5) {
    const weekdayCounts = [0, 0]; // [平日, 休日]
    const slotCounts = [0, 0, 0, 0]; // [朝, 昼, 夜, 深夜]

    for (let slot = 0; slot < 4; slot++) {
      for (let day = 0; day < 7; day++) {
        const count = grid[slot][day];
        weekdayCounts[day === 0 || day === 6 ? 1 : 0] += count;
        slotCounts[slot] += count;
      }
    }

    const weekdayType = weekdayCounts[0] > weekdayCounts[1] * 1.5 ? '平日' :
                        weekdayCounts[1] > weekdayCounts[0] * 1.5 ? '休日' : '';
    const slotNames = ['朝', '昼', '夜', '深夜'];
    const maxSlotIndex = slotCounts.indexOf(Math.max(...slotCounts));
    const slotType = slotNames[maxSlotIndex];

    if (weekdayType) {
      insight = `${weekdayType}の${slotType}によく読書していますね`;
    } else {
      insight = `${slotType}の時間帯がお気に入りのようです`;
    }
  }

  return { grid: levelGrid, insight, rawGrid: grid };
}

/**
 * 読書インサイトを取得（純粋関数版）
 * @param {Object} state - アプリケーション状態
 * @returns {Object}
 */
export function getReadingInsightsPure(state) {
  const history = state.history;

  // 年間予測
  const yearlyPrediction = calculateYearlyPredictionPure(state.books, history);

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

// ========================================
// 連続日数計算（後方互換）
// ========================================

/**
 * 連続読書日数（ストリーク）を計算
 * @returns {number}
 */
export function calculateStreak() {
  const state = stateManager.getState();
  return calculateStreakPure(state.history);
}

// ========================================
// 予測計算（後方互換）
// ========================================

/**
 * 年間読書冊数を予測
 * @param {Book[]} books - 本の配列
 * @param {Array} history - 履歴配列
 * @returns {string} "XX冊" 形式
 */
export function calculateYearlyPrediction(books, history) {
  return calculateYearlyPredictionPure(books, history);
}

// ========================================
// 統計データ取得（後方互換）
// ========================================

/**
 * 基本統計を取得
 * @returns {Object}
 */
export function getBasicStats() {
  const state = stateManager.getState();
  return getBasicStatsPure(state);
}

/**
 * 週間チャートデータを取得
 * @returns {Array<{ label: string, minutes: number, isToday: boolean }>}
 */
export function getWeekChartData() {
  const state = stateManager.getState();
  return getWeekChartDataPure(state.history);
}

/**
 * 月間カレンダーデータを取得（草カレンダー用）
 * @returns {Object} { days: Array, maxMinutes: number }
 */
export function getMonthCalendarData() {
  const state = stateManager.getState();
  return getMonthCalendarDataPure(state.history);
}

/**
 * 3ヶ月分のカレンダーデータを取得
 * @returns {Object} { months: Array, maxMinutes: number }
 */
export function getThreeMonthCalendarData() {
  const state = stateManager.getState();
  return getThreeMonthCalendarDataPure(state.history);
}

/**
 * 読書リズムヒートマップデータを取得
 * @returns {Object} { grid: number[][], insight: string }
 */
export function getReadingRhythmData() {
  const state = stateManager.getState();
  return getReadingRhythmDataPure(state.history);
}

/**
 * 読書インサイトを取得
 * @returns {Object}
 */
export function getReadingInsights() {
  const state = stateManager.getState();
  return getReadingInsightsPure(state);
}
