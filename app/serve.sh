#!/bin/sh
# Локальный сервер для приложения. Нужен для PWA: service worker и установка
# на домашний экран не работают при открытии файла напрямую (file://).
PORT="${1:-8080}"
DIR="$(cd "$(dirname "$0")" && pwd)"
echo "ML Journey: http://localhost:$PORT"
echo "Ctrl+C — остановить"
exec python3 -m http.server "$PORT" --directory "$DIR"
