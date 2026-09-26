# make run        — поднять сервер и открыть приложение в браузере
# make run PORT=3000 — то же на другом порту

PORT ?= 8080

.PHONY: run

run:
	@( sleep 1; open "http://localhost:$(PORT)" ) &
	@./app/serve.sh $(PORT)
