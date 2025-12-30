# Reading Log - 開発ガイドライン

## プロジェクト概要

読書記録アプリ（シングルページHTML）

## ローカルストレージのルール

### 重要: ユーザーデータを絶対に失わないこと

ローカルストレージにはユーザーの読書記録が保存されています。以下のルールを厳守してください。

### 禁止事項

1. **`STORAGE_KEY` の値を変更しない**
   - 現在のキー: `'readingLogV4'`
   - キーを変更すると既存ユーザーのデータが読み込めなくなる

2. **既存プロパティの削除・リネームをしない**
   - `state` オブジェクトの既存プロパティ構造を維持する
   - プロパティ名の変更は破壊的変更となる

3. **データ型を変更しない**
   - 例: 配列を文字列に変更する、数値を文字列に変更するなど

### 許可される変更

1. **新しいプロパティの追加** (デフォルト値必須)
   ```javascript
   // loadState() 内でデフォルト値を設定する
   const parsed = JSON.parse(saved);
   return {
     ...createInitialState(),  // デフォルト値
     ...parsed                  // 保存されたデータで上書き
   };
   ```

2. **UI/表示ロジックの変更**
   - データ構造に影響しない変更は自由

3. **新機能の追加**
   - 新しいプロパティとして追加し、既存データとの後方互換性を保つ

### データ構造を変更する場合のチェックリスト

- [ ] 既存の `STORAGE_KEY` は変更していないか？
- [ ] 既存プロパティの名前・型は維持されているか？
- [ ] 新しいプロパティにはデフォルト値が設定されているか？
- [ ] `loadState()` で古いデータ形式を正しく読み込めるか？
- [ ] 変更後、既存データでアプリが正常動作するかテストしたか？

### マイグレーションが必要な場合

やむを得ずデータ構造を大きく変更する場合は、マイグレーション処理を実装すること:

```javascript
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    // バージョンチェックとマイグレーション
    if (!parsed.version || parsed.version < CURRENT_VERSION) {
      return migrateState(parsed);
    }
    return parsed;
  }
  return createInitialState();
}
```

## 技術スタック

- 単一HTMLファイル (index.html)
- Vanilla JavaScript
- CSS (インライン)
- 外部依存なし

## デプロイ

GitHub Pages で静的ホスティング
