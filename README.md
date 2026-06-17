# FIFA World Cup 2026 — THE 48 NATIONS

出場48カ国を3D地球儀（D3 orthographic globe）で探索できるインタラクティブ・データビジュアライズです。地図・ライブラリ・全国旗・チームデータを `index.html` 1ファイルに内蔵しています（地図機能はオフライン動作。背景パターンと一部フォントのみ外部参照）。

## 機能
- 3D地球儀（ドラッグ回転・ホイール/ピンチでズーム・慣性付き）
- 国の領域/ラベルのタップで詳細パネル、ホバーで国旗＋日英国名
- 連盟フィルター（右下）／国名ラベル表示切替
- 出場国比較（HEAD-TO-HEAD・能力レーダー）
- 出場48カ国一覧（ソート可・スマホはカード）
- グループステージ／ノックアウトステージ／データソース
- 初回オンボーディング、スプラッシュ（サークルワイプ）

## 公開（GitHub Pages）
このリポジトリ直下の `index.html` が唯一の公開ファイルです。

- ユーザーサイト（`<ユーザー名>.github.io`）の場合：リポジトリ直下に `index.html` と `.nojekyll` を置く（=このフォルダの構成のまま）。
- 通常リポジトリの場合：Settings → Pages → Source を「Deploy from a branch」、Branch をデフォルト、フォルダを `/ (root)` に設定。

> `.nojekyll` は Jekyll 処理を無効化するための空ファイルです（内蔵アセットを正しく配信するため残してください）。

## 構成
- `index.html` — アプリ本体（これだけ更新・公開すればOK）
- `.nojekyll` — Jekyll無効化用（空ファイル）
- `README.md` — 本ファイル

## データ出典
FIFA公式・Transfermarkt・RotoWire・Worldometers・IMF・The World Bank（2025–2026）/ 地図: Natural Earth (world-atlas) / 国旗: flag-icons・flagcdn / 国名ラベル参考: OpenStreetMap
