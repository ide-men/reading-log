# Reading Log

読書記録アプリ。GitHub Pagesでホスティング。

## 技術スタック

- HTML (index.html) + CSS (style.css) + JS (app.js)
- Vanilla JavaScript / 外部依存なし

## ローカルストレージ

**ユーザーデータを失わないこと**

### ストレージキー (Schema V1)

| キー | 内容 |
|------|------|
| `rl_v1_meta` | スキーマバージョン・作成日 |
| `rl_v1_stats` | 統計（total, today, date, sessions, xp, lv, firstSessionDate） |
| `rl_v1_books` | 本のデータ |
| `rl_v1_history` | 読書履歴（90日以内） |

### マイグレーションの仕組み

```javascript
// app.js 内のマイグレーションインフラ
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
- 履歴は90日を超えると自動削除される
