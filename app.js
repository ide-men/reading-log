// ========================================
// 定数・設定
// ========================================
const SCHEMA_VERSION = 1;

// バージョン付きキー名（将来のマイグレーション時に新しいキーを作成可能）
const STORAGE_KEYS = {
  meta: 'rl_v1_meta',
  stats: 'rl_v1_stats',
  books: 'rl_v1_books',
  history: 'rl_v1_history',
  archived: 'rl_v1_archived'
};

const CONFIG = {
  xpPerLevel: 5,
  xpPerBook: 10,
  minSessionMinutes: 10,
  msPerDay: 86400000,
  historyRetentionDays: 90,
  archiveRetentionDays: 365,
  storageWarningPercent: 80
};

const TITLES = [
  { lv: 1, name: '読書ビギナー', sub: '読書の旅が始まる', icon: '🌱' },
  { lv: 3, name: '本の虫', sub: '少しずつ習慣に', icon: '🐛' },
  { lv: 5, name: '読書家', sub: '読書が日常になった', icon: '📖' },
  { lv: 10, name: '読書マニア', sub: '本なしでは生きられない', icon: '📚' },
  { lv: 20, name: '読書マスター', sub: '知識の探求者', icon: '🎓' },
  { lv: 35, name: '読書の達人', sub: '本と共に生きる', icon: '⚔️' },
  { lv: 50, name: '読書王', sub: '書物の王国の主', icon: '👑' },
  { lv: 75, name: '読書の賢者', sub: '無限の知恵', icon: '🧙' },
  { lv: 100, name: '読書神', sub: '神の領域へ', icon: '✨' }
];

const QUOTES = [
  { text: '読書は心の旅路。一ページが新しい世界への扉となる。', author: '今日の一言' },
  { text: '本を読むことは、他人の頭で考えることである。', author: 'ショーペンハウアー' },
  { text: '良書は最良の友人である。', author: 'プロヴァーブ' },
  { text: '知識への投資は、常に最高の利息がつく。', author: 'ベンジャミン・フランクリン' },
  { text: '本は心の糧。毎日少しずつ味わおう。', author: '今日の一言' }
];

const BOOK_COLORS = [
  '#c62828', '#1565c0', '#2e7d32', '#6a1b9a', '#e65100',
  '#00695c', '#37474f', '#8d6e63', '#d84315', '#0277bd'
];

const BUTTON_ANIMATIONS = {
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

const READING_ANIMATIONS = [
  { icon: '📖', anim: 'breath', label: '読書に集中しています' },
  { icon: '🌙', anim: 'float', label: 'ゆったりと読書中' },
  { icon: '☁️', anim: 'sway', label: '穏やかに読書中' },
  { icon: '🍃', anim: 'zen', label: '静かに読書中' },
  { icon: '✨', anim: 'breath', label: '本の世界に浸っています' },
  { icon: '🌿', anim: 'float', label: 'リラックスして読書中' }
];

// サンプルデータ（デモ・紹介用）
const SAMPLE_BOOKS = [
  { title: '人を動かす', link: 'https://www.amazon.co.jp/dp/442210098X' },
  { title: '嫌われる勇気', link: 'https://www.amazon.co.jp/dp/4478025819' },
  { title: '7つの習慣', link: 'https://www.amazon.co.jp/dp/4863940246' },
  { title: '夜と霧', link: 'https://www.amazon.co.jp/dp/4622039702' },
  { title: 'FACTFULNESS', link: 'https://www.amazon.co.jp/dp/4822289605' },
  { title: '思考の整理学', link: 'https://www.amazon.co.jp/dp/4480020470' },
  { title: 'サピエンス全史（上）', link: 'https://www.amazon.co.jp/dp/430922671X' },
  { title: '影響力の武器', link: 'https://www.amazon.co.jp/dp/4414304229' },
  { title: '金持ち父さん貧乏父さん', link: 'https://www.amazon.co.jp/dp/4480864245' },
  { title: 'イシューからはじめよ', link: 'https://www.amazon.co.jp/dp/4862760856' },
  { title: 'エッセンシャル思考', link: 'https://www.amazon.co.jp/dp/4761270438' },
  { title: 'アウトプット大全', link: 'https://www.amazon.co.jp/dp/4801400558' },
  { title: '1日1ページ、読むだけで身につく世界の教養365', link: 'https://www.amazon.co.jp/dp/4866510552' },
  { title: 'DIE WITH ZERO', link: 'https://www.amazon.co.jp/dp/447810911X' },
  { title: '限りある時間の使い方', link: 'https://www.amazon.co.jp/dp/4761276150' },
  { title: 'チーズはどこへ消えた？', link: 'https://www.amazon.co.jp/dp/459403019X' },
  { title: '君たちはどう生きるか', link: 'https://www.amazon.co.jp/dp/4003315812' },
  { title: 'アトミック・ハビッツ', link: 'https://www.amazon.co.jp/dp/4833423057' },
  { title: '1兆ドルコーチ', link: 'https://www.amazon.co.jp/dp/4478107246' },
  { title: 'LIFE SHIFT', link: 'https://www.amazon.co.jp/dp/4492533877' }
];

// ========================================
// 状態管理
// ========================================
let state = null;
let timer = null;
let seconds = 0;
let deletingBookId = null;
let editingBookId = null;

function createInitialMeta() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString()
  };
}

