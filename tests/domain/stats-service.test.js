import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateStreak,
  calculateYearlyPrediction,
  getBasicStats,
  getWeekChartData,
  getMonthCalendarData,
  getThreeMonthCalendarData,
  getReadingRhythmData,
  getReadingInsights,
  // 純粋関数版（モック不要）
  calculateStreakPure,
  getBasicStatsPure,
  getWeekChartDataPure,
  getThreeMonthCalendarDataPure,
  getReadingRhythmDataPure,
  getReadingInsightsPure,
} from '../../js/domain/stats/stats-service.js';
import { stateManager } from '../../js/core/state-manager.js';
import {
  setupFakeTimers,
  teardownFakeTimers,
  createHistoryEntry,
  createConsecutiveHistory,
  createTestBook,
  DEFAULT_TEST_DATE
} from '../helpers/index.js';

vi.mock('../../js/core/state-manager.js', () => ({
  stateManager: {
    getState: vi.fn(),
  },
}));

describe('calculateStreak', () => {
  beforeEach(() => setupFakeTimers());
  afterEach(() => teardownFakeTimers());

  it('履歴がない場合は0', () => {
    stateManager.getState.mockReturnValue({ history: [] });
    expect(calculateStreak()).toBe(0);
  });

  it('今日だけ読んだ場合は1', () => {
    stateManager.getState.mockReturnValue({
      history: [createHistoryEntry()],
    });
    expect(calculateStreak()).toBe(1);
  });

  it('連続3日読んだ場合は3', () => {
    stateManager.getState.mockReturnValue({
      history: createConsecutiveHistory(3),
    });
    expect(calculateStreak()).toBe(3);
  });

  it('今日読んでいない場合は昨日からカウント', () => {
    stateManager.getState.mockReturnValue({
      history: [
        createHistoryEntry({ date: '2024-06-13T10:00:00' }),
        createHistoryEntry({ date: '2024-06-14T10:00:00' }),
      ],
    });
    expect(calculateStreak()).toBe(2);
  });

  it('途切れた場合はリセット', () => {
    stateManager.getState.mockReturnValue({
      history: [
        createHistoryEntry({ date: '2024-06-10T10:00:00' }),
        createHistoryEntry({ date: '2024-06-14T10:00:00' }),
        createHistoryEntry({ date: '2024-06-15T10:00:00' }),
      ],
    });
    expect(calculateStreak()).toBe(2);
  });
});

describe('calculateYearlyPrediction', () => {
  beforeEach(() => setupFakeTimers());
  afterEach(() => teardownFakeTimers());

  it('データがない場合は--冊', () => {
    expect(calculateYearlyPrediction([], [])).toBe('--冊');
    expect(calculateYearlyPrediction([{ id: 1 }], [])).toBe('--冊');
  });

  it('14日未満の場合はデータ収集中', () => {
    const books = [createTestBook({ id: 1 }), createTestBook({ id: 2 }), createTestBook({ id: 3 })];
    const history = [createHistoryEntry({ date: '2024-06-10T10:00:00' })]; // 5日前
    const result = calculateYearlyPrediction(books, history);
    expect(result).toBe('データ収集中');
  });

  it('3冊未満の場合はデータ収集中', () => {
    const books = [createTestBook({ id: 1 }), createTestBook({ id: 2 })]; // 2冊
    const history = [createHistoryEntry({ date: '2024-05-01T10:00:00' })]; // 45日前
    const result = calculateYearlyPrediction(books, history);
    expect(result).toBe('データ収集中');
  });

  it('14日以上かつ3冊以上で予測を計算', () => {
    const books = [createTestBook({ id: 1 }), createTestBook({ id: 2 }), createTestBook({ id: 3 })];
    const history = [createHistoryEntry({ date: '2024-06-01T10:00:00' })]; // 14日前
    const result = calculateYearlyPrediction(books, history);
    expect(result).toMatch(/^\d+冊$/);
  });
});

describe('getBasicStats', () => {
  beforeEach(() => setupFakeTimers());
  afterEach(() => teardownFakeTimers());

  it('基本統計を取得', () => {
    stateManager.getState.mockReturnValue({
      stats: {
        total: 120,
        today: 30,
        sessions: 5,
        firstSessionDate: '2024-06-01T10:00:00',
      },
      history: [createHistoryEntry()],
    });

    const stats = getBasicStats();

    expect(stats.totalHours).toBe(2);
    expect(stats.totalMinutes).toBe(120);
    expect(stats.totalSessions).toBe(5);
    expect(stats.todayMinutes).toBe(30);
    expect(stats.daysSinceStart).toBeGreaterThan(0);
    expect(stats.streak).toBe(1);
  });
});

