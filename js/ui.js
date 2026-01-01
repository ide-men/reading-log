// ========================================
// UI操作・モーダル・エフェクト
// ========================================
import { QUOTES } from './constants.js';
import { randomItem } from './utils.js';
import { updateButtonAnimation } from './animations.js';
import { saveState } from './storage.js';

// タブ切り替え時のコールバック
let tabCallbacks = {};

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
// エフェクト
// ========================================
export function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}
