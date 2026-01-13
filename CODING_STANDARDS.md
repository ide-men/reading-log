# コーディング規約

Reading Log プロジェクトのコーディング規約です。

## 目次

1. [JavaScript](#javascript)
2. [CSS](#css)
3. [ファイル構成](#ファイル構成)
4. [アーキテクチャ](#アーキテクチャ)
5. [テスト](#テスト)

---

## JavaScript

### フォーマット

| 項目 | ルール |
|------|--------|
| インデント | 2スペース |
| 引用符 | シングルクォート（`'`） |
| セミコロン | 必須 |
| 行末空白 | 削除 |

### 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| 定数 | UPPER_SNAKE_CASE | `BOOK_STATUS`, `MAX_ITEMS` |
| 変数・関数 | camelCase | `bookTitle`, `getBookById` |
| プライベート | `_` プレフィックス | `_listeners`, `_notifyListeners` |
| クラス | PascalCase | `EventBus`, `StateManager` |
| ファイル | kebab-case | `book-service.js`, `state-manager.js` |

### 関数定義

**通常関数**: エクスポート関数、複雑な処理

```javascript
export function addBook({ title, link, status = BOOK_STATUS.READING }) {
  // ...
}
```

**アロー関数**: ユーティリティ、コールバック、簡潔な処理

```javascript
export const isValidUrl = (str) => str && /^https?:\/\//i.test(str);

items.forEach(item => processItem(item));
```

### パラメータ

**オブジェクト分割代入を活用**

```javascript
// Good
export function createBook({ title, link, status }) {
  // ...
}

// Avoid
export function createBook(title, link, status) {
  // ...
}
```

**デフォルト値**

```javascript
export function createBook(params, options = {}) {
  const { now = () => new Date() } = options;
  // ...
}
```

### 早期リターン

ガード句で早期リターンし、ネストを浅く保つ。

```javascript
export function updateBook(id, updates) {
  const book = getBookById(id);
  if (!book) {
    return { success: false, message: '本が見つかりません' };
  }

  // 正常処理
  return { success: true, book: updatedBook };
}
```

### 戻り値

**操作結果**: `{ success, message, data? }`

```javascript
return { success: true, message: '保存しました', book };
return { success: false, message: 'タイトルは必須です' };
```

**クエリ結果**: 目的に応じたオブジェクト

```javascript
return { isDuplicate: true, duplicateBook };
return { isDuplicate: false };
```

### JSDoc

**関数**

```javascript
/**
 * 新しい本を作成
 * @param {Object} params - 本のデータ
 * @param {string} params.title - タイトル
 * @param {string} [params.link] - リンク（オプション）
 * @returns {Book}
 */
export function createBook({ title, link }) {
  // ...
}
```

**型定義**

```javascript
/**
 * @typedef {Object} Book
 * @property {number} id - ユニークID
 * @property {string} title - タイトル
 * @property {string|null} link - リンク
 * @property {string} status - ステータス
 */
```

**セクション分割**

```javascript
// ========================================
// 本の追加
// ========================================
```

### エラーハンドリング

```javascript
try {
  const data = JSON.parse(rawData);
  return processData(data);
} catch (e) {
  console.error('Failed to parse data:', e);
  return null;
}
```

### インポート/エクスポート

**名前付きエクスポート**（default export は使わない）

```javascript
// Good
export function addBook() {}
export const BOOK_STATUS = {};

// Avoid
export default function addBook() {}
```

**名前空間インポート**: service/repository など

```javascript
import * as bookService from '../domain/book/book-service.js';
import * as bookRepository from '../domain/book/book-repository.js';

bookService.addBook({ title });
```

**シングルトン**

```javascript
class StateManager {
  // ...
}

export const stateManager = new StateManager();
```

### XSS対策

**テキスト出力**: `textContent` を使用

```javascript
element.textContent = userInput;
```

**HTML生成時**: エスケープ関数を使用

```javascript
import { escapeHtml, escapeAttr } from '../shared/utils.js';

return `<div data-title="${escapeAttr(title)}">${escapeHtml(title)}</div>`;
```

---

## CSS

### ファイル構成

| ファイル | 用途 |
|----------|------|
| `base.css` | CSS変数、リセット、基本スタイル |
| `components.css` | ヘッダー、ナビ、フォーム、ボタン、モーダル |
| `shared.css` | 複数ページで使う共通コンポーネント |
| `animations.css` | アニメーション定義 |
| `views/*.css` | ページ固有スタイル |

### BEM命名規則

```css
/* Block */
.book-card {}

/* Element */
.book-card__title {}
.book-card__cover {}

/* Modifier */
.book-card--selected {}
.book-card--compact {}
```

### CSS変数

```css
:root {
  /* Colors */
  --bg: #0a0a0f;
  --surface: #12121a;
  --accent: #e8a87c;
  --text: #f5f5f7;

  /* Spacing */
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;

  /* Typography */
  --font-sm: 12px;
  --font-md: 14px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;

  /* Transitions */
  --transition-fast: 200ms ease-in-out;
}
```

### 共通クラス

| クラス | 用途 |
|--------|------|
| `.page-header` | ページタイトル |
| `.empty-state` | 空状態メッセージ |
| `.shelf` | 本棚コンテナ |
| `.book-card` | 本のカード |
| `.detail-view` | 詳細ビュー |
| `.action-btn` | アクションボタン |

### テーマカラー

| 画面 | カラー |
|------|--------|
| 書斎（読書中） | `#8b5a2b` |
| 本屋（積読） | `#f59e0b` |

### 禁止事項

- 同じスタイルの別名クラス作成
- 後方互換エイリアス
- インラインスタイル多用

---

## ファイル構成

### ディレクトリ構造

```
js/
├── shared/          # 依存なし（最下位）
├── core/            # 状態管理・ストレージ
├── domain/          # ビジネスロジック
│   ├── book/
│   ├── label/
│   ├── stats/
│   └── timer/
├── presentation/    # UI・イベント処理
│   ├── views/
│   ├── controllers/
│   ├── utils/
│   └── effects/
└── app.js
```

### ファイル命名

| サフィックス | 役割 |
|--------------|------|
| `entity.js` | データ構造・バリデーション（純粋関数） |
| `service.js` | ビジネスロジック |
| `repository.js` | 永続化処理 |
| `controller.js` | UI・イベント処理 |
| `view.js` | レンダリング関数 |

---

## アーキテクチャ

### レイヤー依存関係

```
presentation → domain → core → shared
```

**依存ルール**: 上位層は下位層のみに依存可能

| 層 | 依存可能 |
|----|----------|
| shared | なし |
| core | shared |
| domain | core, shared |
| presentation | domain, core, shared |

### 状態管理

`stateManager` で状態を一元管理。

```javascript
// 状態取得
const state = stateManager.getState();

// 状態更新
stateManager.setState({ books: updatedBooks });

// UI状態（永続化しない）
stateManager.setUI('selectedBookId', id);

// リスナー登録
const unsubscribe = stateManager.subscribe((state) => {
  renderBooks();
});
```

### イベント駆動

`eventBus` で層間通信。

```javascript
// 発行
eventBus.emit(Events.BOOK_ADDED, book);

// 購読
eventBus.on(Events.BOOK_ADDED, (book) => {
  showToast(`「${book.title}」を追加しました`);
});
```

### イベント委譲

```javascript
const handlers = [
  {
    selector: '[data-edit]',
    handler: (e, target) => editBook(target.dataset.edit)
  },
  {
    selector: '[data-delete]',
    handler: (e, target) => deleteBook(target.dataset.delete)
  }
];

delegateEvents(container, 'click', handlers);
```

### ストレージ

**キー**: `rl_v1_` プレフィックス

- `rl_v1_meta` - メタ情報
- `rl_v1_books` - 本データ
- `rl_v1_stats` - 統計
- `rl_v1_history` - 履歴
- `rl_v1_archived` - アーカイブ

**マイグレーション**: 既存プロパティの変更時は必須

```javascript
const migrations = {};

migrations[2] = (state) => {
  return { ...state, newField: 'default' };
};
```

---

## テスト

### 基本方針

- コード変更時はテストを書く
- 配置: `tests/` 以下に元ファイルと同じ構造
- 優先度: shared > domain > core > presentation
- DOM依存コードはテスト対象外（E2E向き）

### 実行

```bash
npm test          # 実行
npm run test:watch # ウォッチモード
```

### 書き方

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBook } from '../../js/domain/book/book-entity.js';

describe('createBook', () => {
  it('タイトルから本を作成できる', () => {
    const book = createBook({ title: 'テスト本' });

    expect(book.title).toBe('テスト本');
    expect(book.status).toBe('reading');
  });

  it('タイトルが空の場合はエラー', () => {
    expect(() => createBook({ title: '' })).toThrow();
  });
});
```

### モック

```javascript
vi.mock('../../js/core/state-manager.js', () => ({
  stateManager: {
    getState: vi.fn(() => mockState),
    setState: vi.fn()
  }
}));
```
