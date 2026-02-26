#!/usr/bin/env bash
set -e

echo "=== Installing Python dependencies ==="
pip install -r requirements.txt

echo "=== Installing Node.js via nvm ==="
export NVM_DIR="$HOME/.nvm"
# Install nvm if not present
if [ ! -f "$NVM_DIR/nvm.sh" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
# shellcheck source=/dev/null
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

echo "=== Building React frontend ==="
cd frontend
npm ci
npm run build
cd ..

echo "=== Build complete. frontend/dist ready. ==="