describe('getWeekChartData', () => {
  beforeEach(() => setupFakeTimers());
  afterEach(() => teardownFakeTimers());

  it('7日分のデータを返す', () => {
    stateManager.getState.mockReturnValue({ history: [] });
    const data = getWeekChartData();

    expect(data).toHaveLength(7);
    expect(data[6].isToday).toBe(true);
  });

  it('履歴データを集計', () => {
    stateManager.getState.mockReturnValue({
      history: [
        createHistoryEntry({ date: '2024-06-15T10:00:00', m: 30 }),
        createHistoryEntry({ date: '2024-06-15T14:00:00', m: 20 }),
        createHistoryEntry({ date: '2024-06-14T10:00:00', m: 45 }),
      ],
    });

    const data = getWeekChartData();
    const today = data.find((d) => d.isToday);
    const yesterday = data[5];

    expect(today.minutes).toBe(50);
    expect(yesterday.minutes).toBe(45);
  });
});

describe('getMonthCalendarData', () => {
  beforeEach(() => setupFakeTimers());
  afterEach(() => teardownFakeTimers());

  it('30日分のデータを返す', () => {
    stateManager.getState.mockReturnValue({ history: [] });
    const { days } = getMonthCalendarData();

    expect(days).toHaveLength(30);
    expect(days[29].isToday).toBe(true);
  });

  it('レベルを計算', () => {
    stateManager.getState.mockReturnValue({
      history: [createHistoryEntry({ m: 60 })],
    });

    const { days, maxMinutes } = getMonthCalendarData();
    const today = days.find((d) => d.isToday);

    expect(today.level).toBeGreaterThan(0);
    expect(maxMinutes).toBeGreaterThanOrEqual(30);
  });
});

describe('getThreeMonthCalendarData', () => {
  beforeEach(() => setupFakeTimers());
  afterEach(() => teardownFakeTimers());

  it('3ヶ月分のデータを返す', () => {
    stateManager.getState.mockReturnValue({ history: [] });
    const { months } = getThreeMonthCalendarData();

    expect(months).toHaveLength(3);
    expect(months[0].month).toBe(4);
    expect(months[1].month).toBe(5);
    expect(months[2].month).toBe(6);
  });

  it('各月に週データが含まれる', () => {
    stateManager.getState.mockReturnValue({ history: [] });
    const { months } = getThreeMonthCalendarData();

    for (const month of months) {
      expect(month.weeks.length).toBeGreaterThan(0);
      for (const week of month.weeks) {
        expect(week).toHaveLength(7);
      }
    }
  });

  it('今日のセルにisTodayフラグがある', () => {
    stateManager.getState.mockReturnValue({ history: [] });
    const { months } = getThreeMonthCalendarData();

    const currentMonth = months[2];
    let foundToday = false;
    for (const week of currentMonth.weeks) {
      for (const day of week) {
        if (day.isToday) {
          expect(day.dayOfMonth).toBe(15);
          foundToday = true;
        }
      }
    }
    expect(foundToday).toBe(true);
  });

  it('読書履歴のレベルを正しく計算', () => {
    stateManager.getState.mockReturnValue({
      history: [createHistoryEntry({ m: 60 })],
    });

    const { months, maxMinutes } = getThreeMonthCalendarData();
    expect(maxMinutes).toBeGreaterThanOrEqual(30);

    const currentMonth = months[2];
    let todayLevel = null;
    for (const week of currentMonth.weeks) {
      for (const day of week) {
        if (day.isToday) {
          todayLevel = day.level;
        }
      }
    }
    expect(todayLevel).toBeGreaterThan(0);
  });
});

