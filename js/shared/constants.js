// ========================================
// 定数・設定
// ========================================

export const SCHEMA_VERSION = 1;

// 本のステータス
export const BOOK_STATUS = {
  READING: 'reading',      // 今読んでいる（カバン）
  COMPLETED: 'completed',  // 読み終わった（書斎）
  UNREAD: 'unread',        // 積読（書斎）
  DROPPED: 'dropped',      // 中断（書斎）
  WISHLIST: 'wishlist'     // 気になる（本屋）
};

// ステータスのラベル・アイコン
export const STATUS_CONFIG = {
  [BOOK_STATUS.READING]: { label: '読書中', icon: '📖', color: '#e8a87c' },
  [BOOK_STATUS.COMPLETED]: { label: '読了', icon: '✅', color: '#10b981' },
  [BOOK_STATUS.UNREAD]: { label: '積読', icon: '📚', color: '#6366f1' },
  [BOOK_STATUS.DROPPED]: { label: '中断', icon: '⏸️', color: '#6b7280' },
  [BOOK_STATUS.WISHLIST]: { label: '気になる', icon: '💭', color: '#f59e0b' }
};

export const STORAGE_KEYS = {
  meta: 'rl_v1_meta',
  stats: 'rl_v1_stats',
  books: 'rl_v1_books',
  history: 'rl_v1_history',
  archived: 'rl_v1_archived'
};

export const CONFIG = {
  minSessionMinutes: 10,
  msPerDay: 86400000,
  historyRetentionDays: 90,
  archiveRetentionDays: 365,
  storageWarningPercent: 80
};

// UI設定
export const UI_CONFIG = {
  // カルーセル
  carouselScrollThreshold: 5,
  carouselDotsMinBooks: 4,
  // ダブルクリック防止
  debounceInterval: 300,
  // グラフ
  chartBarMinHeight: 8,
  chartBarMaxHeight: 60
};

// アニメーション設定
export const ANIMATION_CONFIG = {
  streakThreshold: 3,
  streakProbability: 0.3
};

// セレブレーション設定
export const CELEBRATION_CONFIG = {
  particleCount: 50,
  sparkleCount: 20,
  displayDuration: 2000,
  statusUpdateDelay: 300
};

export const BOOK_COLORS = [
  '#c62828', '#1565c0', '#2e7d32', '#6a1b9a', '#e65100',
  '#00695c', '#37474f', '#8d6e63', '#d84315', '#0277bd'
];

export const BUTTON_ANIMATIONS = {
  morning: [
    { icon: '📖', anim: 'page-flip', label: '本をめくって朝のスタート' },
    { icon: '✨', anim: 'sparkle', label: '新しい1日を輝かせよう' },
    { icon: '🌅', anim: 'float', label: '朝日と共に読書を' }
  ],
  afternoon: [
    { icon: '📖', anim: 'bounce', label: '午後の読書タイム' },
    { icon: '☀️', anim: 'wave', label: '昼下がりの一冊' },
    { icon: '📚', anim: 'page-flip', label: '本の世界へ飛び込もう' }
  ],
  evening: [
    { icon: '🌙', anim: 'relax', label: 'リラックスして読書を' },
    { icon: '📖', anim: 'float', label: 'ゆったり読書タイム' },
    { icon: '✨', anim: 'sparkle', label: '夜のひとときを本と共に' }
  ],
  night: [
    { icon: '🌃', anim: 'relax', label: '静かな夜の読書' },
    { icon: '📖', anim: 'float', label: 'ゆっくりと本の世界へ' },
    { icon: '🌙', anim: 'relax', label: '穏やかな読書タイム' }
  ],
  streak: [
    { icon: '🔥', anim: 'flame', label: '連続記録を伸ばそう！' },
    { icon: '⚡', anim: 'sparkle', label: '勢いに乗って読書！' }
  ]
};

export const READING_ANIMATIONS = [
  { icon: '📖', anim: 'page-turn', label: 'ページをめくっています' },
  { icon: '📖', anim: 'page-rustle', label: '静かに読書中' },
  { icon: '📖', anim: 'gentle-read', label: '本の世界に浸っています' }
];
