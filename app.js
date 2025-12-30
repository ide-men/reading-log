// ========================================
// 定数
// ========================================
const STORAGE_KEY = 'readingLogV4';
const XP_PER_LEVEL = 5;
const XP_PER_BOOK = 10;
const MIN_SESSION_MINUTES = 10;

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

// ========================================
// 状態
// ========================================
let state = loadState();
let timer = null;
let seconds = 0;
let deletingBookId = null;
let editingBookId = null;

function createInitialState() {
  return {
    total: 0,
    today: 0,
    date: new Date().toDateString(),
    sessions: 0,
    xp: 0,
    lv: 1,
    books: [],
    history: [],
    milestones: []
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date !== new Date().toDateString()) {
        parsed.today = 0;
        parsed.date = new Date().toDateString();
      }
      return parsed;
    }
  } catch (e) {}
  return createInitialState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ========================================
// ユーティリティ
// ========================================
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

function isValidUrl(str) {
  return str && /^https?:\/\//i.test(str);
}

function isAmazonShortUrl(url) {
  if (!url) return false;
  return /^https?:\/\/(amzn\.asia|amzn\.to)\//i.test(url);
}

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
  if (!asin) return null;
  return `https://images-na.ssl-images-amazon.com/images/P/${asin}.09.LZZZZZZZ.jpg`;
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function calculateStreak(history) {
  if (!history.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const readingDays = new Set(
    history.map(h => new Date(h.d).toDateString())
  );

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
  const daysSinceStart = Math.max(1, Math.ceil((now - firstSession) / 86400000));

  const booksPerDay = books.length / daysSinceStart;

  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const daysLeft = Math.ceil((endOfYear - now) / 86400000);

  const prediction = books.length + Math.round(booksPerDay * daysLeft);

  return prediction + '冊';
}

function getNextTitleInfo(level, xp) {
  const currentTitle = getTitle(level);
  const nextTitle = TITLES.find(t => t.lv > level);

  if (!nextTitle) {
    return { text: '最高位到達！', label: '全称号獲得済み' };
  }

  const xpNeeded = (nextTitle.lv - 1) * XP_PER_LEVEL - xp;
  const booksNeeded = Math.ceil(xpNeeded / XP_PER_BOOK);

  return {
    text: nextTitle.name,
    label: `あと${booksNeeded}冊で獲得`
  };
}

// ========================================
// リンク確認
// ========================================
let pendingLink = null;

function openLink(url, event) {
  if (event) event.preventDefault();
  window.open(url, '_blank');
}

function confirmOpenLink() {
  if (pendingLink) {
    window.open(pendingLink, '_blank');
    pendingLink = null;
  }
  closeModal('linkConfirm');
}

// ========================================
// UI更新
// ========================================

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

function getButtonAnimation() {
  const hour = new Date().getHours();
  const streak = calculateStreak(state.history);

  if (streak >= 3 && Math.random() < 0.3) {
    const options = BUTTON_ANIMATIONS.streak;
    return options[Math.floor(Math.random() * options.length)];
  }

  let timeSlot;
  if (hour >= 5 && hour < 12) {
    timeSlot = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeSlot = 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeSlot = 'evening';
  } else {
    timeSlot = 'night';
  }

  const options = BUTTON_ANIMATIONS[timeSlot];
  return options[Math.floor(Math.random() * options.length)];
}

function updateButtonAnimation() {
  const btnIcon = document.querySelector('#startBtn .main-btn-icon');
  if (!btnIcon) return;

  const config = getButtonAnimation();

  btnIcon.textContent = config.icon;
  btnIcon.className = 'main-btn-icon';
  btnIcon.classList.add(`anim-${config.anim}`);
}

function updateUI() {
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById('quoteText').textContent = quote.text;
  document.getElementById('quoteAuthor').textContent = `— ${quote.author}`;

  updateButtonAnimation();
  saveState();
}

// ========================================
// タブ切り替え
// ========================================
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));

  document.getElementById(`tab-${name}`).classList.add('active');
  document.querySelector(`.nav button[data-tab="${name}"]`).classList.add('active');

  if (name === 'books') renderBooks();
  if (name === 'stats') renderStats();
}

// ========================================
// 読書中アニメーションパターン
// ========================================
const READING_ANIMATIONS = [
  { icon: '📖', anim: 'breath', label: '読書に集中しています' },
  { icon: '🌙', anim: 'float', label: 'ゆったりと読書中' },
  { icon: '☁️', anim: 'sway', label: '穏やかに読書中' },
  { icon: '🍃', anim: 'zen', label: '静かに読書中' },
  { icon: '✨', anim: 'breath', label: '本の世界に浸っています' },
  { icon: '🌿', anim: 'float', label: 'リラックスして読書中' }
];

