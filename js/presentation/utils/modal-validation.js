// ========================================
// モーダルバリデーションユーティリティ
// 必須項目・任意項目の入力状態に応じてボタンを制御
// ========================================

/**
 * モーダルのバリデーション設定
 * @typedef {Object} ModalValidationConfig
 * @property {string} modalId - モーダルのID
 * @property {string} buttonId - アクションボタンのID
 * @property {string[]} requiredFields - 必須フィールドのID配列
 * @property {string[]} optionalFields - 任意フィールドのID配列（任意のみのモーダル用）
 */

// アクティブなオブザーバーを追跡（モーダルID -> observer）
const activeObservers = new Map();

/**
 * モーダルバリデーションを初期化
 * @param {ModalValidationConfig} config
 * @returns {Function} クリーンアップ関数
 */
export function initModalValidation(config) {
  const { modalId, buttonId, requiredFields = [], optionalFields = [] } = config;

  const button = document.getElementById(buttonId);
  if (!button) return () => {};

  const allFieldIds = [...requiredFields, ...optionalFields];
  const fields = allFieldIds
    .map(id => document.getElementById(id))
    .filter(el => el !== null);

  // バリデーション関数
  const validate = () => {
    const isValid = validateModalFields(requiredFields, optionalFields);
    button.disabled = !isValid;
  };

  // 各フィールドにイベントリスナーを追加
  fields.forEach(field => {
    field.addEventListener('input', validate);
  });

  // 初期状態でバリデーション
  validate();

  // 既存のオブザーバーがあれば解放
  if (activeObservers.has(modalId)) {
    activeObservers.get(modalId).disconnect();
    activeObservers.delete(modalId);
  }

  // モーダルが開かれた時にバリデーションを実行するためのオブザーバー
  const modal = document.getElementById(modalId);
  if (modal) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          if (modal.classList.contains('active')) {
            // モーダルが開かれた時、少し遅延してバリデーション
            setTimeout(validate, 0);
          }
        }
      });
    });
    observer.observe(modal, { attributes: true });
    activeObservers.set(modalId, observer);

    // クリーンアップ関数を返す
    return () => {
      observer.disconnect();
      activeObservers.delete(modalId);
      fields.forEach(field => {
        field.removeEventListener('input', validate);
      });
    };
  }

  return () => {
    fields.forEach(field => {
      field.removeEventListener('input', validate);
    });
  };
}

/**
 * フィールドのバリデーション
 * @param {string[]} requiredFields - 必須フィールドのID配列
 * @param {string[]} optionalFields - 任意フィールドのID配列
 * @returns {boolean} - バリデーション結果
 */
export function validateModalFields(requiredFields, optionalFields) {
  // 必須フィールドがある場合
  if (requiredFields.length > 0) {
    // すべての必須フィールドに値があるかチェック
    return requiredFields.every(id => {
      const field = document.getElementById(id);
      return field && field.value.trim() !== '';
    });
  }

  // 任意フィールドのみの場合
  if (optionalFields.length > 0) {
    // いずれかの任意フィールドに値があるかチェック
    return optionalFields.some(id => {
      const field = document.getElementById(id);
      return field && field.value.trim() !== '';
    });
  }

  return true;
}

/**
 * 手動でバリデーションを実行
 * @param {string} buttonId - ボタンのID
 * @param {string[]} requiredFields - 必須フィールドのID配列
 * @param {string[]} optionalFields - 任意フィールドのID配列
 */
export function updateButtonState(buttonId, requiredFields = [], optionalFields = []) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  const isValid = validateModalFields(requiredFields, optionalFields);
  button.disabled = !isValid;
}
