// ========================================
// UI操作・モーダル・エフェクト
// ========================================
import { QUOTES } from './constants.js';
import { randomItem } from './utils.js';
import { updateButtonAnimation } from './animations.js';
import { saveState } from './storage.js';

// FAB要素
let fab = null;

// タブ切り替え時のコールバック
let tabCallbacks = {};

export function getFab() {
  return fab;
}

export function setFab(element) {
  fab = element;
}

export function setTabCallbacks(callbacks) {
  tabCallbacks = callbacks;
}

// ========================================
// タブ・ナビゲーション
// ========================================
export function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));

  document.getElementById(`tab-${name}`).classList.add('active');
  document.querySelector(`.nav button[data-tab="${name}"]`).classList.add('active');

  if (fab) {
    fab.style.display = name === 'books' ? 'flex' : 'none';
  }

  if (tabCallbacks[name]) {
    tabCallbacks[name]();
  }
}

// ========================================
// UI更新
// ========================================
export function updateUI() {
  const quote = randomItem(QUOTES);
  document.getElementById('quoteText').textContent = quote.text;
  document.getElementById('quoteAuthor').textContent = `— ${quote.author}`;

  updateButtonAnimation();
  saveState();
}

// ========================================
// モーダル
// ========================================
export function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

export function openModal(id) {
  document.getElementById(id).classList.add('active');
}

// ========================================
// レベルアップ・称号表示
// ========================================
export function showLevelUp(level) {
  document.getElementById('newLevel').textContent = `Lv.${level}`;
  document.getElementById('levelupOverlay').classList.add('active');
  showConfetti();
}

export function showTitleUp(title) {
  document.getElementById('newTitleIcon').textContent = title.icon;
  document.getElementById('newTitleName').textContent = title.name;
  document.getElementById('newTitleSub').textContent = title.sub;
  document.getElementById('titleOverlay').classList.add('active');
}

// ========================================
// エフェクト
// ========================================
export function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

export function showConfetti() {
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
