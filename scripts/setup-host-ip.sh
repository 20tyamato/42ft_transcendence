#!/bin/bash

# Function to get the IP address
get_local_ip() {
    if command -v ip >/dev/null 2>&1; then
        # For Linux environment (when ip command is available)
        ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d/ -f1 | head -n 1
    else
        # For macOS environment
        ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -n 1
    fi
}

# Get the local IP address
LOCAL_IP=$(get_local_ip)

# Check if the .env file exists
if [ ! -f .env ]; then
    echo ".env file not found."
    exit 1
fi

# Replace the HOST_IP line
if grep -q "^HOST_IP=" .env; then
    # sed command compatible with both macOS (BSD) and Linux (GNU)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/^HOST_IP=.*$/HOST_IP=$LOCAL_IP/" .env
    else
        sed -i "s/^HOST_IP=.*$/HOST_IP=$LOCAL_IP/" .env
    fi
else
    # Add HOST_IP if it does not exist
    echo "HOST_IP=$LOCAL_IP" >> .env
fi

echo "Set HOST_IP to $LOCAL_IP."
