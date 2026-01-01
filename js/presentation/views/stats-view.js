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
  renderCalendar();
  renderRhythmHeatmap();
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
// 読書カレンダーのレンダリング（草カレンダー）
// ========================================
function renderCalendar() {
  const { days } = statsService.getMonthCalendarData();
  const container = document.getElementById('calendarGrid');

  container.innerHTML = days.map(d => `
    <div class="calendar-cell level-${d.level}${d.isToday ? ' today' : ''}"
         data-date="${d.date}"
         data-minutes="${d.minutes}"
         title="${d.dayOfMonth}日: ${d.minutes}分">
      <span class="calendar-day">${d.dayOfMonth}</span>
    </div>
  `).join('');

  // 右端（今日）にスクロール
  const scroll = document.getElementById('calendarScroll');
  scroll.scrollLeft = scroll.scrollWidth;
}

// ========================================
// 読書リズムヒートマップのレンダリング
// ========================================
function renderRhythmHeatmap() {
  const { grid, insight } = statsService.getReadingRhythmData();
  const container = document.getElementById('rhythmGrid');
  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
  const slotLabels = ['朝', '昼', '夜', '深夜'];

  let html = `
    <div class="rhythm-row rhythm-header">
      <span class="rhythm-label"></span>
      ${dayLabels.map(d => `<span class="rhythm-day">${d}</span>`).join('')}
    </div>
  `;

  for (let slot = 0; slot < 4; slot++) {
    html += `
      <div class="rhythm-row">
        <span class="rhythm-label">${slotLabels[slot]}</span>
        ${grid[slot].map(level => `<span class="rhythm-cell level-${level}"></span>`).join('')}
      </div>
    `;
  }

  container.innerHTML = html;

  const insightEl = document.getElementById('rhythmInsight');
  insightEl.textContent = insight || '';
  insightEl.style.display = insight ? 'block' : 'none';
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
