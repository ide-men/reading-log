# Reading Log

読書記録アプリ。GitHub Pagesでホスティング。

## 技術スタック

- HTML (index.html) + CSS (style.css) + JS (ES Modules)
- Vanilla JavaScript / 外部依存なし

## アーキテクチャ

レイヤードアーキテクチャを採用:

```
┌─────────────────────────────────────────┐
│  presentation/   # プレゼンテーション層  │
│  - views/        # HTMLレンダリング       │
│  - controllers/  # イベントハンドラ       │
│  - effects/      # アニメーション         │
└──────────────┬──────────────────────────┘
               ↓
┌──────────────────────────────────────────┐
│  domain/         # ドメイン層            │
│  - book/         # 本のビジネスロジック   │
│  - timer/        # タイマーロジック       │
│  - stats/        # 統計計算              │
└──────────────┬───────────────────────────┘
               ↓
┌──────────────────────────────────────────┐
│  core/           # 基盤層                │
│  - state-manager # 状態管理              │
│  - storage       # 永続化                │
└──────────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────┐
│  shared/         # 共有                  │
│  - constants     # 定数                  │
│  - utils         # ユーティリティ         │
│  - event-bus     # イベント通知          │
└──────────────────────────────────────────┘
```

## ファイル構成

```
js/
├── app.js                    # エントリポイント
├── sample-data.js            # サンプル書籍データ
│
├── shared/                   # 共有（依存なし）
│   ├── constants.js          # 定数・設定値
│   ├── utils.js              # ユーティリティ関数
│   └── event-bus.js          # アプリ内イベント通知
│
├── core/                     # 基盤層
│   ├── state-manager.js      # 状態管理
│   └── storage.js            # 永続化・マイグレーション
│
├── domain/                   # ドメイン層（純粋なビジネスロジック）
│   ├── book/
│   │   ├── book-entity.js    # Book型定義・バリデーション
│   │   ├── book-service.js   # CRUD・ステータス遷移
│   │   └── book-repository.js # stateManagerアクセス抽象化
│   ├── timer/
│   │   └── timer-service.js  # タイマーロジック
│   └── stats/
│       └── stats-service.js  # 統計計算
│
└── presentation/             # プレゼンテーション層
    ├── views/
    │   ├── carousel-view.js  # カバン（カルーセル）
    │   ├── study-view.js     # 書斎
    │   ├── store-view.js     # 本屋
    │   ├── stats-view.js     # 統計
    │   └── shared.js         # 共通レンダリング関数
    ├── controllers/
    │   ├── navigation.js     # ナビ・モーダル・設定
    │   ├── timer-controller.js # タイマー制御
    │   └── book-controller.js  # 本のCRUD制御
    └── effects/
        ├── animations.js     # ボタン・読書アニメーション
        └── celebrations.js   # セレブレーション・パーティクル
```

## 層間の依存ルール

| 層 | 依存可能 |
|----|----------|
| shared | なし |
| core | shared |
| domain | core, shared |
| presentation | domain, core, shared |
| app.js | 全層 |

## 状態管理

State Managerパターンを採用（`js/core/state-manager.js`）:

```javascript
import { stateManager } from './core/state-manager.js';

// 状態の取得
const state = stateManager.getState();

// 状態の更新（自動的にストレージに保存）
stateManager.updateStats({ total: 100 });
stateManager.addBook({ id: Date.now(), title: '...' });

// 変更の購読
stateManager.subscribe((newState) => {
  // 状態変更時のコールバック
});
```

## イベントバス

循環依存を避けるため、層間通信にEventBusを使用:

```javascript
import { eventBus, Events } from './shared/event-bus.js';

// イベント発行
eventBus.emit(Events.BOOK_ADDED, { book });

// イベント購読
eventBus.on(Events.BOOK_ADDED, (data) => {
  // 処理
});
```

## ローカルストレージ

**ユーザーデータを失わないこと**

### ストレージキー (Schema V1)

| キー | 内容 |
|------|------|
| `rl_v1_meta` | スキーマバージョン・作成日 |
| `rl_v1_stats` | 統計（total, today, date, sessions, xp, lv, firstSessionDate） |
| `rl_v1_books` | 本のデータ |
| `rl_v1_history` | 読書履歴（90日以内） |
| `rl_v1_archived` | 月別アーカイブ（90日〜1年） |

### 履歴のライフサイクル

1. **0〜90日**: `history` に詳細データ `{ d, m, h }` を保持
2. **90日〜1年**: `archived` に月別サマリー `{ sessions, totalMinutes }` として集約
3. **1年超**: 削除

### マイグレーションの仕組み

```javascript
// js/core/storage.js 内のマイグレーションインフラ
const migrations = {};

// 将来 V2 に移行する際の例:
// migrations[2] = (state) => {
//   // V1 -> V2 の変換処理
//   return newState;
// };
```

- `SCHEMA_VERSION` を上げ、`migrations[新バージョン]` に変換関数を登録
- `runMigrations()` が順次実行し、複数バージョン間のマイグレーションに対応
- キー名にバージョン番号を含めるため（`rl_v1_*`）、必要なら新キーへの移行も可能

### 注意事項

- 既存プロパティの削除・リネーム・型変更をする場合はマイグレーション関数を用意
- 新プロパティ追加時はデフォルト値を設定