function getReadingAnimation() {
  return READING_ANIMATIONS[Math.floor(Math.random() * READING_ANIMATIONS.length)];
}

function applyReadingAnimation() {
  const config = getReadingAnimation();
  const animEl = document.getElementById('readingAnim');
  const iconEl = document.getElementById('readingIcon');
  const labelEl = document.getElementById('readingLabel');

  iconEl.textContent = config.icon;
  animEl.className = 'reading-anim';
  animEl.classList.add(`anim-${config.anim}`);
  labelEl.textContent = config.label;
}

// ========================================
// タイマー
// ========================================
function startReading() {
  seconds = 0;
  applyReadingAnimation();
  document.getElementById('readingScreen').classList.add('active');
  timer = setInterval(() => seconds++, 1000);
  document.getElementById('startBtn').innerHTML = '<span class="main-btn-icon anim-relax">📖</span><span>読書中...</span>';
}

function stopReading() {
  clearInterval(timer);
  timer = null;
  document.getElementById('readingScreen').classList.remove('active');

  const minutes = Math.floor(seconds / 60);
  state.total += minutes;
  state.today += minutes;

  if (minutes >= MIN_SESSION_MINUTES) {
    state.sessions++;
    state.history.push({
      d: new Date().toISOString(),
      m: minutes,
      h: new Date().getHours()
    });
    addXP(1 + Math.floor(minutes / 10));
  }

  document.getElementById('startBtn').innerHTML = '<span class="main-btn-icon">📖</span><span>読書をはじめる</span>';
  seconds = 0;
  updateUI();
}

