#!/bin/bash

# マイグレーションの実行
python manage.py migrate

# 初期データの読み込み
python manage.py loaddata initial_data

# サーバーの起動
exec poetry run daphne -b 0.0.0.0 -p 8000 core.asgi:application
