#!/bin/bash

# IPアドレス取得関数
get_local_ip() {
    if command -v ip >/dev/null 2>&1; then
        # Linux環境用（ipコマンドが利用可能な場合）
        ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d/ -f1 | head -n 1
    else
        # macOS環境用
        ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -n 1
    fi
}

# ローカルIPアドレスを取得
LOCAL_IP=$(get_local_ip)

# .envファイルが存在するか確認
if [ ! -f .env ]; then
    echo ".envファイルが見つかりません。"
    exit 1
fi

# HOST_IPの行を置換
if grep -q "^HOST_IP=" .env; then
    # macOS（BSD）とLinux（GNU）の両方に対応したsed
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/^HOST_IP=.*$/HOST_IP=$LOCAL_IP/" .env
    else
        sed -i "s/^HOST_IP=.*$/HOST_IP=$LOCAL_IP/" .env
    fi
else
    # HOST_IPが存在しない場合は追加
    echo "HOST_IP=$LOCAL_IP" >> .env
fi

echo "HOST_IPを $LOCAL_IP に設定しました。"
