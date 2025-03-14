#!/bin/bash

# Create certificates directory
mkdir -p certs

# Change to the project root directory
cd "$(dirname "$0")/.."

echo "Generating self-signed SSL certificate..."

# Generate private key
openssl genrsa -out certs/server.key 2048

# Generate certificate signing request (CSR)
echo "Creating certificate signing request (CSR)..."
# Get hostname for CN or use localhost as default
HOSTNAME=${HOSTNAME:-localhost}
openssl req -new -key certs/server.key -out certs/server.csr -subj "/CN=$HOSTNAME"

# Generate self-signed certificate
echo "Creating self-signed certificate..."
openssl x509 -req -days 365 -in certs/server.csr -signkey certs/server.key -out certs/server.crt

# Set appropriate permissions
chmod 600 certs/server.key
chmod 644 certs/server.crt

echo "Certificate generation completed!"
echo "  - Certificate: certs/server.crt"
echo "  - Private key: certs/server.key"