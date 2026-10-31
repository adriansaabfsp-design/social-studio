#!/bin/zsh
set -e
cd "${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
mkdir -p .data/bin .data/logs
command -v swift >/dev/null || { print 'Apple command line tools are required for OCR.'; exit 1; }
swiftc -O tools/ocr.swift -o .data/bin/studio-ocr
if ! command -v ffmpeg >/dev/null; then brew install ffmpeg; fi
if ! command -v ollama >/dev/null; then brew install ollama; fi
if ! command -v uv >/dev/null; then brew install uv; fi
if ! curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  nohup ollama serve >.data/logs/ollama.log 2>&1 &
fi
# yt-dlp needs Python 3.11 or newer; rebuild older environments.
if [[ ! -x .venv/bin/python ]] || ! .venv/bin/python -c 'import sys; sys.exit(sys.version_info < (3, 11))'; then rm -rf .venv; uv venv --python 3.11 .venv; fi
uv pip install --python .venv/bin/python --upgrade yt-dlp
[[ -d .voice-venv ]] || uv venv --python 3.11 .voice-venv
UV_HTTP_TIMEOUT=300 uv pip install --python .voice-venv/bin/python mlx-whisper
ollama pull qwen3-vl:2b
print 'Local tools are prepared. Check Settings in Social Studio.'
