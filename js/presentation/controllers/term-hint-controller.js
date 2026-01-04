// ========================================
// Term Hint Controller
// 用語ヒントポップアップの制御
// ========================================

// ========================================
// 用語定義
// ========================================
const TERMS = {
  bag: {
    icon: '🎒',
    name: 'カバン',
    desc: '今読んでいる本を入れる場所。カバンに入れた本は読書タイマーで時間を計測できます。'
  },
  study: {
    icon: '🏠',
    name: '書斎',
    desc: 'あなたの本棚。紙の本も電子書籍もなんでも記録OK。📚未読（まだ読んでない本）、✅読了（読み終えた本）、⏸️中断（途中でやめた本）の3つで管理できます。'
  },
  store: {
    icon: '🏪',
    name: '本屋',
    desc: '気になる本のウィッシュリスト。「いつか読みたい」本をメモしておけます。'
  },
  reading: {
    icon: '📖',
    name: '読書中',
    desc: 'カバンに入っていて、今読み進めている本のこと。'
  },
  unread: {
    icon: '📚',
    name: '未読',
    desc: '買ったけどまだ読んでいない本。書斎で管理して「次に何を読むか」を決めやすく。'
  },
  completed: {
    icon: '✅',
    name: '読了',
    desc: '最後まで読み終えた本。読了時に感想を残すと、後で振り返れます。'
  },
  dropped: {
    icon: '⏸️',
    name: '中断',
    desc: '途中で読むのをやめた本。どこまで読んだかメモを残せるので、再開しやすい。'
  },
  wishlist: {
    icon: '💭',
    name: '気になる',
    desc: '本屋にある「いつか読みたい」本。手に入れたら書斎の未読に移動します。'
  },
  timer: {
    icon: '⏱️',
    name: '読書タイマー',
    desc: 'カバンの本を選んで「読む」を押すと計測開始。読書時間が記録されます。'
  },
  streak: {
    icon: '🔥',
    name: 'ストリーク',
    desc: '連続で読書した日数。毎日少しでも読むと継続できます。'
  },
  calendar: {
    icon: '📅',
    name: '読書カレンダー',
    desc: 'いつ、どれくらい読んだかを色の濃さで表示。GitHubの草のような見た目です。'
  }
};

// 現在表示中のポップアップ
let activePopup = null;
// イベントリスナーが登録済みかどうか
let isOutsideClickListenerActive = false;
let isInitialized = false;

// ========================================
// ツールチップを表示
// ========================================
function showTermHint(termKey, anchorElement) {
  const term = TERMS[termKey];
  if (!term) return;

  // 既存のポップアップを閉じる
  closeTermHint();

  const popup = document.createElement('div');
  popup.className = 'term-hint-popup';
  popup.innerHTML = `
    <button class="term-hint-popup__close" aria-label="閉じる">×</button>
    <div class="term-hint-popup__title">
      <span>${term.icon}</span>
      <span>${term.name}</span>
    </div>
    <div class="term-hint-popup__desc">${term.desc}</div>
  `;

  document.body.appendChild(popup);
  activePopup = popup;

  // 位置を計算
  const rect = anchorElement.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();

  let top = rect.bottom + 8;
  let left = rect.left + (rect.width / 2) - (popupRect.width / 2);

  // 画面外にはみ出さないように調整
  if (left < 8) left = 8;
  if (left + popupRect.width > window.innerWidth - 8) {
    left = window.innerWidth - popupRect.width - 8;
  }
  if (top + popupRect.height > window.innerHeight - 8) {
    top = rect.top - popupRect.height - 8;
  }

  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;

  // 閉じるボタン
  popup.querySelector('.term-hint-popup__close').addEventListener('click', closeTermHint);

  // 外側クリックで閉じる（二重登録を防止）
  if (!isOutsideClickListenerActive) {
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
      isOutsideClickListenerActive = true;
    }, 0);
  }
}

// ========================================
// ツールチップを閉じる
// ========================================
function closeTermHint() {
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }
  if (isOutsideClickListenerActive) {
    document.removeEventListener('click', handleOutsideClick);
    isOutsideClickListenerActive = false;
  }
}

function handleOutsideClick(e) {
  if (activePopup && !activePopup.contains(e.target) && !e.target.classList.contains('term-hint')) {
    closeTermHint();
  }
}

// ========================================
// イベント初期化
// ========================================
export function initTermHintEvents() {
  // 二重初期化を防止
  if (isInitialized) return;
  isInitialized = true;

  // 用語ヒントボタンのクリックイベント（委譲）
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('term-hint')) {
      e.stopPropagation();
      const termKey = e.target.dataset.term;
      if (termKey) {
        showTermHint(termKey, e.target);
      }
    }
  });
}
