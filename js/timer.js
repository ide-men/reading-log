// ========================================
// タイマー管理
// ========================================
import { CONFIG } from './constants.js';
import { stateManager } from './state.js';
import { saveState } from './storage.js';
import { applyReadingAnimation } from './animations.js';
import { getTitle } from './utils.js';
import { showConfetti } from './ui.js';

// タイマー状態
let timer = null;
let seconds = 0;

export function isTimerRunning() {
  return timer !== null;
}

export function getSeconds() {
  return seconds;
}

export function startReading() {
  if (timer) return;

  seconds = 0;
  applyReadingAnimation();
  document.getElementById('readingScreen').classList.add('active');
  timer = setInterval(() => seconds++, 1000);
  document.getElementById('startBtn').innerHTML =
    '<span class="main-btn-icon anim-relax">📖</span><span>読書中...</span>';
}

export function stopReading({ onLevelUp, onTitleUp, onComplete }) {
  clearInterval(timer);
  timer = null;
  document.getElementById('readingScreen').classList.remove('active');

  const minutes = Math.floor(seconds / 60);
  const state = stateManager.getState();

  stateManager.updateStats({
    total: state.stats.total + minutes,
    today: state.stats.today + minutes
  });

  if (minutes >= CONFIG.minSessionMinutes) {
    const currentState = stateManager.getState();
    const updates = {
      sessions: currentState.stats.sessions + 1
    };

    if (!currentState.stats.firstSessionDate) {
      updates.firstSessionDate = new Date().toISOString();
    }

    stateManager.updateStats(updates);
    stateManager.addHistory({
      d: new Date().toISOString(),
      m: minutes,
      h: new Date().getHours()
    });

    const xpAmount = 1 + Math.floor(minutes / 10);
    const { oldLevel, newLevel, leveledUp } = stateManager.addXP(xpAmount);

    if (leveledUp) {
      onLevelUp(newLevel);
      showConfetti();

      const oldTitle = getTitle(oldLevel);
      const newTitle = getTitle(newLevel);
      if (newTitle.name !== oldTitle.name) {
        setTimeout(() => onTitleUp(newTitle), 2000);
      }
    }
  }

  document.getElementById('startBtn').innerHTML =
    '<span class="main-btn-icon">📖</span><span>読書をはじめる</span>';
  seconds = 0;

  saveState();
  onComplete();
}

export function toggleReading(callbacks) {
  if (timer) {
    stopReading(callbacks);
  } else {
    startReading();
  }
}
