# Reading Log

読書記録アプリ。GitHub Pagesでホスティング。

## 技術スタック

- HTML + CSS + JS (ES Modules)
- Vanilla JavaScript / 外部依存なし

## アーキテクチャ

レイヤードアーキテクチャ: `presentation` → `domain` → `core` → `shared`

| 層 | 依存可能 |
|----|----------|
| shared | なし |
| core | shared |
| domain | core, shared |
| presentation | domain, core, shared |

## 状態管理

`stateManager` (`js/core/state-manager.js`) で状態を一元管理。
`eventBus` (`js/shared/event-bus.js`) で層間通信。

## ローカルストレージ

**ユーザーデータを失わないこと**

ストレージキー: `rl_v1_meta`, `rl_v1_stats`, `rl_v1_books`, `rl_v1_history`, `rl_v1_archived`

- 既存プロパティの削除・リネーム・型変更時はマイグレーション関数を用意
- 新プロパティ追加時はデフォルト値を設定

## CSS設計

- **命名規則**: BEM (`.block__element--modifier`)
- **共通クラス**: `.page-header`, `.empty-state`, `.shelf`, `.book-card`, `.detail-view`, `.action-btn`
- **定義場所**: 複数ページ→`shared.css` / 特定ページ→`views/*.css` / ユーティリティ→`base.css`
- **テーマカラー**: 書斎=`#8b5a2b` / 本屋=`#f59e0b`
- **禁止事項**: 同じスタイルの別名クラス作成、後方互換エイリアス、インラインスタイル多用
