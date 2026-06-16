.PHONY: env install dev build db db-stop db-shell docker-up docker-down docker-build logs clean setup backup backup-local cron-setup cron-remove cron-status help

# ── Первичная настройка ────────────────────────────────────────────
## Скопировать .env.example → .env (не перезаписывает если уже есть)
env:
	@if [ -f .env ]; then \
		echo ".env уже существует, пропускаю"; \
	else \
		cp .env.example .env && echo ".env создан из .env.example"; \
	fi

## Установить зависимости
install:
	npm install

## Полная первичная настройка: env + install + запуск БД
setup: env install db
	@echo ""
	@echo "Готово! Запусти: make dev"

# ── Разработка ─────────────────────────────────────────────────────
## Запустить dev-сервер (Vite + API вместе) — БД поднимается автоматически
dev:
	docker compose up db -d
	npm run dev

## Собрать production-билд
build:
	npm run build

# ── База данных (Docker) ────────────────────────────────────────────
## Запустить только PostgreSQL в фоне
db:
	docker compose up db -d

## Остановить PostgreSQL
db-stop:
	docker compose stop db

## Подключиться к БД через psql
db-shell:
	docker compose exec db psql -U dikanish -d dikanish

# ── Docker (полный стек) ────────────────────────────────────────────
## Собрать и запустить всё (app + db) через Docker
docker-up:
	docker compose up --build -d

## Остановить и удалить контейнеры
docker-down:
	docker compose down

## Только пересобрать образ
docker-build:
	docker compose build

## Логи приложения в Docker
logs:
	docker compose logs -f app

# ── Резервные копии ────────────────────────────────────────────
## Бэкап БД через Docker (для локальной разработки)
backup-local:
	@mkdir -p backups
	docker compose exec db pg_dump -U dikanish dikanish | gzip > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql.gz
	@echo "Готово: backups/backup_$(shell date +%Y%m%d_%H%M%S).sql.gz"

## Бэкап через pg_dump (для VPS с DATABASE_URL в .env)
backup:
	@bash scripts/backup.sh

# ── Cron на VPS ────────────────────────────────────────────────────
VPS_HOST ?= root@193.187.94.98
CRON_JOB  = 0 3 * * * /var/www/dikanish/scripts/backup.sh >> /var/www/dikanish/backups/backup.log 2>&1

## Добавить cron-задачу бэкапа на VPS (ежедневно в 03:00)
cron-setup:
	@ssh $(VPS_HOST) '\
		crontab -l 2>/dev/null | grep -qF "dikanish/scripts/backup.sh" \
		&& echo "Cron уже настроен" \
		|| { (crontab -l 2>/dev/null; echo "$(CRON_JOB)") | crontab - && echo "Cron добавлен: $(CRON_JOB)"; }'

## Удалить cron-задачу бэкапа с VPS
cron-remove:
	@ssh $(VPS_HOST) '\
		crontab -l 2>/dev/null | grep -vF "dikanish/scripts/backup.sh" | crontab - \
		&& echo "Cron удалён"'

## Показать текущий crontab на VPS
cron-status:
	@ssh $(VPS_HOST) 'crontab -l 2>/dev/null || echo "Crontab пуст"'

# ── Прочее ─────────────────────────────────────────────────────────
## Удалить dist/ и node_modules/
clean:
	rm -rf dist node_modules

## Показать список доступных команд
help:
	@echo ""
	@echo "  make env          — создать .env из .env.example"
	@echo "  make install      — npm install"
	@echo "  make setup        — env + install + запуск БД (первый раз)"
	@echo "  make dev          — запустить локально (Vite + API)"
	@echo "  make build        — собрать production-билд"
	@echo "  make db           — запустить PostgreSQL (Docker, фон)"
	@echo "  make db-stop      — остановить PostgreSQL"
	@echo "  make db-shell     — psql в контейнере"
	@echo "  make docker-up    — поднять весь стек через Docker"
	@echo "  make docker-down  — остановить Docker-стек"
	@echo "  make logs         — логи app-контейнера"
	@echo "  make backup-local — бэкап БД через Docker (локально)"
	@echo "  make backup       — бэкап БД через pg_dump (.env / VPS)"
	@echo "  make cron-setup   — добавить авто-бэкап на VPS (03:00 каждую ночь)"
	@echo "  make cron-remove  — удалить cron-задачу с VPS"
	@echo "  make cron-status  — показать crontab на VPS"
	@echo "  make clean        — удалить dist/ и node_modules/"
	@echo ""
