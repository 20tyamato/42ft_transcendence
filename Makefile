# Container name variables
PROJECT_NAME := $(shell basename $(CURDIR))
API_CONTAINER := $(PROJECT_NAME)-api-1
FRONTEND_CONTAINER := $(PROJECT_NAME)-frontend-1
DB_CONTAINER := $(PROJECT_NAME)-db-1

all: up

up:
	docker compose up

down:
	docker compose down

re: down up

clean: down
	docker system prune -af --volumes

fbuild:
	docker compose up --build --no-cache

test:
	docker exec -it $(API_CONTAINER) python manage.py test pong

makemigrations:
	docker exec -it $(API_CONTAINER) python manage.py makemigrations

migrate:
	docker exec -it $(API_CONTAINER) python manage.py migrate

ruff:
	docker exec -it $(API_CONTAINER) poetry run ruff check . --fix

super_ruff:
	docker exec -it $(API_CONTAINER) poetry run ruff check .

lint:
	cd frontend && npm run lint

api_in:
	docker exec -it $(API_CONTAINER) bash

front_in:
	docker exec -it $(FRONTEND_CONTAINER) bash

db_in:
	docker exec -it $(DB_CONTAINER) bash

api_logs:
	docker logs -f $(API_CONTAINER)

front_logs:
	docker logs -f $(FRONTEND_CONTAINER)

db_logs:
	docker logs -f $(DB_CONTAINER)

submit:
	@echo "=============================="
	make migrate
	@echo "=============================="
	make lint
	@echo "=============================="
	make ruff
	@echo "=============================="
	make test

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo " all - up"
	@echo " up - docker compose up"
	@echo " down - docker compose down"
	@echo " re - down up"
	@echo " clean - down and docker system prune"
	@echo " fbuild - docker compose up --build --no-cache"
	@echo " test - run tests"
	@echo " makemigrations - make migrations"
	@echo " migrate - apply migrations"
	@echo " ruff - run ruff check"
	@echo " lint - run lint"
	@echo " api_in - enter api container"
	@echo " front_in - enter frontend container"
	@echo " db_in - enter db container"
	@echo " api_logs - show api logs"
	@echo " front_logs - show frontend logs"
	@echo " db_logs - show db logs"
	@echo ""
	@echo "Before Submission"
	@echo " make migrate"
	@echo " make lint"
	@echo " make ruff"
	@echo " make test"

.PHONY: all up down re clean fbuild test makemigrations migrate ruff super_ruff lint api_in front_in db_in api_logs front_logs db_logs help