function createInitialStats() {
  return {
    total: 0,
    today: 0,
    date: new Date().toDateString(),
    sessions: 0,
    xp: 0,
    lv: 1,
    firstSessionDate: null
  };
}

function createInitialState() {
  return {
    meta: createInitialMeta(),
    stats: createInitialStats(),
    books: [],
    history: [],
    archived: {}
  };
}

// ========================================
// マイグレーションインフラ
// ========================================
// 将来のマイグレーション関数を登録するオブジェクト
// 例: migrations[2] = (state) => { /* v1 -> v2 の変換 */ return newState; }
const migrations = {};

// 現在のスキーマバージョンまでマイグレーションを実行
function runMigrations(loadedState, fromVersion) {
  let currentState = loadedState;
  for (let v = fromVersion + 1; v <= SCHEMA_VERSION; v++) {
    if (migrations[v]) {
      console.log(`Migrating from v${v - 1} to v${v}...`);
      currentState = migrations[v](currentState);
      currentState.meta.schemaVersion = v;
      currentState.meta.migratedAt = new Date().toISOString();
    }
  }
  return currentState;
}

function loadState() {
  try {
    const meta = localStorage.getItem(STORAGE_KEYS.meta);
    if (meta) {
      const parsedMeta = JSON.parse(meta);
      const loadedState = {
        meta: parsedMeta,
        stats: JSON.parse(localStorage.getItem(STORAGE_KEYS.stats) || '{}'),
        books: JSON.parse(localStorage.getItem(STORAGE_KEYS.books) || '[]'),
        history: JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]'),
        archived: JSON.parse(localStorage.getItem(STORAGE_KEYS.archived) || '{}')
      };

      // 日付リセット
      const today = new Date().toDateString();
      if (loadedState.stats.date !== today) {
        loadedState.stats.today = 0;
        loadedState.stats.date = today;
      }

      // 必要ならマイグレーション実行
      const currentVersion = parsedMeta.schemaVersion || 1;
      if (currentVersion < SCHEMA_VERSION) {
        const migratedState = runMigrations(loadedState, currentVersion);
        saveStateToStorage(migratedState);
        return migratedState;
      }

      return loadedState;
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return createInitialState();
}

function saveStateToStorage(s) {
  localStorage.setItem(STORAGE_KEYS.meta, JSON.stringify(s.meta));
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(s.stats));
  localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(s.books));
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(s.history));
  localStorage.setItem(STORAGE_KEYS.archived, JSON.stringify(s.archived));
}

function saveState() {
  saveStateToStorage(state);
}

// ========================================
// 履歴クリーンアップ
// ========================================
function cleanupHistory() {
  const now = new Date();
  const retentionCutoff = new Date(now - CONFIG.historyRetentionDays * CONFIG.msPerDay);
  const archiveCutoff = new Date(now - CONFIG.archiveRetentionDays * CONFIG.msPerDay);

  const recentHistory = [];
  const toArchive = [];

  for (const entry of state.history) {
    const entryDate = new Date(entry.d);
    if (entryDate >= retentionCutoff) {
      recentHistory.push(entry);
    } else {
      toArchive.push(entry);
    }
  }

  // 古い履歴を月別に集約
  for (const entry of toArchive) {
    const monthKey = entry.d.substring(0, 7); // "YYYY-MM"
    if (!state.archived[monthKey]) {
      state.archived[monthKey] = { sessions: 0, totalMinutes: 0 };
    }
    state.archived[monthKey].sessions++;
    state.archived[monthKey].totalMinutes += entry.m;
  }

  // 1年以上前のアーカイブを削除
  for (const monthKey of Object.keys(state.archived)) {
    const monthDate = new Date(monthKey + '-01');
    if (monthDate < archiveCutoff) {
      delete state.archived[monthKey];
    }
  }

  state.history = recentHistory;

  if (toArchive.length > 0) {
    console.log(`Archived ${toArchive.length} history entries`);
  }
}

