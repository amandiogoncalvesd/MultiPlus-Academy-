#!/usr/bin/env sh
set -e

echo "🐳 Starting MultiPlus Academy Monorepo Build Pipeline..."

# 1. Verification of global lockfile
if [ ! -f "pnpm-lock.yaml" ]; then
  echo "⚠️ Warning: pnpm-lock.yaml not located. Running fresh install..."
fi

# 2. Dependency resolution across core and apps
echo "📦 Resolving pnpm workspace dependencies..."
pnpm install

# 3. Turborepo build task dispatchment
echo "🚀 Dispatching build signals via Turborepo Cache Controller..."
pnpm build

echo "✅ Success: All bundles and assets compiled successfully inside /apps and /packages!"
