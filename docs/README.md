# FIFA World Cup 2026 — World Map Explorer

出場48カ国を2Dメルカトル世界地図上で探索できるインタラクティブ・データビジュアライズです。
地図・ライブラリ（D3 / TopoJSON）・地図データ・全国旗・チームデータをすべて `index.html` 1ファイルに内蔵しており、**完全オフラインで動作**します（外部CDN・サーバー不要）。

## 機能
- 2Dメルカトル世界地図（ドラッグ移動・ズーム、範囲外移動の制限あり）
- 国名ラベル / ホバーで国旗＋日英国名（出場国・非出場国とも対応）
- 国の領域またはラベルをクリックで詳細パネル（能力レーダー・スカッド・W杯成績・国民性ほか）
- 連盟フィルター（左下）で表示切替
- 2カ国比較（サイドバイサイド＋能力レーダー）
- 出場48カ国一覧（ソート可能テーブル / スマホはカード表示）

## GitHub Pages での公開手順
1. このリポジトリを GitHub に push します（`docs/` フォルダごと）。
2. リポジトリの **Settings → Pages** を開きます。
3. **Build and deployment → Source** を「Deploy from a branch」に設定。
4. **Branch** を `main`（またはデフォルトブランチ）、フォルダを **`/docs`** に設定して Save。
5. 数十秒〜数分後、`https://<ユーザー名>.github.io/<リポジトリ名>/` で公開されます。

> `.nojekyll` ファイルは Jekyll の処理を無効化するために置いています（そのまま残してください）。

## ファイル構成
- `index.html` — アプリ本体（すべて内蔵・これだけで動作）
- `.nojekyll` — Jekyll 無効化用（空ファイル）
- `README.md` — 本ファイル

## データ出典
FIFA公式・Transfermarkt・RotoWire・Worldometers・IMF (2025–2026) /
地図: Natural Earth (world-atlas) / 国旗: flag-icons / 国名ラベル参考: OpenStreetMap
