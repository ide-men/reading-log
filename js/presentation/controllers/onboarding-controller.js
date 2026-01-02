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
  const backBtn = document.getElementById('onboardingBack');
  const totalSteps = getTotalSteps();

  if (currentStep === totalSteps) {
    nextBtn.textContent = 'はじめる';
  } else {
    nextBtn.textContent = '次へ';
  }

  // 最初のステップでは戻るボタンを非表示
  if (currentStep === 1) {
    backBtn.style.display = 'none';
  } else {
    backBtn.style.display = '';
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
 * 前のステップに戻る
 */
function goToPrevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepDisplay();
  }
}

/**
 * オンボーディングイベントの初期化
 */
export function initOnboardingEvents() {
  const nextBtn = document.getElementById('onboardingNext');
  const backBtn = document.getElementById('onboardingBack');

  if (nextBtn) {
    nextBtn.addEventListener('click', goToNextStep);
  }

  if (backBtn) {
    backBtn.addEventListener('click', goToPrevStep);
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
