#!/bin/bash

# Create certificates directory
mkdir -p certs

# Change to the project root directory
cd "$(dirname "$0")/.."

echo "Generating self-signed SSL certificate..."

# Load HOST_IP from .env file if not already set
if [ -z "$HOST_IP" ] && [ -f .env ]; then
  HOST_IP=$(grep -v '^#' .env | grep '^HOST_IP=' | cut -d'=' -f2 | tr -d '"' | tr -d "'")
fi

# Use HOST_IP for the certificate CN
CERT_CN=${HOST_IP:-localhost}
echo "Using CN=$CERT_CN for the certificate"

# Build SAN extension (modern browsers require SAN; CN alone is ignored)
SAN="subjectAltName=DNS:localhost,IP:127.0.0.1"
if [ "$CERT_CN" != "localhost" ] && [ "$CERT_CN" != "127.0.0.1" ]; then
  SAN="$SAN,IP:$CERT_CN"
fi
echo "Using SAN: $SAN"

# Generate self-signed certificate directly (with SAN via -addext)
echo "Creating self-signed certificate..."
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/server.key \
  -out certs/server.crt \
  -days 365 \
  -subj "/CN=$CERT_CN" \
  -addext "$SAN"

# Set appropriate permissions
chmod 600 certs/server.key
chmod 644 certs/server.crt

echo "Certificate generation completed!"
echo "  - Certificate: certs/server.crt"
echo "  - Private key: certs/server.key"