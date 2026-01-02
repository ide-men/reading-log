/**
 * テストヘルパーのエントリポイント
 */

// モックファクトリ
export {
  createLocalStorageMock,
  createEventBusMock,
  createMockState,
  createStateManagerMock,
  createStorageMock,
  createTimerDependenciesMock,
  createBookMapMock,
  MockEvents
} from './mocks.js';

// テストデータファクトリ
export {
  DEFAULT_TEST_DATE,
  DEFAULT_TEST_TIMESTAMP,
  createTestBook,
  createReadingBook,
  createCompletedBook,
  createUnreadBook,
  createWishlistBook,
  createDroppedBook,
  createHistoryEntry,
  createConsecutiveHistory,
  createTestStats,
  createTestMeta,
  createTestState
} from './test-data.js';

// セットアップユーティリティ
export {
  setupFakeTimers,
  teardownFakeTimers,
  clearAllMocks,
  resetModules,
  setupTest,
  suppressConsoleError,
  suppressConsoleLog
} from './setup.js';