// ========================================
// ストレージ容量管理
// ========================================
function getStorageUsage() {
  let used = 0;
  for (const key of Object.values(STORAGE_KEYS)) {
    const item = localStorage.getItem(key);
    if (item) used += item.length * 2; // UTF-16 = 2 bytes per char
  }
  const limit = 5 * 1024 * 1024;
  return {
    used,
    limit,
    percent: Math.round((used / limit) * 100 * 10) / 10,
    usedKB: Math.round(used / 1024 * 10) / 10,
    limitMB: 5
  };
}

function checkStorageWarning() {
  const usage = getStorageUsage();
  if (usage.percent >= CONFIG.storageWarningPercent) {
    console.warn(`Storage usage: ${usage.percent}%`);
    return true;
  }
  return false;
}

function updateStorageDisplay() {
  const usage = getStorageUsage();
  const barFill = document.getElementById('storageBarFill');
  const usedText = document.getElementById('storageUsed');

  if (barFill) {
    barFill.style.width = `${Math.min(usage.percent, 100)}%`;
    barFill.classList.toggle('warning', usage.percent >= CONFIG.storageWarningPercent);
  }
  if (usedText) {
    usedText.textContent = usage.usedKB;
  }
}

// ========================================
// バックアップ・復元
// ========================================
function exportData() {
  const exportObj = {
    exportSchemaVersion: SCHEMA_VERSION,
    exportDate: new Date().toISOString(),
    meta: state.meta,
    stats: state.stats,
    books: state.books,
    history: state.history,
    archived: state.archived
  };

  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reading-log-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('バックアップをダウンロードしました');
}

function validateImportedStats(stats) {
  if (typeof stats !== 'object' || stats === null) return false;
  if (typeof stats.total !== 'number') return false;
  if (typeof stats.sessions !== 'number') return false;
  if (typeof stats.xp !== 'number') return false;
  if (typeof stats.lv !== 'number') return false;
  return true;
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);

      // バリデーション
      if (!imported.stats || !imported.books) {
        showToast('無効なバックアップファイルです', 4000);
        return;
      }

      if (!validateImportedStats(imported.stats)) {
        showToast('バックアップデータが破損しています', 4000);
        return;
      }

      if (!Array.isArray(imported.books)) {
        showToast('本のデータが不正です', 4000);
        return;
      }

      if (imported.history && !Array.isArray(imported.history)) {
        showToast('履歴データが不正です', 4000);
        return;
      }

      state = {
        meta: {
          schemaVersion: SCHEMA_VERSION,
          createdAt: imported.meta?.createdAt || new Date().toISOString(),
          importedAt: new Date().toISOString()
        },
        stats: {
          total: imported.stats.total || 0,
          today: imported.stats.today || 0,
          date: imported.stats.date || new Date().toDateString(),
          sessions: imported.stats.sessions || 0,
          xp: imported.stats.xp || 0,
          lv: imported.stats.lv || 1,
          firstSessionDate: imported.stats.firstSessionDate || null
        },
        books: imported.books || [],
        history: imported.history || [],
        archived: imported.archived || {}
      };

      saveState();
      updateUI();
      renderBooks();
      renderStats();
      showToast('データを復元しました');
    } catch (err) {
      console.error('Import failed:', err);
      showToast('インポートに失敗しました', 4000);
    }
  };
  reader.readAsText(file);
}

