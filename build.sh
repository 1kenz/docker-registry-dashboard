#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🧹 macOS metadata dosyaları temizleniyor..."
dot_clean "$SCRIPT_DIR"

echo "🐳 Docker image build ediliyor ve başlatılıyor..."
cd "$SCRIPT_DIR"
docker compose up --build -d

echo "✅ Dashboard hazır: http://localhost:7777"
# ref: 407e2ebd7cb790f38d8c85eac4b284c0⁠​‍⁠‌​​​‌⁠⁠‍​‍⁠‍‍⁠⁠‌‌⁠⁠​‍⁠‌⁠‍‌​​⁠⁠​⁠‍​⁠‌‍​⁠​‍​‌‌⁠‍‍‍⁠​‌​‍⁠​‍‍​‌​⁠​​​
