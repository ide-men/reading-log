// ========================================
// 統計計算・表示
// ========================================
import { CONFIG } from './constants.js';
import { stateManager } from './state.js';
import { randomItem } from './utils.js';

// ========================================
// 統計計算
// ========================================
export function calculateStreak() {
  const state = stateManager.getState();
  if (!state.history.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const readingDays = new Set(state.history.map(h => new Date(h.d).toDateString()));
  let streak = 0;
  const checkDate = new Date(today);

  if (!readingDays.has(today.toDateString())) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (readingDays.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

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
// 統計レンダリング
// ========================================
export function renderStats() {
  const state = stateManager.getState();

  document.getElementById('totalHours').textContent = Math.floor(state.stats.total / 60);
  document.getElementById('totalSessions').textContent = state.stats.sessions;

  const startDate = state.stats.firstSessionDate || (state.history.length ? state.history[0].d : null);
  const days = startDate
    ? Math.max(1, Math.ceil((Date.now() - new Date(startDate)) / CONFIG.msPerDay))
    : 1;
  document.getElementById('daysSince').textContent = days;

  renderWeekChart();
  renderReadingInsights();
}

function renderWeekChart() {
  const state = stateManager.getState();
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const now = new Date();
  const data = [];
  let max = 30;

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const minutes = state.history
      .filter(h => h.d.startsWith(dateStr))
      .reduce((sum, h) => sum + h.m, 0);
    max = Math.max(max, minutes);
    data.push({
      label: dayNames[date.getDay()],
      minutes,
      isToday: i === 0
    });
  }

  document.getElementById('weekChart').innerHTML = data.map(d => {
    const height = d.minutes ? Math.max(8, Math.round(d.minutes / max * 60)) : 4;
    return `
      <div class="week-bar${d.isToday ? ' today' : ''}">
        <div class="week-bar-fill${d.minutes ? '' : ' empty'}" style="height:${height}px"></div>
        <span>${d.label}</span>
      </div>
    `;
  }).join('');
}

function renderReadingInsights() {
  const state = stateManager.getState();

  document.getElementById('yearlyPrediction').textContent =
    calculateYearlyPrediction(state.books, state.history);

  const history = state.history;
  document.getElementById('avgFocus').textContent = history.length
    ? Math.round(history.reduce((sum, h) => sum + h.m, 0) / history.length) + '分'
    : '--';

  if (history.length >= 3) {
    const hours = history.map(h => h.h);
    const counts = [
      hours.filter(h => h >= 5 && h < 12).length,
      hours.filter(h => h >= 12 && h < 18).length,
      hours.filter(h => h >= 18 && h < 22).length,
      hours.filter(h => h >= 22 || h < 5).length
    ];
    const maxIndex = counts.indexOf(Math.max(...counts));
    const types = [['朝型', '🌅'], ['昼型', '☀️'], ['夜型', '🌙'], ['深夜型', '🌃']];
    document.getElementById('timeType').textContent = types[maxIndex][0];
    document.getElementById('timeIcon').textContent = types[maxIndex][1];
  }

  const tips = [];
  if (state.books.length > 0 && state.stats.total > 0) {
    tips.push(`平均1冊あたり${Math.round(state.stats.total / state.books.length)}分`);
  }
  if (state.stats.total >= 60) tips.push(`合計${Math.floor(state.stats.total / 60)}時間読書`);
  if (state.stats.total >= 120) tips.push(`映画${Math.floor(state.stats.total / 120)}本分の時間`);

  document.getElementById('tipText').textContent = tips.length
    ? randomItem(tips)
    : '読書を始めて記録を作ろう';
}
