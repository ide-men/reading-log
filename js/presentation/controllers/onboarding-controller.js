// ========================================
// Onboarding Controller
// 初回起動時のオンボーディング表示制御
// ========================================
import { openModal, closeModal } from './navigation.js';
import {
  isOnboardingCompleted,
  markOnboardingCompleted,
  getNextStep,
  getTotalSteps
} from '../../domain/onboarding.js';

const MODAL_ID = 'onboardingModal';
let currentStep = 1;

/**
 * ステップ表示を更新
 */
function updateStepDisplay() {
  // ステップの表示切り替え
  document.querySelectorAll('.onboarding-step').forEach(step => {
    step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
  });

  // ドットの更新
  document.querySelectorAll('.onboarding-dot').forEach(dot => {
    dot.classList.toggle('active', parseInt(dot.dataset.dot) === currentStep);
  });

  // ボタンテキストの更新
  const nextBtn = document.getElementById('onboardingNext');
  const skipBtn = document.getElementById('onboardingSkip');
  const totalSteps = getTotalSteps();

  if (currentStep === totalSteps) {
    nextBtn.textContent = 'はじめる';
    skipBtn.style.display = 'none';
  } else {
    nextBtn.textContent = '次へ';
    skipBtn.style.display = '';
  }
}

/**
 * オンボーディングを完了
 */
function completeOnboarding() {
  markOnboardingCompleted();
  closeModal(MODAL_ID);
  currentStep = 1;

  // 最初の本を追加するモーダルを開く
  const addBookModal = document.getElementById('addBookModal');
  if (addBookModal) {
    openModal('addBookModal');
  }
}

/**
 * 次のステップへ進む
 */
function goToNextStep() {
  const { nextStep, isLastStep } = getNextStep(currentStep);

  if (isLastStep) {
    completeOnboarding();
  } else {
    currentStep = nextStep;
    updateStepDisplay();
  }
}

/**
 * オンボーディングをスキップ
 */
function skipOnboarding() {
  markOnboardingCompleted();
  closeModal(MODAL_ID);
  currentStep = 1;
}

/**
 * オンボーディングイベントの初期化
 */
export function initOnboardingEvents() {
  const nextBtn = document.getElementById('onboardingNext');
  const skipBtn = document.getElementById('onboardingSkip');

  if (nextBtn) {
    nextBtn.addEventListener('click', goToNextStep);
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', skipOnboarding);
  }
}

/**
 * オンボーディングの表示（初回のみ）
 */
export function showOnboardingIfNeeded() {
  if (!isOnboardingCompleted()) {
    currentStep = 1;
    updateStepDisplay();
    openModal(MODAL_ID);
  }
}

/**
 * オンボーディングを強制表示（設定から呼び出し用）
 */
export function showOnboarding() {
  currentStep = 1;
  updateStepDisplay();
  openModal(MODAL_ID);
}
