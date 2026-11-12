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
3. 開いた設定画面で GitHub のトークンを保存する。保存するときに `GET /user` でトークンを確かめ、ログイン名を表示する

トークンは `chrome.storage.local` にだけ保存され、`api.github.com` にだけ送られる。

### トークンの権限

| 種類 | 付ける権限 |
|---|---|
| Fine-grained token | 対象リポジトリに Pull requests の Read and write |
| Classic token | `repo`（親のチェックボックス。private リポジトリの PR を Approve できる下位項目は無い）。公開リポジトリだけなら `public_repo` でよい |

SAML SSO を使う Organization のリポジトリでは、トークン一覧の Configure SSO からその Organization を Authorize する。しないと Approve が 403 になる。

## Approve しない PR

Approve を押した時点で次を確かめ、当てはまれば投稿せずに理由を出す。

- PR が open でない（closed / merged）
- PR の作成者が自分（GitHub は自分の PR を Approve できない）

## ファイル構成

| ファイル | 役割 |
|---|---|
| `manifest.json` | Manifest V3 の定義。ポップアップ、設定画面、API を呼ぶホストの許可 |
| `src/sources.js` | 画像の取得元の一覧と、画像を 1 枚選んで Markdown にする処理 |
| `src/github.js` | PR の URL の解析と、GitHub API の呼び出し（Approve してよいかの確認、Approve の投稿） |
| `src/popup.*` | PR ページで開くポップアップ |
| `src/options.*` | トークンを保存する設定画面 |
| `icons/` | 拡張のアイコン（16 / 32 / 48 / 128 px）。`tools/make-icons.py` で生成する |

## テスト

```bash
npm test
```

依存パッケージは無い（Node.js 18 以降の `node:test` と `fetch` を使う）。取得元ごとのテストは本物の API を呼び、返った画像の URL に実際に届くかを確かめる。

## アイコンを作り直す

`assets/icon-source.jpeg`（Gemini で黒背景に描いた元画像）から、黒を透過にして 4 サイズの PNG を作る。Pillow、NumPy、SciPy が要る。

```bash
python tools/make-icons.py assets/icon-source.jpeg icons
```

元画像を差し替えるときは、スクリプト冒頭の定数（右下の円の中心と半径 `CHECK_CIRCLE` など）を新しい画像に合わせる。