describe('getReadingRhythmData', () => {
  beforeEach(() => setupFakeTimers());
  afterEach(() => teardownFakeTimers());

  it('4x7のグリッドを返す', () => {
    stateManager.getState.mockReturnValue({ history: [] });
    const { grid } = getReadingRhythmData();

    expect(grid).toHaveLength(4);
    expect(grid[0]).toHaveLength(7);
  });

  it('履歴からグリッドを生成', () => {
    stateManager.getState.mockReturnValue({
      history: [
        createHistoryEntry({ date: '2024-06-15T08:00:00', h: 8 }),
        createHistoryEntry({ date: '2024-06-15T09:00:00', h: 9 }),
      ],
    });

    const { rawGrid } = getReadingRhythmData();
    expect(rawGrid[0][6]).toBe(2);
  });

  it('5回以上の履歴でインサイトを生成', () => {
    stateManager.getState.mockReturnValue({
      history: [
        createHistoryEntry({ date: '2024-06-10T08:00:00', h: 8 }),
        createHistoryEntry({ date: '2024-06-11T08:00:00', h: 8 }),
        createHistoryEntry({ date: '2024-06-12T08:00:00', h: 8 }),
        createHistoryEntry({ date: '2024-06-13T08:00:00', h: 8 }),
        createHistoryEntry({ date: '2024-06-14T08:00:00', h: 8 }),
      ],
    });

    const { insight } = getReadingRhythmData();
    expect(insight.length).toBeGreaterThan(0);
  });
});

describe('getReadingInsights', () => {
  beforeEach(() => setupFakeTimers());
  afterEach(() => teardownFakeTimers());

  it('履歴がない場合のデフォルト値', () => {
    stateManager.getState.mockReturnValue({
      books: [],
      history: [],
      stats: { total: 0 },
    });

    const insights = getReadingInsights();
    expect(insights.yearlyPrediction).toBe('--冊');
    expect(insights.avgFocus).toBeNull();
    expect(insights.readingType).toBeNull();
  });

  it('読書タイプを判定', () => {
    stateManager.getState.mockReturnValue({
      books: [createTestBook()],
      history: [
        createHistoryEntry({ date: '2024-06-13T08:00:00', h: 8 }),
        createHistoryEntry({ date: '2024-06-14T09:00:00', h: 9 }),
        createHistoryEntry({ date: '2024-06-15T07:00:00', h: 7 }),
      ],
      stats: { total: 90 },
    });

    const insights = getReadingInsights();
    expect(insights.readingType).toBe('朝型');
    expect(insights.readingTypeIcon).toBe('🌅');
  });

  it('平均集中時間を計算', () => {
    stateManager.getState.mockReturnValue({
      books: [createTestBook()],
      history: [
        createHistoryEntry({ date: '2024-06-14T10:00:00', h: 10, m: 30 }),
        createHistoryEntry({ date: '2024-06-15T10:00:00', h: 10, m: 60 }),
      ],
      stats: { total: 90 },
    });

    const insights = getReadingInsights();
    expect(insights.avgFocus).toBe(45);
  });
});

