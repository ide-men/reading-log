// ========================================
// Install Prompt - ドメインロジック
// ホーム画面追加のプロンプト表示制御
// ========================================
import { STORAGE_KEYS } from '../shared/constants.js';

/**
 * モバイルデバイスかどうかを判定
 * @returns {boolean}
 */
export function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * iOSデバイスかどうかを判定
 * @returns {boolean}
 */
export function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * スタンドアロンモード（ホーム画面から起動）かどうかを判定
 * @returns {boolean}
 */
export function isStandalone() {
  // iOS Safari
  if (navigator.standalone === true) {
    return true;
  }
  // Android Chrome / その他
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  return false;
}

/**
 * インストールプロンプトが閉じられたかどうかを取得
 * @param {Storage} storage - localStorage互換オブジェクト
 * @returns {boolean}
 */
export function isInstallPromptDismissed(storage = localStorage) {
  try {
    return storage.getItem(STORAGE_KEYS.installPromptDismissed) === 'true';
  } catch {
    return false;
  }
}

/**
 * インストールプロンプトを閉じた状態を保存
 * @param {Storage} storage - localStorage互換オブジェクト
 */
export function dismissInstallPrompt(storage = localStorage) {
  try {
    storage.setItem(STORAGE_KEYS.installPromptDismissed, 'true');
  } catch {
    // ストレージエラーは無視
  }
}

/**
 * インストールプロンプトを表示すべきかどうかを判定
 * @param {Storage} storage - localStorage互換オブジェクト
 * @returns {boolean}
 */
export function shouldShowInstallPrompt(storage = localStorage) {
  // モバイルデバイスでない場合は表示しない
  if (!isMobileDevice()) {
    return false;
  }
  // すでにスタンドアロンモードの場合は表示しない
  if (isStandalone()) {
    return false;
  }
  // 既に閉じている場合は表示しない
  if (isInstallPromptDismissed(storage)) {
    return false;
  }
  return true;
}
