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

export const QUOTES = [
  { text: '読書は心の旅路。一ページが新しい世界への扉となる。', author: '今日の一言' },
  { text: '本を読むことは、他人の頭で考えることである。', author: 'ショーペンハウアー' },
  { text: '良書は最良の友人である。', author: 'プロヴァーブ' },
  { text: '知識への投資は、常に最高の利息がつく。', author: 'ベンジャミン・フランクリン' },
  { text: '本は心の糧。毎日少しずつ味わおう。', author: '今日の一言' }
];

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

// サンプルデータ（各ステータスのパターン）
export const SAMPLE_BOOKS = [
  // reading（カバン）- 今読んでいる本
  { title: '人を動かす', link: 'https://www.amazon.co.jp/dp/442210098X', status: 'reading', startedAt: -5 },
  { title: '嫌われる勇気', link: 'https://www.amazon.co.jp/dp/4478025819', status: 'reading', startedAt: -2 },

  // completed（書斎・読了）- 読み終わった本
  { title: '7つの習慣', link: 'https://www.amazon.co.jp/dp/4863940246', status: 'completed', startedAt: -60, completedAt: -30 },
  { title: '夜と霧', link: 'https://www.amazon.co.jp/dp/4622039702', status: 'completed', startedAt: -45, completedAt: -20 },
  { title: 'FACTFULNESS', link: 'https://www.amazon.co.jp/dp/4822289605', status: 'completed', startedAt: -30, completedAt: -10 },
  { title: '思考の整理学', link: 'https://www.amazon.co.jp/dp/4480020470', status: 'completed', startedAt: -25, completedAt: -7 },
  { title: 'サピエンス全史（上）', link: 'https://www.amazon.co.jp/dp/430922671X', status: 'completed', startedAt: -90, completedAt: -45, note: '人類史の壮大なスケールに圧倒された' },

  // unread（書斎・積読）- 買ったけど読んでない本
  { title: '影響力の武器', link: 'https://www.amazon.co.jp/dp/4414304229', status: 'unread' },
  { title: '金持ち父さん貧乏父さん', link: 'https://www.amazon.co.jp/dp/4480864245', status: 'unread' },
  { title: 'イシューからはじめよ', link: 'https://www.amazon.co.jp/dp/4862760856', status: 'unread' },
  { title: 'エッセンシャル思考', link: 'https://www.amazon.co.jp/dp/4761270438', status: 'unread' },

  // dropped（書斎・中断）- 途中でやめた本
  { title: 'アウトプット大全', link: 'https://www.amazon.co.jp/dp/4801400558', status: 'dropped', startedAt: -40, note: '内容が合わなかった' },
  { title: '1日1ページ、読むだけで身につく世界の教養365', link: 'https://www.amazon.co.jp/dp/4866510552', status: 'dropped', startedAt: -20 },

  // wishlist（本屋）- 気になっている本
  { title: '限りある時間の使い方', link: 'https://www.amazon.co.jp/dp/4761276150', status: 'wishlist' },
  { title: 'チーズはどこへ消えた？', link: 'https://www.amazon.co.jp/dp/459403019X', status: 'wishlist' },
  { title: '君たちはどう生きるか', link: 'https://www.amazon.co.jp/dp/4003315812', status: 'wishlist' },
  { title: 'アトミック・ハビッツ', link: 'https://www.amazon.co.jp/dp/4833423057', status: 'wishlist' },
  { title: '1兆ドルコーチ', link: 'https://www.amazon.co.jp/dp/4478107246', status: 'wishlist' },
  { title: 'LIFE SHIFT', link: 'https://www.amazon.co.jp/dp/4492533877', status: 'wishlist' }
];
