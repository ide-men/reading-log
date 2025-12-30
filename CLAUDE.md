# Reading Log

読書記録アプリ。GitHub Pagesでホスティング。

## 技術スタック

- HTML (index.html) + CSS (style.css) + JS (app.js)
- Vanilla JavaScript / 外部依存なし

## ローカルストレージ

**ユーザーデータを失わないこと**

### ストレージキー (V5)

| キー | 内容 |
|------|------|
| `rl_meta` | バージョン情報・作成日 |
| `rl_stats` | 統計（total, sessions, xp, lv, firstSessionDate） |
| `rl_books` | 本のデータ |
| `rl_history` | 読書履歴（90日以内） |
| `rl_archived` | 月別アーカイブ（90日〜1年） |

### マイグレーション

- V4 (`readingLogV4`) からV5への自動マイグレーション対応
- 旧データは `readingLogV4_backup` にバックアップ保存

### 注意事項

- 既存プロパティの削除・リネーム・型変更をしない
- 新プロパティ追加時はデフォルト値を設定
- 履歴は90日を超えると月別サマリーに集約される
