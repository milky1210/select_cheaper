# どっちが安い？

2商品のうち、1個あたり安い方を瞬時に選ぶ10問タイムアタックです。難易度別の自己ベスト、通常／暗算法ラベル、検証用JSONコピーに対応しています。

## ローカル起動

Node.js 22 以上を推奨します。外部パッケージに依存しない静的構成です。

```bash
npm install
npm run dev
```

本番ビルドとテスト:

```bash
npm run test
npm run build
npm run preview
```

## GitHub Pages 公開

アセット参照は相対パス (`./`) のため、ユーザーサイト／プロジェクトサイトのどちらでも動作します。

1. GitHub のリポジトリ **Settings → Pages** を開く
2. **Build and deployment → Source** を **GitHub Actions** にする
3. `main` ブランチへ push する
4. **Actions** の `Deploy to GitHub Pages` 完了後、表示されたURLを開く

`.github/workflows/deploy.yml` がテスト・ビルド・公開を自動実行します。

## 判定と記録

- 単価比較は除算せず `a.price × b.count` と `b.price × a.count` の整数比較で判定
- 総合タイム = 実測タイム + 不正解数 × 5秒（小さいほど高記録）
- 難易度ごとの自己ベストはブラウザの `localStorage` に保存
- 結果画面から、問題・正解・回答・回答時間・プレイモードをJSONでコピー可能
