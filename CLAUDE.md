# CLAUDE.md — ft_transcendence 開発ガイド

## プロジェクト概要

3Dマルチプレイヤー Pong ゲーム。フロントエンド(TypeScript/Three.js) + バックエンド(Django/Channels)構成。

- **ソロプレイ**: クライアント完結、Three.js 3Dレンダリング、CPU AI対戦
- **マルチプレイ**: WebSocket経由でサーバーがゲームロジックを実行、クライアントはThree.jsで描画
- **トーナメント**: マルチプレイと同じ基盤にブラケットシステムを追加

## リモート構成

```
origin  → https://github.com/20tyamato/42ft_transcendence  (上流チームリポジトリ)
github  → https://github.com/hrinka/ft_transcendence       (作業フォーク)
```

作業ブランチは `github` リモートに push する。

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | TypeScript, Three.js |
| バックエンド | Python, Django, Django Channels |
| リアルタイム通信 | WebSocket (Django Channels + Redis) |
| DB | PostgreSQL |
| コンテナ | Docker Compose |

## ディレクトリ構成（主要部分）

```
ft_transcendence/
├── frontend/src/
│   ├── pages/
│   │   ├── SinglePlay/Game/     # ソロプレイ (Experience.ts, LocalGame.ts)
│   │   ├── MultiPlay/Game/      # マルチプレイ
│   │   └── Tournament/Game/     # トーナメント
│   └── models/
│       ├── Services/
│       │   ├── GameRenderer.ts  # Three.js レンダラー (マルチ/トーナメント共通)
│       │   ├── BaseGameManager.ts
│       │   ├── WebSocketService.ts
│       │   └── InputHandlerService.ts
│       └── Game/type.ts         # IGameState 型定義
└── api/pong/
    ├── game_logic.py            # サーバー側ゲームロジック
    ├── consumers.py             # マルチプレイ WebSocket
    ├── base_consumers.py
    ├── tournament_consumers.py
    └── migrations/              # DBマイグレーション
```

## 開発ルール

### 必須確認事項

#### 1. DBマイグレーション
- モデル (`api/*/models.py`) を変更したら **必ず** マイグレーションファイルを生成・確認する
- コンテナ内で実行: `docker compose exec api python manage.py makemigrations`
- マイグレーション適用: `docker compose exec api python manage.py migrate`
- 既存マイグレーションファイルを直接編集しない。必ず新規ファイルを生成する

#### 2. 既存ファイルとの競合チェック
- 新ファイル作成前に同等の機能を持つ既存ファイルがないか確認する
- `GameRenderer.ts` と `Experience.ts` のように類似実装が重複しないよう注意
- 型定義は `frontend/src/models/Game/type.ts` に集約する

#### 3. フィールド定数の整合性
- サーバー (`game_logic.py`) とクライアント (`GameRenderer.ts`) でフィールドサイズ定数が一致しているか常に確認する
  - `FIELD_WIDTH = 1200`, `FIELD_LENGTH = 3000`
- どちらかを変更したら必ずもう一方も更新する

#### 4. WebSocket メッセージ型
- `IGameState` インターフェース (`frontend/src/models/Game/type.ts`) を変更した場合、サーバー側の `game_logic.py` の `get_state()` 戻り値も合わせて変更する

#### 5. エラー発見時の対処
- 実装中に別のバグを発見した場合、その場で修正せず GitHub Issue を立てて記録する
- 修正が小さい（5行以内）場合はその場で対処してもよいが、必ずコメントに残す
- コンソールエラー・未ハンドル Promise rejection は放置しない

### コーディング規約

- コメントは「なぜ」を書く。「何をしているか」はコードで表現する
- マジックナンバーは定数化する（特にフィールドサイズ、スコア上限）
- `any` 型は使わない。型が不明な場合は `unknown` を使い適切にナローイングする
- 非同期処理は `async/await` 統一。コールバックネストは避ける

### ブランチ・PR運用

- ブランチ名: `feature/<issue番号>-<簡潔な説明>` (例: `feature/1-multiplayer-3d-fix`)
- 1 PR = 1 Issue を原則とする
- PR作成時は Issue 番号を本文に記載 (`Closes #<番号>`)
- マージ前に動作確認（docker compose up で実機確認）

## よく使うコマンド

```bash
# 起動
docker compose up --build

# フロントエンド型チェック
cd frontend && npx tsc --noEmit

# Django マイグレーション
docker compose exec api python manage.py makemigrations
docker compose exec api python manage.py migrate

# ログ確認
docker compose logs -f api
docker compose logs -f frontend
```

## フィールド定数（サーバー/クライアント共通値）

| 定数 | 値 |
|------|----|
| FIELD_WIDTH | 1200 |
| FIELD_LENGTH | 3000 |
| WINNING_SCORE | 3 |
| GAME_FPS | 60 |
