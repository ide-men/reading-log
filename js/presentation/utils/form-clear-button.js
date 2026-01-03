/**
 * テキスト入力フィールドにクリアボタンを追加するユーティリティ
 *
 * 使い方:
 * initClearButton('inputId') または
 * initClearButtons(['inputId1', 'inputId2'])
 */

/**
 * 単一の入力フィールドにクリアボタンを追加
 * @param {string} inputId - 入力フィールドのID
 */
export function initClearButton(inputId) {
  const input = document.getElementById(inputId);
  if (!input || input.type === 'hidden' || input.tagName === 'SELECT') {
    return;
  }

  // 既にラップ済みの場合はスキップ
  if (input.parentElement?.classList.contains('form-input-wrapper')) {
    return;
  }

  // ラッパーを作成
  const wrapper = document.createElement('div');
  wrapper.className = 'form-input-wrapper';

  // クリアボタンを作成
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'form-input-clear';
  clearBtn.setAttribute('aria-label', '入力をクリア');
  clearBtn.innerHTML = '×';

  // inputをラッパーで囲む
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);
  wrapper.appendChild(clearBtn);

  // クリアボタンの表示/非表示を制御
  const updateClearButtonVisibility = () => {
    if (input.value.length > 0) {
      clearBtn.classList.add('form-input-clear--visible');
    } else {
      clearBtn.classList.remove('form-input-clear--visible');
    }
  };

  // イベントリスナー
  input.addEventListener('input', updateClearButtonVisibility);

  // MutationObserverでvalue属性の変更を監視（JavaScriptから値が設定された場合）
  const observer = new MutationObserver(() => {
    updateClearButtonVisibility();
  });
  observer.observe(input, { attributes: true, attributeFilter: ['value'] });

  // valueプロパティの変更も検知（inputイベントが発火しない場合のため）
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  if (descriptor) {
    Object.defineProperty(input, 'value', {
      get: function() {
        return descriptor.get.call(this);
      },
      set: function(val) {
        descriptor.set.call(this, val);
        updateClearButtonVisibility();
      },
      configurable: true
    });
  }

  clearBtn.addEventListener('click', () => {
    input.value = '';
    updateClearButtonVisibility();
    input.focus();
    // inputイベントを発火してバリデーションなどをトリガー
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // 初期状態を設定
  updateClearButtonVisibility();
}

/**
 * 複数の入力フィールドにクリアボタンを追加
 * @param {string[]} inputIds - 入力フィールドIDの配列
 */
export function initClearButtons(inputIds) {
  inputIds.forEach(id => initClearButton(id));
}
