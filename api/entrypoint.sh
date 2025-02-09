#!/bin/bash

# マイグレーションの実行
python manage.py migrate

# 初期データの読み込み
python manage.py loaddata initial_data

# サーバーの起動（開発モードでホットリロードを有効化）
exec poetry run python manage.py runserver 0.0.0.0:8000