function loadSampleData() {
  const now = Date.now();
  const dayMs = CONFIG.msPerDay;

  // サンプルの本を作成（過去30日間に読了したことにする）
  const books = SAMPLE_BOOKS.map((book, i) => {
    const daysAgo = Math.floor((SAMPLE_BOOKS.length - 1 - i) * 4);
    const id = now - (daysAgo * dayMs) - (i * 1000);
    const asin = extractAsinFromUrl(book.link);
    return {
      id,
      title: book.title,
      link: book.link,
      coverUrl: getAmazonImageUrl(asin),
      xp: true
    };
  });

  // サンプルの読書履歴（過去30日間でランダムに）
  const history = [];
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now - daysAgo * dayMs);
    const hour = 6 + Math.floor(Math.random() * 16); // 6時〜22時
    date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    history.push({
      d: date.toISOString(),
      m: 15 + Math.floor(Math.random() * 45), // 15〜60分
      h: hour
    });
  }
  history.sort((a, b) => new Date(a.d) - new Date(b.d));

  // 統計を計算
  const totalMinutes = history.reduce((sum, h) => sum + h.m, 0);
  const xp = books.length * CONFIG.xpPerBook + history.length;
  const lv = Math.floor(xp / CONFIG.xpPerLevel) + 1;

  state = {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      createdAt: new Date(now - 30 * dayMs).toISOString(),
      sampleDataLoaded: true
    },
    stats: {
      total: totalMinutes,
      today: history.filter(h => h.d.startsWith(new Date().toISOString().split('T')[0])).reduce((sum, h) => sum + h.m, 0),
      date: new Date().toDateString(),
      sessions: history.length,
      xp,
      lv,
      firstSessionDate: history[0]?.d || null
    },
    books,
    history,
    archived: {}
  };

  saveState();
  updateUI();
  renderBooks();
  renderStats();
  showToast('サンプルデータを読み込みました');
}

