# Reading Log

読書記録アプリ。GitHub Pagesでホスティング。

## 技術スタック

- HTML (index.html) + CSS (style.css) + JS (ES Modules)
- Vanilla JavaScript / 外部依存なし

## ファイル構成

```
js/
├── app.js           # エントリポイント・初期化
├── constants.js     # 定数・設定値（TITLES, QUOTES, COLORS等）
├── state.js         # State Manager（状態管理パターン）
├── storage.js       # 永続化・マイグレーション・バックアップ
├── utils.js         # ユーティリティ関数
├── timer.js         # 読書タイマー管理
├── books.js         # 本のCRUD・レンダリング
├── stats.js         # 統計計算・グラフ表示
├── animations.js    # ボタン・読書画面アニメーション
├── ui.js            # UI操作・モーダル・エフェクト
└── events.js        # イベントリスナー設定
```

## 状態管理

State Managerパターンを採用（`js/state.js`）:

```javascript
import { stateManager } from './state.js';

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
// js/storage.js 内のマイグレーションインフラ
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
