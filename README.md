# 【ft_transcendence 進め方】

## Getting Started

.env.sample をコピーして .env を作成

```bash
make up
```

## 完了目安

- 約 3 ヶ月
  - マンダトリーのみ達成を目指す

## コミュニケーション方法

- 【github】
  - コードベースの相談はすべて issue と PR でチャットで実施する
- 【discord】
  - 上記以外の進め方等の質問、意見、議論はすべてこちらで実施する

## ドキュメント

- Notion で議事録は保管する

## GitHub 運用

- main : 常に動く。どこのステップかが明確
  - yamato
  - fukuhara
  - akamite
  - hrinka

### GitHub 具体的な方法

- Main
  - GitHub 上で Issue を作成
    - タイトル：`Add 〇〇 Feature`
    - アサイン：メンバーの誰か
    - ラベル：適切なのを選択
  - ローカルのアップデート：`git checkout main; git pull origin main`
  - データベースを最新のにする: `make migrate`
  - ローカル環境でブランチを切る：`git checkout -b <your_name>/add-feature#issue_id`
  - 作業
  - コミット：`git commit -am "Add 〇〇 Feature #issue_id"`
  - プッシュ：`git push origin <your_name>/add-feature#issue_id`
  - Issue とコミットがリンクされているのを確認後、プルリクエストを作成
  - 誰かのレビュー
  - OK だったら、GitHub 上で Merge
- 参考サイト
  - [参考サイト ①：Issue の使い方](https://qiita.com/tkmd35/items/9612c03dc60b1c516969)
  - [参考サイト ②：GitHub ワークフロー](https://www.atlassian.com/ja/git/tutorials/comparing-workflows/gitflow-workflow)
  - [参考サイト ③：.gitignore テンプレート](https://github.com/github/gitignore)

## Basic Rules

- **One PR per issue**
- TODO リストは issue に記入
- PR にはテンプレートに従い、必要事項を記入
- PR には`WIP`かそれ以外か

## Title of Issues

| Prefix   | Description                      |
| :------- | :------------------------------- |
| ADD      | 新しい機能や要素の追加           |
| FIX      | バグ修正                         |
| UPDATE   | 既存機能や内容の更新             |
| REMOVE   | 不要なコードや機能の削除         |
| DOCS     | ドキュメントの追加や更新         |
| TEST     | テストの追加や修正               |
| REFACTOR | コードのリファクタリングや最適化 |
| DEPLOY   | デプロイ関連の変更               |
| CONFIG   | 設定や構成ファイルの変更         |
| CHORE    | 軽微な作業や管理的な修正         |
| INVALID  | 不必要な Issue                   |

## Issue Label

- [Issue のラベル良さげ？](https://qiita.com/shun_tak/items/d363b7c5d9e8fa19dc6b)

## レビュー対策

- [42Eval](https://42evals.me/Cursus/)

## 基本コマンド

- `make up` : コンテナを立ち上げる
  - `make fbuild` : コンテナをキャッシュなしで立ち上げる
- `make down` : コンテナを落とす
  - `make clean` : コンテナを落として、ボリュームも削除する
- `make re` : コンテナを再起動する
- `make test` : API のテストを実行する
- `make makemigrations` : マイグレーションファイルを作成する
- `make migrate` : マイグレーションを実行する

## 便利コマンド

- 前提：別ターミナルで`make up`を実行しておく
- `make api_in` : API コンテナに入る
  - `make api_logs` : API コンテナのログを見る
- `make front_in` : フロントコンテナに入る
  - `make front_logs` : フロントコンテナのログを見る
- `make db_in` : DB コンテナに入る
  - `make db_logs` : DB コンテナのログを見る

## Formatter

- Frontend: `make lint`
- Backend: `make ruff`

## Access Links

- [Frontend](https://127.0.0.1:3001)
  - `https://localhost:3001/`
    - Welcome ページ
  - `https://localhost:3001/404`
    - 404 ページ
  - `https://localhost:3001/register`
    - ユーザー登録ページ
  - `https://localhost:3001/login`
    - ログインページ
    - username: `sample1`
    - password: `password1`
  - `https://localhost:3001/profile`
    - ユーザープロフィールページ
  - `https://localhost:3001/modes`
    - ゲームモード選択ページ
  - `https://localhost:3001/settings/game`
    - ゲーム設定ページ
  - `https://localhost:3001/settings/account`
    - ユーザーアカウント設定ページ
  - `https://localhost:3001/singleplay/select`
    - シングルプレイヤーレベル選択ページ
  - `https://localhost:3001/singleplay/:gameId`
    - シングルプレイヤーゲームページ
  - `https://localhost:3001/multiplay/:gameId`
    - マルチプレイヤーゲームページ
  - `https://localhost:3001/games/:gameId/results`
    - マッチ結果ページ
  - `https://localhost:3001/tournaments`
    - トーナメント一覧ページ
  - `https://localhost:3001/tournaments/:tournamentId`
    - トーナメント詳細ページ
  - `https://localhost:3001/leaderboard`
    - リーダーボードページ
- [Backend](https://127.0.0.1:8001/)

  - `https://127.0.0.1:8001/admin/`
    - username: `sample`
    - password: `password`
  - `https://127.0.0.1:8001/api/users/`
  - `https://127.0.0.1:8001/api/games/`

- [ELK](http://127.0.0.1:5601/)

  - `http://127.0.0.1:5601/`
    - Kibana トップページ
  - username: `elastic`
  - password: `password`

- [DB 可視化ツール（pgweb）](http://127.0.0.1:5433/)
  - `http://127.0.0.1:5433/`
    - pgweb トップページ

## https

- `GET /users/`
- `POST /users/`
- `GET /users/<pk>/`
- `PUT/PATCH /users/<pk>/`
- `DELETE /users/<pk>/`
- `GET /games/`
- `POST /games/`
- `GET /games/<pk>/`
- `PUT/PATCH /games/<pk>/`
- `DELETE /games/<pk>/`

## 参考資料

- [Icons](https://fontawesome.com/icons)
