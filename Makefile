.PHONY: help build up down logs shell-backend shell-db migrate createsuperuser seed pwa-install

help:
	@echo "STL Transport & Logistics – available commands:"
	@echo "  make build            Build all containers"
	@echo "  make up               Start all services"
	@echo "  make down             Stop all services"
	@echo "  make logs             Tail logs"
	@echo "  make shell-backend    Bash into backend container"
	@echo "  make shell-db         Open PostgreSQL shell"
	@echo "  make migrate          Run Django migrations"
	@echo "  make createsuperuser  Create Django admin"
	@echo "  make seed             Run initial seed data"
	@echo "  make pwa-install      Generate PWA icons (needs sharp)"

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

shell-backend:
	docker compose exec backend bash

shell-db:
	docker compose exec postgres psql -U stl_user -d stl_db

migrate:
	docker compose exec backend python manage.py migrate

createsuperuser:
	docker compose exec backend python manage.py createsuperuser --noinput \
		--email $(DJANGO_SUPERUSER_EMAIL) \
		|| true

seed:
	docker compose exec backend python manage.py seed_initial_data

pwa-install:
	cd frontend && npx sharp-cli public/icons/icon.svg -o public/icons/icon-192.png resize 192 192
	cd frontend && npx sharp-cli public/icons/icon.svg -o public/icons/icon-512.png resize 512 512