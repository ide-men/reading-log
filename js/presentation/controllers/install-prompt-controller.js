// ========================================
// Install Prompt Controller
// ホーム画面追加バナーの表示制御
// ========================================
import {
  shouldShowInstallPrompt,
  dismissInstallPrompt,
  isIOS
} from '../../domain/install-prompt.js';

const BANNER_ID = 'installPromptBanner';
const SHOW_DELAY = 3000; // 3秒後に表示

/**
 * バナーを表示
 */
function showBanner() {
  const banner = document.getElementById(BANNER_ID);
  if (banner) {
    banner.classList.add('visible');
  }
}

/**
 * バナーを非表示にして状態を保存
 */
function hideBanner() {
  const banner = document.getElementById(BANNER_ID);
  if (banner) {
    banner.classList.remove('visible');
  }
  dismissInstallPrompt();
}

/**
 * OS別の説明テキストを設定
 */
function setInstructionText() {
  const instructionEl = document.getElementById('installPromptInstruction');
  if (!instructionEl) return;

  if (isIOS()) {
    instructionEl.innerHTML = '<span class="install-prompt__step">共有ボタン</span> → <span class="install-prompt__step">ホーム画面に追加</span>';
  } else {
    instructionEl.innerHTML = '<span class="install-prompt__step">メニュー（⋮）</span> → <span class="install-prompt__step">ホーム画面に追加</span>';
  }
}

/**
 * イベントリスナーを設定
 */
function initEvents() {
  const closeBtn = document.getElementById('installPromptClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideBanner);
  }
}

/**
 * インストールプロンプトの初期化
 */
export function initInstallPrompt() {
  if (!shouldShowInstallPrompt()) {
    return;
  }

  setInstructionText();
  initEvents();

  // 少し遅延してから表示（UX向上）
  setTimeout(showBanner, SHOW_DELAY);
}
