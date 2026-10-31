#!/bin/zsh
cd "${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if curl -fsS http://127.0.0.1:4317/api/health >/dev/null 2>&1; then
  open http://localhost:4317
  exit 0
fi
if ! curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && command -v ollama >/dev/null; then
  mkdir -p .data/logs
  nohup ollama serve >.data/logs/ollama.log 2>&1 &
fi
npm run dev &
studio_server_pid=$!
trap 'kill "$studio_server_pid" 2>/dev/null' EXIT INT TERM
for attempt in {1..30}; do
  curl -fsS http://127.0.0.1:4317/api/health >/dev/null 2>&1 && break
  sleep 0.3
done
open http://localhost:4317
wait "$studio_server_pid"
