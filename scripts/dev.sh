#!/usr/bin/env bash
set -e

pnpm --filter ./frontend run dev & p1=$!
uv run python -m backend.src.main & p2=$!

trap "kill $p1 $p2" EXIT

wait