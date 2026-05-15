# ft_transcendence

> 42Tokyo — フルスタック リアルタイム卓球ゲームプラットフォーム

```
██████╗  ██████╗ ███╗   ██╗ ██████╗
██╔══██╗██╔═══██╗████╗  ██║██╔════╝
██████╔╝██║   ██║██╔██╗ ██║██║  ███╗
██╔═══╝ ██║   ██║██║╚██╗██║██║   ██║
██║     ╚██████╔╝██║ ╚████║╚██████╔╝
╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝
```

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?logo=django)](https://djangoproject.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![Three.js](https://img.shields.io/badge/Three.js-r169-000000?logo=three.js)](https://threejs.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)

---

## 概要

ブラウザで動くリアルタイム卓球（Pong）ゲームです。  
シングルプレイ（対CPU）・マルチプレイ（対人 WebSocket）・トーナメント（4人）の 3 モードを提供し、  
プロフィール・マッチ履歴・リーダーボード・フレンド機能を備えます。

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | TypeScript + Vite + Three.js |
| バックエンド | Django 5.1 + Django REST Framework |
| リアルタイム通信 | Django Channels + WebSocket |
| DB | PostgreSQL 16 |
| キャッシュ / PubSub | Redis 7 |
| ロギング | ELK Stack (Elasticsearch + Logstash + Kibana) |
| 認証 | Token 認証 (DRF AuthToken) |
| インフラ | Docker Compose + 自己署名 SSL |

---

## ゲームモード

### シングルプレイ
- 4段階の CPU 難易度: **EASY / MEDIUM / HARD / ONI**
- CCD（連続衝突判定）実装でボールのすり抜けなし
- Three.js による 3D レンダリング

### マルチプレイ
- WebSocket でリアルタイム対戦
- マッチメイキング待機システム
- サーバーサイドで物理演算（権威サーバー方式）

### トーナメント
- 4人参加 → 準決勝 2試合 → 決勝
- 進行状況をリアルタイムブロードキャスト

---

## セットアップ

### 必要環境

- Docker & Docker Compose
- macOS / Linux（WSL2 可）

### 初回起動

```bash
# リポジトリをクローン
git clone <repo-url> ft_transcendence
cd ft_transcendence

# 環境変数の設定
cp .env.sample .env

# 起動（SSL 証明書生成 + コンテナビルド込み）
make upbuild
```

起動後、ブラウザで **SSL 証明書を承認**してください:

1. `https://<HOST_IP>:8001` を開き「詳細 → 安全でないサイトへ進む」
2. `https://localhost:3001` を同様に承認

---

## アクセス先

| サービス | URL | 備考 |
|---|---|---|
| フロントエンド | `https://localhost:3001` | |
| API | `https://<HOST_IP>:8001` | SSL 承認が必要 |
| Django Admin | `https://<HOST_IP>:8001/admin/` | user: `sample` / pw: `password` |
| pgweb (DB UI) | `http://localhost:5433` | |
| Kibana (ログ) | `http://localhost:5601` | user: `elastic` / pw: `password` |

### ページ一覧

| パス | 説明 |
|---|---|
| `/` | ホーム |
| `/login` | ログイン (sample1 / password1) |
| `/register` | ユーザー登録 |
| `/modes` | ゲームモード選択 |
| `/profile` | プロフィール |
| `/singleplay/select` | シングルプレイ 難易度選択 |
| `/multiplay` | マルチプレイ マッチメイキング |
| `/tournament` | トーナメント |
| `/leaderboard` | リーダーボード |
| `/friends` | フレンド一覧 |
| `/settings/user` | アカウント設定 |

---

## make コマンド

```bash
make up          # 起動（ビルドなし）
make upbuild     # ビルド付きで起動
make down        # 停止
make re          # クリーン → ビルド → 起動（証明書も再生成）
make ssl-renew   # SSL 証明書のみ再生成

make api_in      # API コンテナに入る
make front_in    # フロントエンドコンテナに入る

make migrate     # DB マイグレーション適用
make test        # テスト実行
make lint        # ESLint (フロントエンド)
make ruff        # Ruff (Python)
make submit      # 提出前チェック一式 (migrate + lint + ruff + test)
make help        # コマンド一覧
```

---

## プロジェクト構成

```
ft_transcendence/
├── api/                          # Django バックエンド
│   ├── core/                     # settings, urls, wsgi/asgi
│   └── pong/                     # メインアプリ
│       ├── modules/              # Auth, User, Game, Tournament モジュール
│       ├── consumers.py          # WebSocket: マッチメイキング + マルチプレイ
│       ├── tournament_consumers.py  # WebSocket: トーナメント
│       ├── base_consumers.py     # WebSocket 共通基底クラス
│       ├── game_logic.py         # サーバーサイド物理演算
│       └── models.py             # Game, User, Tournament モデル
│
├── frontend/src/
│   ├── pages/                    # 各画面 (SPA)
│   │   ├── SinglePlay/           # Three.js ゲームエンジン + CPU AI
│   │   ├── MultiPlay/            # WebSocket クライアント
│   │   ├── Tournament/           # トーナメントブラケット UI
│   │   ├── Profile/              # プロフィール + 3D 背景
│   │   ├── Leaderboard/          # ランキング
│   │   └── Friends/              # フレンド管理
│   ├── components/               # 共有コンポーネント (Background3D など)
│   ├── models/                   # API クライアント (User, Game リポジトリ)
│   ├── core/                     # SPA ルーター, Page クラス, Logger
│   └── libs/                     # 認証, localStorage ラッパー
│
├── docker-compose.yml
├── docker-compose.elk.yml        # ELK Stack (別 Compose)
├── Makefile
└── scripts/                      # SSL 証明書生成, HOST_IP セットアップ
```

---

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/login/` | ログイン → Token 取得 |
| POST | `/api/logout/` | ログアウト → Token 削除 |
| POST | `/api/register/` | ユーザー登録 |
| GET | `/api/users/me/` | 自分の情報取得 |
| PATCH | `/api/users/me/` | プロフィール更新 |
| GET | `/api/users/{id}/matches/` | マッチ履歴 |
| GET | `/api/leaderboard/` | ランキング |
| WS | `wss://.../ws/matchmaking/` | マッチメイキング |
| WS | `wss://.../ws/game/{session_id}/` | マルチプレイ対戦 |
| WS | `wss://.../ws/tournament/` | トーナメント管理 |
| WS | `wss://.../ws/tournament/game/{session_id}/` | トーナメント試合 |

> **Note:** API の `/` (ルート) は 404 を返します。REST API 専用サーバーのため意図した設計です。

---

## よくあるトラブル

### `make re` 後にログインできない

`make re` で SSL 証明書が再生成されます。ブラウザで `https://<HOST_IP>:8001` を開いて証明書を承認してください。

### ログイン時に「Already logged in」エラー (403)

前回セッションのトークンが DB に残っています。以下で削除できます:

```bash
docker compose exec api python manage.py shell -c \
  "from rest_framework.authtoken.models import Token; Token.objects.all().delete(); print('Tokens cleared')"
```

### Vite HMR が効かない

Docker volume mount の都合で HMR が機能しないことがあります:

```bash
docker compose restart frontend
```

---

## GitHub 運用

### ブランチ戦略

- `main` : 常に動く状態を保つ
- 作業ブランチ: `<your_name>/<prefix>-feature#issue_id`

### Issue / PR プレフィックス

| Prefix | 説明 |
|---|---|
| ADD | 新機能追加 |
| FIX | バグ修正 |
| UPDATE | 既存機能の更新 |
| REMOVE | 削除 |
| DOCS | ドキュメント |
| TEST | テスト |
| REFACTOR | リファクタリング |
| CONFIG | 設定変更 |

### ワークフロー

```bash
git checkout main && git pull origin main
make migrate
git checkout -b <your_name>/fix-something#123
# 作業 ...
git push origin <your_name>/fix-something#123
# GitHub で PR 作成 → レビュー → Merge
```

---

## 参考

- [42Eval](https://42evals.me/Cursus/)
- [Django Channels docs](https://channels.readthedocs.io/)
- [Three.js docs](https://threejs.org/docs/)
- [Font Awesome Icons](https://fontawesome.com/icons)
