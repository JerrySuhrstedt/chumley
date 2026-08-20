#!/bin/bash
# Bootstraps a Claude Code on the web container so that `npm run lint` and
# `npx tsc --noEmit` work before the session takes its first turn.
# Idempotent: safe to run on every session start.
set -euo pipefail

# A local checkout is set up by whoever is sitting at it. Only the remote
# container starts from a bare clone with no node_modules.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:?CLAUDE_PROJECT_DIR is not set}"

# `install` rather than `ci` so a warm container reuses what is already
# unpacked instead of deleting node_modules and starting over. `--no-save`
# because the container's npm is a major version behind the one that wrote
# package-lock.json and would otherwise rewrite it on every session, leaving
# the tree dirty before any work has happened.
npm install --no-audit --no-fund --no-save

# Next 16 declares PageProps, LayoutProps and RouteContext globally and emits
# them into .next/types, which is gitignored. Without this step every route,
# page and layout file fails to typecheck on a fresh clone.
npx --no-install next typegen