// 純粋関数版のテスト（vi.mockやvi.useFakeTimers不要）
describe('純粋関数版（モック不要）', () => {
  const today = new Date(DEFAULT_TEST_DATE);

  describe('calculateStreakPure', () => {
    it('履歴がない場合は0', () => {
      expect(calculateStreakPure([], today)).toBe(0);
    });

    it('今日だけ読んだ場合は1', () => {
      const history = [createHistoryEntry()];
      expect(calculateStreakPure(history, today)).toBe(1);
    });

    it('連続3日読んだ場合は3', () => {
      const history = createConsecutiveHistory(3);
      expect(calculateStreakPure(history, today)).toBe(3);
    });

    it('途切れた場合はリセット', () => {
      const history = [
        createHistoryEntry({ date: '2024-06-10T10:00:00' }),
        createHistoryEntry({ date: '2024-06-14T10:00:00' }),
        createHistoryEntry({ date: '2024-06-15T10:00:00' }),
      ];
      expect(calculateStreakPure(history, today)).toBe(2);
    });
  });

  describe('getBasicStatsPure', () => {
    it('基本統計を計算', () => {
      const state = {
        stats: {
          total: 120,
          today: 30,
          sessions: 5,
          firstSessionDate: '2024-06-01T10:00:00',
        },
        history: [createHistoryEntry()],
      };

      const stats = getBasicStatsPure(state, today);

      expect(stats.totalHours).toBe(2);
      expect(stats.totalMinutes).toBe(120);
      expect(stats.totalSessions).toBe(5);
      expect(stats.todayMinutes).toBe(30);
      expect(stats.streak).toBe(1);
    });
  });

  describe('getWeekChartDataPure', () => {
    it('7日分のデータを返す', () => {
      const data = getWeekChartDataPure([], today);

      expect(data).toHaveLength(7);
      expect(data[6].isToday).toBe(true);
    });

    it('履歴データを集計', () => {
      const history = [
        createHistoryEntry({ date: '2024-06-15T10:00:00', m: 30 }),
        createHistoryEntry({ date: '2024-06-15T14:00:00', m: 20 }),
        createHistoryEntry({ date: '2024-06-14T10:00:00', m: 45 }),
      ];
      const data = getWeekChartDataPure(history, today);

      const todayData = data.find((d) => d.isToday);
      expect(todayData.minutes).toBe(50);
    });
  });

  describe('getReadingRhythmDataPure', () => {
    it('4x7のグリッドを返す', () => {
      const { grid } = getReadingRhythmDataPure([]);

      expect(grid).toHaveLength(4);
      expect(grid[0]).toHaveLength(7);
    });

    it('履歴からグリッドを生成', () => {
      const history = [
        createHistoryEntry({ date: '2024-06-15T08:00:00', h: 8 }),
        createHistoryEntry({ date: '2024-06-15T09:00:00', h: 9 }),
      ];

      const { rawGrid } = getReadingRhythmDataPure(history);
      expect(rawGrid[0][6]).toBe(2);
    });
  });

  describe('getReadingInsightsPure', () => {
    it('履歴がない場合のデフォルト値', () => {
      const state = {
        books: [],
        history: [],
        stats: { total: 0 },
      };

      const insights = getReadingInsightsPure(state);
      expect(insights.yearlyPrediction).toBe('--冊');
      expect(insights.avgFocus).toBeNull();
      expect(insights.readingType).toBeNull();
    });

    it('読書タイプを判定', () => {
      const state = {
        books: [createTestBook()],
        history: [
          createHistoryEntry({ date: '2024-06-13T08:00:00', h: 8 }),
          createHistoryEntry({ date: '2024-06-14T09:00:00', h: 9 }),
          createHistoryEntry({ date: '2024-06-15T07:00:00', h: 7 }),
        ],
        stats: { total: 90 },
      };

      const insights = getReadingInsightsPure(state);
      expect(insights.readingType).toBe('朝型');
      expect(insights.readingTypeIcon).toBe('🌅');
    });
  });

  describe('getThreeMonthCalendarDataPure', () => {
    it('3ヶ月分のデータを返す', () => {
      const { months } = getThreeMonthCalendarDataPure([], today);

      expect(months).toHaveLength(3);
      expect(months[0].month).toBe(4);
      expect(months[1].month).toBe(5);
      expect(months[2].month).toBe(6);
    });

    it('各月に週データが含まれ、すべて7日分', () => {
      const { months } = getThreeMonthCalendarDataPure([], today);

      for (const month of months) {
        expect(month.weeks.length).toBeGreaterThan(0);
        for (const week of month.weeks) {
          expect(week).toHaveLength(7);
        }
      }
    });

    it('月初の空白セルが正しく設定される', () => {
      const { months } = getThreeMonthCalendarDataPure([], today);
      const june = months[2];
      const firstWeek = june.weeks[0];

      for (let i = 0; i < 6; i++) {
        expect(firstWeek[i].isEmpty).toBe(true);
      }
      expect(firstWeek[6].isEmpty).toBe(false);
      expect(firstWeek[6].dayOfMonth).toBe(1);
    });

    it('今日のセルにisTodayフラグがある', () => {
      const { months } = getThreeMonthCalendarDataPure([], today);

      const currentMonth = months[2];
      let foundToday = false;
      for (const week of currentMonth.weeks) {
        for (const day of week) {
          if (day.isToday) {
            expect(day.dayOfMonth).toBe(15);
            foundToday = true;
          }
        }
      }
      expect(foundToday).toBe(true);
    });

    it('読書履歴のレベルを正しく計算', () => {
      const history = [createHistoryEntry({ m: 60 })];
      const { months, maxMinutes } = getThreeMonthCalendarDataPure(history, today);

      expect(maxMinutes).toBeGreaterThanOrEqual(30);

      const currentMonth = months[2];
      let todayLevel = null;
      for (const week of currentMonth.weeks) {
        for (const day of week) {
          if (day.isToday) {
            todayLevel = day.level;
          }
        }
      }
      expect(todayLevel).toBeGreaterThan(0);
    });

    it('年をまたぐ場合も正しく処理', () => {
      const januaryNow = new Date('2024-01-15T12:00:00');
      const { months } = getThreeMonthCalendarDataPure([], januaryNow);

      expect(months[0].year).toBe(2023);
      expect(months[0].month).toBe(11);
      expect(months[1].year).toBe(2023);
      expect(months[1].month).toBe(12);
      expect(months[2].year).toBe(2024);
      expect(months[2].month).toBe(1);
    });
  });
});
