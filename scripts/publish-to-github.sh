#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${1:-argentina-travel}"
VISIBILITY="${2:-public}"

cd "$(dirname "$0")/.."

if ! command -v git >/dev/null 2>&1; then
  echo "Git не найден. Установите Xcode Command Line Tools: xcode-select --install"
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init -b main
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) не установлен."
  echo "Установите: brew install gh"
  echo "Затем войдите: gh auth login"
  exit 1
fi

gh auth status >/dev/null 2>&1 || {
  echo "Войдите в GitHub: gh auth login"
  exit 1
}

git add -A
git status --short

if git diff --cached --quiet; then
  echo "Нет изменений для коммита."
else
  git commit -m "$(cat <<'EOF'
Initial commit: Argentina travel marketplace

Next.js marketplace and tour detail pages with filters, catalog sidebar,
booking flow, route map, and Russian pluralization helpers.
EOF
)"
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote origin уже настроен:"
  git remote -v
  git push -u origin main
else
  gh repo create "$REPO_NAME" \
    --"${VISIBILITY}" \
    --source=. \
    --remote=origin \
    --push \
    --description "Авторские туры по Аргентине — маркетплейс на Next.js"
fi

echo ""
echo "Готово. URL репозитория:"
gh repo view --json url -q .url
