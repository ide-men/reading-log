# Reading Log アーキテクチャ決定記録

## 現状

- Vanilla JavaScript + LocalStorage
- GitHub Pagesでホスティング
- 認証なし、サーバーなし

## 目標

- サーバー・DB導入でユーザーごとのデータ管理
- ソーシャル機能（本棚シェア、感想共有）
- 収益化（アフィリエイト）

---

## 技術選定

### 決定: Next.js + Supabase + Vercel

| 層 | 技術 | 理由 |
|----|------|------|
| フロントエンド | Next.js (App Router) | SSR/OGP生成にサーバー機能が必要 |
| バックエンド | Supabase | 認証・DB・リアルタイムが揃っている |
| ホスティング | Vercel | Next.jsとの相性、OGP画像生成 |
| 認証 | Supabase Auth | Google認証が簡単 |
| DB | Supabase (PostgreSQL) | RLSでセキュア、SQLが使える |

### 却下した選択肢

| 選択肢 | 却下理由 |
|--------|---------|
| Vite + Supabase | 公開ページのSSR/OGPが困難 |
| Firebase | 読み書き課金でスケール時に高コスト |
| Next.jsのみ | リアルタイム機能の実装が大変 |

---

## 主要機能と技術マッピング

| 機能 | 実現方法 |
|------|---------|
| 認証 | Supabase Auth (Google, Email) |
| 本の管理 | Supabase DB + RLS |
| 読書タイマー | クライアント + Supabase保存 |
| 統計 | PostgreSQLで集計 |
| 公開本棚 | Next.js SSR |
| SNSシェア | Next.js OGP動的生成 (@vercel/og) |
| 通知 | Supabase Realtime |
| アフィリエイト | Amazonアソシエイトリンク |

---

## 料金見込み

| 規模 | Supabase | Vercel | 月額計 |
|------|----------|--------|--------|
| 〜1,000人 | 無料 | 無料 | $0 |
| 〜10,000人 | $25 | 無料 | $25 |
| 〜100,000人 | $25+従量 | $20 | $50-100 |

---

## 移行フェーズ

```
Phase 1: 基本機能
├── Next.js + Supabase セットアップ
├── 認証（Google, Email）
├── 本のCRUD
├── 読書タイマー
└── 統計

Phase 2: ソーシャル基盤
├── ユーザープロフィール
├── 公開/非公開設定
└── 公開本棚ページ (SSR)

Phase 3: シェア機能
├── シェアリンク生成
├── OGP動的生成
└── SNS連携

Phase 4: フレンド機能
├── フレンド申請・承認
├── フレンドの本棚閲覧
└── アクティビティフィード

Phase 5: 収益化
├── Amazonアソシエイト連携
├── 利用規約・プライバシーポリシー
└── 特定商取引法表示
```

---

## DBスキーマ概要

```
users (Supabase Auth管理)
profiles (username, display_name, bio, is_public)
books (title, link, cover_url, status, reading_time, is_public)
labels (name)
book_labels (book_id, label_id)
reading_history (book_id, recorded_at, minutes)
user_stats (total_minutes, sessions, xp, lv)
friendships (requester_id, addressee_id, status)
reviews (book_id, content, rating, is_public)
likes (user_id, review_id)
```

---

## 技術スタック詳細

```
フレームワーク:  Next.js 14+ (App Router)
言語:           TypeScript (strict)
スタイル:       Tailwind CSS
状態管理:       Zustand
データ取得:     TanStack Query
フォーム:       React Hook Form + Zod
ORM:            なし（Supabase SDK直接）
認証:           Supabase Auth
DB:             Supabase (PostgreSQL)
ホスティング:   Vercel
```

---

## 次のアクション

1. Supabaseプロジェクト作成
2. Next.jsプロジェクト作成（Vite + React + TS テンプレート）
3. Supabase認証の実装
4. DBテーブル作成
5. 既存機能の移植開始
