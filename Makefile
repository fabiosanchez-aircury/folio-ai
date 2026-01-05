.PHONY: up
up:
	docker compose up -d

.PHONY: down
down:
	docker compose down

.PHONY: build
build:
	docker compose build

.PHONY: install
install:
	docker compose exec app yarn install

.PHONY: dev
dev: up install
	docker compose logs -f app

.PHONY: shell
shell:
	docker compose exec app /bin/sh

.PHONY: db
db:
	docker compose exec app yarn prisma db push --force-reset --accept-data-loss
	docker compose exec app yarn db:seed
	@echo "\033[32m✓ Database ready!\033[0m"

.PHONY: db-push
db-push:
	docker compose exec app yarn db:push

.PHONY: db-seed
db-seed:
	docker compose exec app yarn db:seed

.PHONY: logs
logs:
	docker compose logs -f

.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make up        - Start containers in detached mode"
	@echo "  make down      - Stop and remove containers"
	@echo "  make build     - Build containers"
	@echo "  make install   - Install dependencies"
	@echo "  make dev       - Start project and follow logs"
	@echo "  make shell     - Open shell in app container"
	@echo "  make db        - Drop and recreate database from scratch"
	@echo "  make db-push   - Push schema changes to database"
	@echo "  make db-seed   - Run database seed"
	@echo "  make logs      - Follow all container logs"

