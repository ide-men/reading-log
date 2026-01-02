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
// 読書カレンダーのレンダリング（1ヶ月表示・スワイプ切り替え）
// ========================================
let currentCalendarMonthIndex = 2; // 今月（最後の月）から開始

function renderCalendar() {
  const { months } = statsService.getThreeMonthCalendarData();
  const container = document.getElementById('calendarGrid');
  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  let html = '';

  for (let i = 0; i < months.length; i++) {
    const monthData = months[i];
    html += `
      <div class="calendar-month" data-month-index="${i}">
        <div class="calendar-month-header">${monthData.year}年${monthData.monthName}</div>
        <div class="calendar-weekdays">
          ${dayLabels.map((label, j) => `<span class="calendar-weekday${j === 0 ? ' sunday' : j === 6 ? ' saturday' : ''}">${label}</span>`).join('')}
        </div>
        <div class="calendar-weeks">
          ${monthData.weeks.map(week => `
            <div class="calendar-week">
              ${week.map(day => {
                if (day.isEmpty) {
                  return '<span class="calendar-cell empty"></span>';
                }
                const isSunday = day.dayOfWeek === 0;
                const isSaturday = day.dayOfWeek === 6;
                return `
                  <span class="calendar-cell level-${day.level}${day.isToday ? ' today' : ''}${isSunday ? ' sunday' : ''}${isSaturday ? ' saturday' : ''}"
                        data-date="${day.date}"
                        data-minutes="${day.minutes}"
                        title="${day.dayOfMonth}日: ${day.minutes}分">
                    <span class="calendar-day">${day.dayOfMonth}</span>
                  </span>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // ドットインジケーターを追加
  const scroll = document.getElementById('calendarScroll');
  let dotsContainer = document.getElementById('calendarDots');
  if (!dotsContainer) {
    dotsContainer = document.createElement('div');
    dotsContainer.id = 'calendarDots';
    dotsContainer.className = 'calendar-dots';
    scroll.parentNode.appendChild(dotsContainer);
  }
  dotsContainer.innerHTML = months.map((_, i) =>
    `<span class="calendar-dot${i === currentCalendarMonthIndex ? ' active' : ''}" data-index="${i}"></span>`
  ).join('');

  // 今月（最後の月）が見えるようにスクロール
  requestAnimationFrame(() => {
    const monthWidth = scroll.scrollWidth / months.length;
    scroll.scrollLeft = currentCalendarMonthIndex * monthWidth;
  });

  // スクロールイベントでドット更新
  scroll.addEventListener('scroll', handleCalendarScroll, { passive: true });

  // ドットクリックでジャンプ
  dotsContainer.addEventListener('click', (e) => {
    const dot = e.target.closest('.calendar-dot');
    if (dot) {
      const index = parseInt(dot.dataset.index, 10);
      const monthWidth = scroll.scrollWidth / months.length;
      scroll.scrollTo({ left: index * monthWidth, behavior: 'smooth' });
    }
  });
}

function handleCalendarScroll() {
  const scroll = document.getElementById('calendarScroll');
  const dotsContainer = document.getElementById('calendarDots');
  if (!scroll || !dotsContainer) return;

  const monthElements = scroll.querySelectorAll('.calendar-month');
  if (monthElements.length === 0) return;

  const monthWidth = scroll.scrollWidth / monthElements.length;
  const newIndex = Math.round(scroll.scrollLeft / monthWidth);

  if (newIndex !== currentCalendarMonthIndex && newIndex >= 0 && newIndex < monthElements.length) {
    currentCalendarMonthIndex = newIndex;
    dotsContainer.querySelectorAll('.calendar-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === newIndex);
    });
  }
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
