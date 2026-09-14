#!/usr/bin/env bash
# One-command redeploy: build → push dist to gh-pages → GitHub Pages rebuilds.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build

cd dist
rm -rf .git
git init -b gh-pages -q
git add -A
git commit -qm "deploy $(date '+%Y-%m-%d %H:%M')"
git remote add origin https://github.com/bnasif25/next-up.git
git push -fq origin gh-pages

echo "deployed → https://bnasif25.github.io/next-up/"