// ========================================
// XP・レベルアップ
// ========================================
function addXP(amount) {
  const oldLevel = state.lv;
  state.xp += amount;
  state.lv = Math.floor(state.xp / XP_PER_LEVEL) + 1;

  if (state.lv > oldLevel) {
    document.getElementById('newLevel').textContent = `Lv.${state.lv}`;
    document.getElementById('levelupOverlay').classList.add('active');
    showConfetti();

    const oldTitle = getTitle(oldLevel);
    const newTitle = getTitle(state.lv);
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
      ? `<button class="tooltip-btn" onclick="openLink('${escapeHtml(book.link)}', event)">リンクを開く</button>`
      : '';
    const darkerColor = adjustColor(color, -20);
    const lighterColor = adjustColor(color, 15);

    const bgStyle = book.coverUrl
      ? `background-image: url('${escapeHtml(book.coverUrl)}'); background-size: cover; background-position: center;`
      : `background: linear-gradient(to right, ${lighterColor} 0%, ${color} 15%, ${color} 85%, ${darkerColor} 100%);`;
    const hasCoverClass = book.coverUrl ? 'has-cover' : '';

    return `
      <div class="mini-book ${hasCoverClass}" style="
        height:${height}px;
        width:${width}px;
        ${bgStyle}
        transform: rotate(${tilt}deg);
      ">
        <div class="book-tooltip">
          <div class="tooltip-title">${escapeHtml(book.title)}</div>
          ${linkBtn}
        </div>
      </div>`;
  }).join('');

  bookList.innerHTML = [...state.books].reverse().map(book => {
    const link = isValidUrl(book.link) ? escapeHtml(book.link) : null;
    const xpBadge = book.xp ? '<span class="book-xp">+10 XP</span>' : '';
    const linkBtn = link
      ? `<button onclick="openLink('${link}', event)">↗</button>`
      : '';

    const coverHtml = book.coverUrl
      ? `<img src="${escapeHtml(book.coverUrl)}" alt="" class="book-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="book-icon-fallback">📕</div>`
      : '<div class="book-icon-emoji">📕</div>';

    return `
      <div class="book-item">
        <div class="book-icon">${coverHtml}</div>
        <div class="book-info">
          <div class="book-name">${escapeHtml(book.title)}</div>
          <div class="book-date">${new Date(book.id).toLocaleDateString('ja-JP')}${xpBadge}</div>
        </div>
        <div class="book-actions">
          ${linkBtn}
          <button onclick="editBook(${book.id})">✏️</button>
          <button onclick="deleteBook(${book.id})">×</button>
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
    coverUrl: coverUrl,
    xp: withXP
  });

  if (withXP) {
    addXP(XP_PER_BOOK);
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
    state.xp = Math.max(0, state.xp - XP_PER_BOOK);
    state.lv = Math.floor(state.xp / XP_PER_LEVEL) + 1;
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
  const title = getTitle(state.lv);
  document.getElementById('levelDisplay').textContent = `Lv.${state.lv}`;
  document.getElementById('titleDisplay').textContent = title.name;

  const xpInLevel = state.xp % XP_PER_LEVEL;
  document.getElementById('xpProgress').textContent = xpInLevel;
  document.getElementById('xpNeeded').textContent = XP_PER_LEVEL;

  const circumference = 414.69;
  const progress = xpInLevel / XP_PER_LEVEL;
  const offset = circumference * (1 - progress);
  document.getElementById('xpRing').style.strokeDashoffset = offset;

  document.getElementById('totalHours').textContent = Math.floor(state.total / 60);
  document.getElementById('totalSessions').textContent = state.sessions;

  const days = state.history.length
    ? Math.max(1, Math.ceil((Date.now() - new Date(state.history[0].d)) / 86400000))
    : 1;
  document.getElementById('daysSince').textContent = days;

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

  const yearlyPrediction = calculateYearlyPrediction(state.books, state.history);
  document.getElementById('yearlyPrediction').textContent = yearlyPrediction;

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
  if (state.books.length > 0 && state.total > 0) {
    tips.push(`平均1冊あたり${Math.round(state.total / state.books.length)}分`);
  }
  if (state.total >= 60) tips.push(`合計${Math.floor(state.total / 60)}時間読書`);
  if (state.total >= 120) tips.push(`映画${Math.floor(state.total / 120)}本分の時間`);

  document.getElementById('tipText').textContent = tips.length
    ? tips[Math.floor(Math.random() * tips.length)]
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
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
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
// イベント設定
// ========================================
document.querySelectorAll('.nav button').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.getElementById('startBtn').addEventListener('click', () => {
  timer ? stopReading() : startReading();
});

document.getElementById('stopBtn').addEventListener('click', stopReading);

document.getElementById('settingsBtn').addEventListener('click', () => {
  document.getElementById('settingsModal').classList.add('active');
});

document.querySelector('.nav button[data-tab="books"]').addEventListener('click', () => {
});

document.addEventListener('click', (e) => {
  if (e.target.closest('.header-btn.primary') ||
      (e.target.closest('.header') && document.getElementById('tab-books').classList.contains('active'))) {
  }
});

const fab = document.createElement('button');
fab.className = 'header-btn primary';
fab.style.cssText = 'position:fixed;bottom:90px;right:20px;width:56px;height:56px;border-radius:50%;font-size:28px;z-index:50;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
fab.textContent = '+';
fab.addEventListener('click', () => {
  document.getElementById('addBookModal').classList.add('active');
});
document.body.appendChild(fab);

const originalSwitchTab = switchTab;
switchTab = function(name) {
  originalSwitchTab(name);
  fab.style.display = name === 'books' ? 'flex' : 'none';
};

document.getElementById('linkToggle').addEventListener('click', () => {
  const fields = document.getElementById('linkFields');
  const isOpen = fields.classList.toggle('open');
  document.getElementById('linkIcon').textContent = isOpen ? '−' : '+';
});

document.getElementById('addBookBtn').addEventListener('click', () => addBook(true));
document.getElementById('addBookNoXpBtn').addEventListener('click', () => addBook(false));
document.getElementById('saveEditBtn').addEventListener('click', saveEditBook);

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('resetConfirm').classList.add('active');
});

document.getElementById('confirmResetBtn').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  state = createInitialState();
  updateUI();
  closeModal('resetConfirm');
  closeModal('settingsModal');
  showToast('リセットしました');
});

document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteBook);
document.getElementById('confirmLinkBtn').addEventListener('click', confirmOpenLink);

document.getElementById('closeLevelup').addEventListener('click', () => {
  document.getElementById('levelupOverlay').classList.remove('active');
});

document.getElementById('closeTitle').addEventListener('click', () => {
  document.getElementById('titleOverlay').classList.remove('active');
});

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

document.getElementById('shelf').addEventListener('mouseenter', (e) => {
  if (!e.target.classList.contains('mini-book')) return;

  const tooltip = e.target.querySelector('.book-tooltip');
  if (!tooltip) return;

  tooltip.classList.remove('tooltip-align-left', 'tooltip-align-right');

  const bookRect = e.target.getBoundingClientRect();
  const bookCenter = bookRect.left + bookRect.width / 2;
  const screenCenter = window.innerWidth / 2;
  const threshold = window.innerWidth * 0.15;

  if (bookCenter < screenCenter - threshold) {
    tooltip.classList.add('tooltip-align-left');
  }
  else if (bookCenter > screenCenter + threshold) {
    tooltip.classList.add('tooltip-align-right');
  }
}, true);

// 初期化
updateUI();