// ========================================
// ユーティリティ関数
// ========================================
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getTitle(level) {
  for (let i = TITLES.length - 1; i >= 0; i--) {
    if (level >= TITLES[i].lv) return TITLES[i];
  }
  return TITLES[0];
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ========================================
// URL・Amazon関連
// ========================================
const isValidUrl = (str) => str && /^https?:\/\//i.test(str);
const isAmazonShortUrl = (url) => url && /^https?:\/\/(amzn\.asia|amzn\.to)\//i.test(url);

function extractAsinFromUrl(url) {
  if (!url) return null;
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})/i,
    /\/ASIN\/([A-Z0-9]{10})/i,
    /amazon\.[a-z.]+\/.*?\/([A-Z0-9]{10})(?:[/?]|$)/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getAmazonImageUrl(asin) {
  return asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.09.LZZZZZZZ.jpg` : null;
}

// ========================================
// 統計計算
// ========================================
function calculateStreak() {
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

function calculateYearlyPrediction(books, history) {
  if (!books.length || !history.length) return '--冊';

  const now = new Date();
  const firstSession = new Date(history[0].d);
  const daysSinceStart = Math.max(1, Math.ceil((now - firstSession) / CONFIG.msPerDay));
  const booksPerDay = books.length / daysSinceStart;

  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const daysLeft = Math.ceil((endOfYear - now) / CONFIG.msPerDay);

  return (books.length + Math.round(booksPerDay * daysLeft)) + '冊';
}

function getNextTitleInfo(level, xp) {
  const nextTitle = TITLES.find(t => t.lv > level);

  if (!nextTitle) {
    return { text: '最高位到達！', label: '全称号獲得済み' };
  }

  const xpNeeded = (nextTitle.lv - 1) * CONFIG.xpPerLevel - xp;
  const booksNeeded = Math.max(1, Math.ceil(xpNeeded / CONFIG.xpPerBook));

  return {
    text: nextTitle.name,
    label: `あと${booksNeeded}冊で獲得`
  };
}

// ========================================
// リンク操作
// ========================================
function openLink(url, event) {
  if (event) event.preventDefault();
  window.open(url, '_blank');
}

// ========================================
// アニメーション
// ========================================
function getButtonAnimation() {
  const hour = new Date().getHours();
  const streak = calculateStreak();

  if (streak >= 3 && Math.random() < 0.3) {
    return randomItem(BUTTON_ANIMATIONS.streak);
  }

  let timeSlot;
  if (hour >= 5 && hour < 12) timeSlot = 'morning';
  else if (hour >= 12 && hour < 17) timeSlot = 'afternoon';
  else if (hour >= 17 && hour < 21) timeSlot = 'evening';
  else timeSlot = 'night';

  return randomItem(BUTTON_ANIMATIONS[timeSlot]);
}

function updateButtonAnimation() {
  const btnIcon = document.querySelector('#startBtn .main-btn-icon');
  if (!btnIcon) return;

  const config = getButtonAnimation();
  btnIcon.textContent = config.icon;
  btnIcon.className = `main-btn-icon anim-${config.anim}`;
}

function applyReadingAnimation() {
  const config = randomItem(READING_ANIMATIONS);
  const animEl = document.getElementById('readingAnim');
  const iconEl = document.getElementById('readingIcon');
  const labelEl = document.getElementById('readingLabel');

  iconEl.textContent = config.icon;
  animEl.className = `reading-anim anim-${config.anim}`;
  labelEl.textContent = config.label;
}

// ========================================
// UI更新
// ========================================
function updateUI() {
  const quote = randomItem(QUOTES);
  document.getElementById('quoteText').textContent = quote.text;
  document.getElementById('quoteAuthor').textContent = `— ${quote.author}`;

  updateButtonAnimation();
  saveState();
}

// ========================================
// タブ・ナビゲーション
// ========================================
let fab = null;

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));

  document.getElementById(`tab-${name}`).classList.add('active');
  document.querySelector(`.nav button[data-tab="${name}"]`).classList.add('active');

  if (fab) {
    fab.style.display = name === 'books' ? 'flex' : 'none';
  }

  if (name === 'books') renderBooks();
  if (name === 'stats') renderStats();
}

// ========================================
// タイマー
// ========================================
function startReading() {
  if (timer) return; // 二重起動を防止
  seconds = 0;
  applyReadingAnimation();
  document.getElementById('readingScreen').classList.add('active');
  timer = setInterval(() => seconds++, 1000);
  document.getElementById('startBtn').innerHTML =
    '<span class="main-btn-icon anim-relax">📖</span><span>読書中...</span>';
}

function stopReading() {
  clearInterval(timer);
  timer = null;
  document.getElementById('readingScreen').classList.remove('active');

  const minutes = Math.floor(seconds / 60);
  state.stats.total += minutes;
  state.stats.today += minutes;

  if (minutes >= CONFIG.minSessionMinutes) {
    state.stats.sessions++;
    if (!state.stats.firstSessionDate) {
      state.stats.firstSessionDate = new Date().toISOString();
    }
    state.history.push({
      d: new Date().toISOString(),
      m: minutes,
      h: new Date().getHours()
    });
    addXP(1 + Math.floor(minutes / 10));
  }

  document.getElementById('startBtn').innerHTML =
    '<span class="main-btn-icon">📖</span><span>読書をはじめる</span>';
  seconds = 0;
  updateUI();
}

// ========================================
// XP・レベルアップ
// ========================================
function addXP(amount) {
  const oldLevel = state.stats.lv;
  state.stats.xp += amount;
  state.stats.lv = Math.floor(state.stats.xp / CONFIG.xpPerLevel) + 1;

  if (state.stats.lv > oldLevel) {
    document.getElementById('newLevel').textContent = `Lv.${state.stats.lv}`;
    document.getElementById('levelupOverlay').classList.add('active');
    showConfetti();

    const oldTitle = getTitle(oldLevel);
    const newTitle = getTitle(state.stats.lv);
    if (newTitle.name !== oldTitle.name) {
      setTimeout(() => {
        document.getElementById('newTitleIcon').textContent = newTitle.icon;
        document.getElementById('newTitleName').textContent = newTitle.name;
        document.getElementById('newTitleSub').textContent = newTitle.sub;
        document.getElementById('titleOverlay').classList.add('active');
      }, 2000);
    }
  }
}

// ========================================
// 本棚
// ========================================
function checkCoverImages() {
  document.querySelectorAll('[data-cover-url]').forEach(el => {
    const url = el.dataset.coverUrl;
    const img = new Image();
    img.onload = () => el.classList.remove('cover-error');
    img.onerror = () => {
      el.classList.add('cover-error');
      // カバー画像エラー時は背景を戻す（リンクなし時と同じ表示）
      const color = el.dataset.color;
      if (color && el.classList.contains('mini-book')) {
        // 本棚の本はグラデーション背景に戻す
        // 個別に設定されたbackgroundプロパティをクリアしてから設定
        const darkerColor = adjustColor(color, -20);
        const lighterColor = adjustColor(color, 15);
        el.style.backgroundColor = '';
        el.style.backgroundImage = '';
        el.style.backgroundSize = '';
        el.style.backgroundPosition = '';
        el.style.background = `linear-gradient(to right, ${lighterColor} 0%, ${color} 15%, ${color} 85%, ${darkerColor} 100%)`;
      }
    };
    img.src = url;
  });
}

function renderBooks() {
  const bookCount = state.books.length;
  document.getElementById('bookCount').textContent = bookCount;

  const shelf = document.getElementById('shelf');
  const bookList = document.getElementById('bookList');
  const booksListTitle = document.getElementById('booksListTitle');

  if (!bookCount) {
    shelf.innerHTML = `
      <div class="empty-shelf">
        <div class="empty-shelf-icon">📖</div>
        <div class="empty-shelf-text">まだ本がありません</div>
        <div class="empty-shelf-hint">読み終えた本を記録してみましょう</div>
      </div>`;
    bookList.innerHTML = '';
    booksListTitle.style.display = 'none';
    return;
  }

  booksListTitle.style.display = 'block';

  shelf.innerHTML = state.books.map((book, i) => {
    const color = BOOK_COLORS[i % BOOK_COLORS.length];
    const height = 50 + ((i * 17) % 25);
    const width = book.coverUrl ? 18 + ((i * 2) % 6) : 14 + ((i * 3) % 8);
    const tilt = ((i * 7) % 5) - 2;
    const hasLink = isValidUrl(book.link);
    const linkBtn = hasLink
      ? `<button class="tooltip-btn" data-link="${escapeAttr(book.link)}">リンクを開く</button>`
      : '';
    const darkerColor = adjustColor(color, -20);
    const lighterColor = adjustColor(color, 15);

    const bgStyle = book.coverUrl
      ? `background-color: ${color}; background-image: url('${escapeHtml(book.coverUrl)}'); background-size: cover; background-position: center;`
      : `background: linear-gradient(to right, ${lighterColor} 0%, ${color} 15%, ${color} 85%, ${darkerColor} 100%);`;
    const hasCoverClass = book.coverUrl ? 'has-cover' : '';

    return `
      <div class="mini-book ${hasCoverClass}" style="
        height:${height}px;
        width:${width}px;
        ${bgStyle}
        transform: rotate(${tilt}deg);
      "${book.coverUrl ? ` data-cover-url="${escapeAttr(book.coverUrl)}" data-color="${color}"` : ''}>
        <div class="book-tooltip">
          <div class="tooltip-title">${escapeHtml(book.title)}</div>
          ${linkBtn}
        </div>
      </div>`;
  }).join('');

  checkCoverImages();

  bookList.innerHTML = [...state.books].reverse().map((book, i) => {
    const link = isValidUrl(book.link) ? escapeAttr(book.link) : null;
    const xpBadge = book.xp ? '<span class="book-xp">+10 XP</span>' : '';
    const linkBtn = link ? `<button data-link="${link}">↗</button>` : '';

    // リストは逆順なのでカラーインデックスも逆順に
    const colorIndex = state.books.length - 1 - i;
    const color = BOOK_COLORS[colorIndex % BOOK_COLORS.length];

    const coverHtml = book.coverUrl
      ? `<img src="${escapeHtml(book.coverUrl)}" alt="" class="book-cover" onerror="this.parentElement.classList.add('cover-error')">`
      : '';

    return `
      <div class="book-item">
        <div class="book-icon${book.coverUrl ? ' has-cover' : ''}" style="background-color: ${color}"${book.coverUrl ? ` data-cover-url="${escapeAttr(book.coverUrl)}" data-color="${color}"` : ''}>${coverHtml}</div>
        <div class="book-info">
          <div class="book-name">${escapeHtml(book.title)}</div>
          <div class="book-date">${new Date(book.id).toLocaleDateString('ja-JP')}${xpBadge}</div>
        </div>
        <div class="book-actions">
          ${linkBtn}
          <button data-edit="${book.id}">✏️</button>
          <button data-delete="${book.id}">×</button>
        </div>
      </div>
    `;
  }).join('');
}

function addBook(withXP) {
  const title = document.getElementById('bookInput').value.trim();
  if (!title) {
    showToast('タイトルを入力してください');
    return;
  }

  const link = document.getElementById('linkInput').value.trim();
  let coverUrl = null;
  const asin = extractAsinFromUrl(link);

  if (asin) {
    coverUrl = getAmazonImageUrl(asin);
  } else if (isAmazonShortUrl(link)) {
    showToast('短縮URL(amzn.asia等)では表紙画像を取得できません。amazon.co.jpのフルURLをお使いください', 4000);
  }

  state.books.push({
    id: Date.now(),
    title,
    link: link || null,
    coverUrl,
    xp: withXP
  });

  if (withXP) {
    addXP(CONFIG.xpPerBook);
    showConfetti();
    showToast('1冊読破！+10 XP');
  } else {
    showToast('本を登録しました');
  }

  renderBooks();
  updateUI();
  closeModal('addBookModal');
  document.getElementById('bookInput').value = '';
  document.getElementById('linkInput').value = '';
}

function editBook(id) {
  const book = state.books.find(b => b.id === id);
  if (!book) return;

  editingBookId = id;
  document.getElementById('editBookTitle').value = book.title;
  document.getElementById('editBookLink').value = book.link || '';
  document.getElementById('editBookModal').classList.add('active');
}

function saveEditBook() {
  const title = document.getElementById('editBookTitle').value.trim();
  if (!title) {
    showToast('タイトルを入力してください');
    return;
  }

  const book = state.books.find(b => b.id === editingBookId);
  if (book) {
    book.title = title;
    const newLink = document.getElementById('editBookLink').value.trim() || null;

    if (newLink !== book.link) {
      book.link = newLink;
      const asin = extractAsinFromUrl(newLink);
      book.coverUrl = asin ? getAmazonImageUrl(asin) : null;

      if (!asin && isAmazonShortUrl(newLink)) {
        showToast('短縮URL(amzn.asia等)では表紙画像を取得できません。amazon.co.jpのフルURLをお使いください', 4000);
      }
    }

    saveState();
    renderBooks();
    showToast('保存しました');
  }
  closeModal('editBookModal');
}

function deleteBook(id) {
  const book = state.books.find(b => b.id === id);
  if (!book) return;

  deletingBookId = id;
  document.getElementById('deleteBookTitle').textContent = `「${book.title}」`;
  document.getElementById('deleteConfirm').classList.add('active');
}

function confirmDeleteBook() {
  const book = state.books.find(b => b.id === deletingBookId);
  if (book?.xp) {
    state.stats.xp = Math.max(0, state.stats.xp - CONFIG.xpPerBook);
    state.stats.lv = Math.floor(state.stats.xp / CONFIG.xpPerLevel) + 1;
  }
  state.books = state.books.filter(b => b.id !== deletingBookId);

  saveState();
  renderBooks();
  updateUI();
  showToast('削除しました');
  closeModal('deleteConfirm');
}

// ========================================
// 統計
// ========================================
function renderStats() {
  const title = getTitle(state.stats.lv);
  document.getElementById('levelDisplay').textContent = `Lv.${state.stats.lv}`;
  document.getElementById('titleDisplay').textContent = title.name;

  const xpInLevel = state.stats.xp % CONFIG.xpPerLevel;
  document.getElementById('xpProgress').textContent = xpInLevel;
  document.getElementById('xpNeeded').textContent = CONFIG.xpPerLevel;

  const circumference = 414.69;
  const progress = xpInLevel / CONFIG.xpPerLevel;
  document.getElementById('xpRing').style.strokeDashoffset = circumference * (1 - progress);

  document.getElementById('totalHours').textContent = Math.floor(state.stats.total / 60);
  document.getElementById('totalSessions').textContent = state.stats.sessions;

  // firstSessionDateを使って開始からの日数を計算
  const startDate = state.stats.firstSessionDate || (state.history.length ? state.history[0].d : null);
  const days = startDate
    ? Math.max(1, Math.ceil((Date.now() - new Date(startDate)) / CONFIG.msPerDay))
    : 1;
  document.getElementById('daysSince').textContent = days;

  renderWeekChart();
  renderReadingInsights();
}

function renderWeekChart() {
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

// ========================================
// モーダル
// ========================================
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// ========================================
// エフェクト
// ========================================
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

function showConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti';
  const colors = ['#e8a87c', '#f0c27b', '#7dd3a8', '#6b5b95', '#f87171'];

  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('i');
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[i % 5]};
      animation-delay: ${Math.random() * 0.4}s;
      animation-duration: ${2 + Math.random()}s;
    `;
    container.appendChild(piece);
  }

  document.body.appendChild(container);
  setTimeout(() => container.remove(), 3000);
}

