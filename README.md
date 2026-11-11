# lgtm-approve

GitHub の PR を、LGTM 画像付きで Approve する Chrome 拡張。PR ページでツールバーのアイコンを押し、画像を選んで Approve を押すと、画像の Markdown を本文にしたレビューが投稿される。コードは読まず、マージもしない。

## 画像の取得元

ポップアップで選ぶ。選んだ取得元は次回も使われる。

| 取得元 | 取得に使う API |
|---|---|
| [LGTMeow](https://lgtmeow.com)（猫） | `https://lgtmeow.com/api/lgtm-images` |
| [LGTMoon](https://lgtmoon.dev) | `https://lgtmoon.dev/api/images/random` |

取得元を足すときは `src/sources.js` の `SOURCES` に 1 件足し、`manifest.json` の `host_permissions` に API のホストを足す。

画像を取れないときは、ボタンが「画像なしで Approve」に変わり、本文 `LGTM` で Approve する。

## インストール

1. `chrome://extensions` を開き、デベロッパーモードを有効にする
2. 「パッケージ化されていない拡張機能を読み込む」でこのリポジトリのディレクトリを選ぶ
3. 開いた設定画面で GitHub のトークンを保存する
   - Fine-grained token なら、対象リポジトリに Pull requests の Read and write
   - Classic token なら `repo` スコープ

トークンは `chrome.storage.local` にだけ保存され、`api.github.com` にだけ送られる。

## Approve しない PR

Approve を押した時点で次を確かめ、当てはまれば投稿せずに理由を出す。

- PR が open でない（closed / merged）
- PR の作成者が自分（GitHub は自分の PR を Approve できない）

## テスト

```bash
npm test
```

取得元ごとのテストは本物の API を呼び、返った画像の URL に実際に届くかを確かめる。
