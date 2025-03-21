#!/bin/bash

# マイグレーションの実行
python manage.py migrate

# 初期データの読み込み
python manage.py loaddata initial_data

# 開発環境用のホットリロード設定
if [ "$DJANGO_ENV" = "development" ]; then
    # watchdogを使用してファイル変更を監視
    watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- \
    poetry run daphne -e ssl:8001:privateKey=/code/certs/server.key:certKey=/code/certs/server.crt -b 0.0.0.0 core.asgi:application
else
    # 本番環境ではdaphneのみ起動
    exec poetry run daphne -e ssl:8001:privateKey=/code/certs/server.key:certKey=/code/certs/server.crt -b 0.0.0.0 core.asgi:application
fi