// ========================================
// イベントリスナー初期化
// ========================================
function initializeEventListeners() {
  // ナビゲーション
  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // タイマー
  document.getElementById('startBtn').addEventListener('click', () => {
    timer ? stopReading() : startReading();
  });
  document.getElementById('stopBtn').addEventListener('click', stopReading);

  // 設定
  document.getElementById('settingsBtn').addEventListener('click', () => {
    updateStorageDisplay();
    document.getElementById('settingsModal').classList.add('active');
  });

  // バックアップ・復元
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) {
      importData(e.target.files[0]);
      e.target.value = '';
    }
  });

  // FAB（本追加ボタン）
  fab = document.createElement('button');
  fab.className = 'header-btn primary';
  fab.style.cssText = 'position:fixed;bottom:90px;right:20px;width:56px;height:56px;border-radius:50%;font-size:28px;z-index:50;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
  fab.textContent = '+';
  fab.addEventListener('click', () => {
    document.getElementById('addBookModal').classList.add('active');
  });
  document.body.appendChild(fab);

  // リンク入力トグル
  document.getElementById('linkToggle').addEventListener('click', () => {
    const fields = document.getElementById('linkFields');
    const isOpen = fields.classList.toggle('open');
    document.getElementById('linkIcon').textContent = isOpen ? '−' : '+';
  });

  // 本の追加・編集
  document.getElementById('addBookBtn').addEventListener('click', () => addBook(true));
  document.getElementById('addBookNoXpBtn').addEventListener('click', () => addBook(false));
  document.getElementById('saveEditBtn').addEventListener('click', saveEditBook);

  // リセット
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('resetConfirm').classList.add('active');
  });

  document.getElementById('confirmResetBtn').addEventListener('click', () => {
    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(key);
    }
    state = createInitialState();
    saveState();
    updateUI();
    closeModal('resetConfirm');
    closeModal('settingsModal');
    showToast('リセットしました');
  });

  // サンプルデータ
  document.getElementById('sampleDataBtn').addEventListener('click', () => {
    document.getElementById('sampleDataConfirm').classList.add('active');
  });

  document.getElementById('confirmSampleBtn').addEventListener('click', () => {
    loadSampleData();
    closeModal('sampleDataConfirm');
    closeModal('settingsModal');
  });

  // 削除確認
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteBook);

  // レベルアップ・称号オーバーレイ
  document.getElementById('closeLevelup').addEventListener('click', () => {
    document.getElementById('levelupOverlay').classList.remove('active');
  });

  document.getElementById('closeTitle').addEventListener('click', () => {
    document.getElementById('titleOverlay').classList.remove('active');
  });

  // data-close属性を持つボタン
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // モーダルオーバーレイクリックで閉じる
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // 本棚ツールチップ位置調整（mouseoverを使用してイベントデリゲーション対応）
  document.getElementById('shelf').addEventListener('mouseover', (e) => {
    const miniBook = e.target.closest('.mini-book');
    if (!miniBook) return;

    const tooltip = miniBook.querySelector('.book-tooltip');
    if (!tooltip) return;

    tooltip.classList.remove('tooltip-align-left', 'tooltip-align-right');

    const bookRect = miniBook.getBoundingClientRect();
    const bookCenter = bookRect.left + bookRect.width / 2;
    const screenCenter = window.innerWidth / 2;
    const threshold = window.innerWidth * 0.15;

    if (bookCenter < screenCenter - threshold) {
      tooltip.classList.add('tooltip-align-left');
    } else if (bookCenter > screenCenter + threshold) {
      tooltip.classList.add('tooltip-align-right');
    }
  });

  // 本棚リンククリック（イベントデリゲーション）
  document.getElementById('shelf').addEventListener('click', (e) => {
    const linkBtn = e.target.closest('[data-link]');
    if (linkBtn) {
      e.preventDefault();
      openLink(linkBtn.dataset.link);
    }
  });

  // 本リストのボタン操作（イベントデリゲーション）
  document.getElementById('bookList').addEventListener('click', (e) => {
    const linkBtn = e.target.closest('[data-link]');
    if (linkBtn) {
      e.preventDefault();
      openLink(linkBtn.dataset.link);
      return;
    }

    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) {
      editBook(Number(editBtn.dataset.edit));
      return;
    }

    const deleteBtn = e.target.closest('[data-delete]');
    if (deleteBtn) {
      deleteBook(Number(deleteBtn.dataset.delete));
    }
  });

  // 読書中にページを離れる際の警告
  window.addEventListener('beforeunload', (e) => {
    if (timer && seconds > 0) {
      e.preventDefault();
      e.returnValue = '読書中のデータが失われます。ページを離れますか？';
      return e.returnValue;
    }
  });
}

// ========================================
// 初期化
// ========================================
state = loadState();
cleanupHistory();
saveState();
initializeEventListeners();
updateUI();
