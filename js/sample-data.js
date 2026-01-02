// ========================================
// サンプルデータ
// ========================================

// サンプル書籍データ（各ステータスのパターン）
export const SAMPLE_BOOKS = [
  // reading（カバン）- 今読んでいる本
  { title: '人を動かす', link: 'https://www.amazon.co.jp/dp/442210098X', status: 'reading', startedAt: -5 },
  { title: '嫌われる勇気', link: 'https://www.amazon.co.jp/dp/4478025819', status: 'reading', startedAt: -2 },

  // completed（書斎・読了）- 読み終わった本
  { title: '7つの習慣', link: 'https://www.amazon.co.jp/dp/4863940246', status: 'completed', startedAt: -60, completedAt: -30 },
  { title: '夜と霧', link: 'https://www.amazon.co.jp/dp/4622039702', status: 'completed', startedAt: -45, completedAt: -20 },
  { title: 'FACTFULNESS', link: 'https://www.amazon.co.jp/dp/4822289605', status: 'completed', startedAt: -30, completedAt: -10 },
  { title: '思考の整理学', link: 'https://www.amazon.co.jp/dp/4480020470', status: 'completed', startedAt: -25, completedAt: -7 },
  { title: 'サピエンス全史（上）', link: 'https://www.amazon.co.jp/dp/430922671X', status: 'completed', startedAt: -90, completedAt: -45, note: '人類史の壮大なスケールに圧倒された' },

  // unread（書斎・未読）- 買ったけど読んでない本
  { title: '影響力の武器', link: 'https://www.amazon.co.jp/dp/4414304229', status: 'unread' },
  { title: '金持ち父さん貧乏父さん', link: 'https://www.amazon.co.jp/dp/4480864245', status: 'unread' },
  { title: 'イシューからはじめよ', link: 'https://www.amazon.co.jp/dp/4862760856', status: 'unread' },
  { title: 'エッセンシャル思考', link: 'https://www.amazon.co.jp/dp/4761270438', status: 'unread' },

  // dropped（書斎・中断）- 途中でやめた本
  { title: 'アウトプット大全', link: 'https://www.amazon.co.jp/dp/4801400558', status: 'dropped', startedAt: -40, note: '内容が合わなかった' },
  { title: '1日1ページ、読むだけで身につく世界の教養365', link: 'https://www.amazon.co.jp/dp/4866510552', status: 'dropped', startedAt: -20 },

  // wishlist（本屋）- 気になっている本
  { title: '限りある時間の使い方', link: 'https://www.amazon.co.jp/dp/4761276150', status: 'wishlist' },
  { title: 'チーズはどこへ消えた？', link: 'https://www.amazon.co.jp/dp/459403019X', status: 'wishlist' },
  { title: '君たちはどう生きるか', link: 'https://www.amazon.co.jp/dp/4003315812', status: 'wishlist' },
  { title: 'アトミック・ハビッツ', link: 'https://www.amazon.co.jp/dp/4833423057', status: 'wishlist' },
  { title: '1兆ドルコーチ', link: 'https://www.amazon.co.jp/dp/4478107246', status: 'wishlist' },
  { title: 'LIFE SHIFT', link: 'https://www.amazon.co.jp/dp/4492533877', status: 'wishlist' }
];
