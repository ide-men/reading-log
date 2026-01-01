// ========================================
// 統計ビュー
// ========================================
import { randomItem } from '../../shared/utils.js';
import * as statsService from '../../domain/stats/stats-service.js';

// ========================================
// 統計のレンダリング
// ========================================
export function renderStats() {
  const basicStats = statsService.getBasicStats();

  document.getElementById('totalHours').textContent = basicStats.totalHours;
  document.getElementById('totalSessions').textContent = basicStats.totalSessions;
  document.getElementById('daysSince').textContent = basicStats.daysSinceStart;

  renderWeekChart();
  renderReadingInsights();
}

// ========================================
// 週間チャートのレンダリング
// ========================================
function renderWeekChart() {
  const data = statsService.getWeekChartData();

  document.getElementById('weekChart').innerHTML = data.map(d => `
    <div class="week-bar${d.isToday ? ' today' : ''}">
      <div class="week-bar-fill${d.minutes ? '' : ' empty'}" style="height:${d.barHeight}px"></div>
      <span>${d.label}</span>
    </div>
  `).join('');
}

// ========================================
// 読書インサイトのレンダリング
// ========================================
function renderReadingInsights() {
  const insights = statsService.getReadingInsights();

  document.getElementById('yearlyPrediction').textContent = insights.yearlyPrediction;

  document.getElementById('avgFocus').textContent = insights.avgFocus
    ? insights.avgFocus + '分'
    : '--';

  if (insights.readingType) {
    document.getElementById('timeType').textContent = insights.readingType;
    document.getElementById('timeIcon').textContent = insights.readingTypeIcon;
  }

  document.getElementById('tipText').textContent = insights.tips.length
    ? randomItem(insights.tips)
    : insights.defaultTip;
}
