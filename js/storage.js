// ========================================
// Storage & Persistence
// ========================================
import { SCHEMA_VERSION, STORAGE_KEYS, CONFIG, SAMPLE_BOOKS } from './constants.js';
import { stateManager, createInitialState } from './state.js';
import { extractAsinFromUrl, getAmazonImageUrl } from './utils.js';

// ========================================
// マイグレーションインフラ
// ========================================
const migrations = {};

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

// ========================================
// 状態の読み込み・保存
// ========================================
export function loadState() {
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

export function saveStateToStorage(s) {
  localStorage.setItem(STORAGE_KEYS.meta, JSON.stringify(s.meta));
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(s.stats));
  localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(s.books));
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(s.history));
  localStorage.setItem(STORAGE_KEYS.archived, JSON.stringify(s.archived));
}

export function saveState() {
  saveStateToStorage(stateManager.getState());
}

// ========================================
// 履歴クリーンアップ
// ========================================
export function cleanupHistory() {
  const state = stateManager.getState();
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
    const monthKey = entry.d.substring(0, 7);
    stateManager.updateArchived(monthKey, { sessions: 1, totalMinutes: entry.m });
  }

  // 1年以上前のアーカイブを削除
  for (const monthKey of Object.keys(state.archived)) {
    const monthDate = new Date(monthKey + '-01');
    if (monthDate < archiveCutoff) {
      stateManager.removeArchived(monthKey);
    }
  }

  stateManager.setHistory(recentHistory);

  if (toArchive.length > 0) {
    console.log(`Archived ${toArchive.length} history entries`);
  }
}

// ========================================
// ストレージ容量管理
// ========================================
export function getStorageUsage() {
  let used = 0;
  for (const key of Object.values(STORAGE_KEYS)) {
    const item = localStorage.getItem(key);
    if (item) used += item.length * 2;
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

export function checkStorageWarning() {
  const usage = getStorageUsage();
  if (usage.percent >= CONFIG.storageWarningPercent) {
    console.warn(`Storage usage: ${usage.percent}%`);
    return true;
  }
  return false;
}

export function updateStorageDisplay() {
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
export function exportData(showToast) {
  const state = stateManager.getState();
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

export function importData(file, { showToast, onSuccess }) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);

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

      stateManager.initialize({
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
      });

      saveState();
      onSuccess();
      showToast('データを復元しました');
    } catch (err) {
      console.error('Import failed:', err);
      showToast('インポートに失敗しました', 4000);
    }
  };
  reader.readAsText(file);
}

export function loadSampleData({ showToast, onSuccess }) {
  const now = Date.now();
  const dayMs = CONFIG.msPerDay;

  // 相対日数をISO日付文字列に変換
  const daysToDate = (daysAgo) => {
    if (daysAgo === undefined || daysAgo === null) return null;
    const date = new Date(now + daysAgo * dayMs);
    return date.toISOString().split('T')[0];
  };

  const books = SAMPLE_BOOKS.map((book, i) => {
    const id = now - (i * 1000);
    const asin = extractAsinFromUrl(book.link);
    return {
      id,
      title: book.title,
      link: book.link,
      coverUrl: getAmazonImageUrl(asin),
      status: book.status || 'completed',
      startedAt: daysToDate(book.startedAt),
      completedAt: daysToDate(book.completedAt),
      note: book.note || null,
      readingTime: book.status === 'completed' ? 60 + Math.floor(Math.random() * 180) : 0
    };
  });

  // 読書履歴に紐付ける本（reading + completed）
  const readableBooks = books.filter(b => b.status === 'reading' || b.status === 'completed');

  const history = [];
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now - daysAgo * dayMs);
    const hour = 6 + Math.floor(Math.random() * 16);
    date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    const randomBook = readableBooks[Math.floor(Math.random() * readableBooks.length)];
    history.push({
      d: date.toISOString(),
      m: 15 + Math.floor(Math.random() * 45),
      h: hour,
      bookId: randomBook?.id || null
    });
  }
  history.sort((a, b) => new Date(a.d) - new Date(b.d));

  const totalMinutes = history.reduce((sum, h) => sum + h.m, 0);

  stateManager.initialize({
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
      firstSessionDate: history[0]?.d || null
    },
    books,
    history,
    archived: {}
  });

  saveState();
  onSuccess();
  showToast('サンプルデータを読み込みました');
}

export function resetAllData({ showToast, onSuccess }) {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
  stateManager.initialize(createInitialState());
  saveState();
  onSuccess();
  showToast('リセットしました');
}
