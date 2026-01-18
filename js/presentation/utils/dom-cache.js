// ========================================
// DOM Cache
// DOM要素のキャッシュユーティリティ
// ========================================

/**
 * DOM要素のキャッシュを作成
 * 同じ要素への繰り返しアクセスを効率化
 *
 * @example
 * const elements = createDOMCache({
 *   startBtn: 'startBtn',
 *   completeBtn: 'completeSelectedBtn'
 * });
 *
 * // 使用時
 * elements.startBtn.addEventListener('click', handleClick);
 *
 * @param {Object.<string, string>} idMap - キー名とDOM IDのマッピング
 * @returns {Object} プロパティアクセス時にDOM要素を取得するProxy
 */
export function createDOMCache(idMap) {
  const cache = new Map();

  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'clear') {
        return () => cache.clear();
      }
      if (prop === 'refresh') {
        return (key) => {
          if (key) {
            cache.delete(key);
          } else {
            cache.clear();
          }
        };
      }

      const id = idMap[prop];
      if (!id) return undefined;

      if (!cache.has(prop)) {
        cache.set(prop, document.getElementById(id));
      }
      return cache.get(prop);
    }
  });
}

/**
 * 複数のDOM要素を一括取得（従来の方法のヘルパー）
 * @param {...string} ids - 取得するDOM要素のID
 * @returns {Object.<string, HTMLElement|null>} IDをキーとした要素のオブジェクト
 */
export function getElements(...ids) {
  const result = {};
  for (const id of ids) {
    result[id] = document.getElementById(id);
  }
  return result;
}

/**
 * クエリセレクタで複数要素を取得してキャッシュ
 * @param {Object.<string, string>} selectorMap - キー名とセレクタのマッピング
 * @returns {Object} プロパティアクセス時にDOM要素を取得するProxy
 */
export function createQueryCache(selectorMap) {
  const cache = new Map();

  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'clear') {
        return () => cache.clear();
      }
      if (prop === 'refresh') {
        return (key) => {
          if (key) {
            cache.delete(key);
          } else {
            cache.clear();
          }
        };
      }

      const selector = selectorMap[prop];
      if (!selector) return undefined;

      if (!cache.has(prop)) {
        cache.set(prop, document.querySelector(selector));
      }
      return cache.get(prop);
    }
  });
}
