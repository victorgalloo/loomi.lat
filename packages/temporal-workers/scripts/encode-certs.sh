#!/bin/bash
# Encode Temporal Cloud certificates to base64 for environment variables
# Usage: ./scripts/encode-certs.sh path/to/client.pem path/to/client.key

if [ $# -ne 2 ]; then
    echo "Usage: $0 <cert-file> <key-file>"
    echo "Example: $0 ~/Downloads/client.pem ~/Downloads/client.key"
    exit 1
fi

CERT_FILE=$1
KEY_FILE=$2

if [ ! -f "$CERT_FILE" ]; then
    echo "Error: Certificate file not found: $CERT_FILE"
    exit 1
fi

if [ ! -f "$KEY_FILE" ]; then
    echo "Error: Key file not found: $KEY_FILE"
    exit 1
fi

echo "=== Base64 Encoded Certificate ==="
echo "TEMPORAL_CLIENT_CERT="
base64 -i "$CERT_FILE" | tr -d '\n'
echo ""
echo ""

echo "=== Base64 Encoded Key ==="
echo "TEMPORAL_CLIENT_KEY="
base64 -i "$KEY_FILE" | tr -d '\n'
echo ""
echo ""

echo "Copy these values to your .env file or Railway/Vercel environment variables."
