# Container name variables
PROJECT_NAME := $(shell basename $(CURDIR))
API_CONTAINER := $(PROJECT_NAME)-api-1
FRONTEND_CONTAINER := $(PROJECT_NAME)-frontend-1
DB_CONTAINER := $(PROJECT_NAME)-db-1
HOST_IP := $(shell ip addr show | grep 'inet ' | grep -v '127.0.0.1' | grep -v '172.' | grep -v 'docker' | awk '{print $$2}' | cut -d/ -f1 | head -n1)

all: up

setup-env:
	@echo "Setting up environment variables..."
	@echo "HOST_IP=$(HOST_IP)" > .env
	@echo "Creating frontend/.env..."
	@echo "VITE_API_URL=http://$(HOST_IP):8000" > frontend/.env
	@echo "VITE_WS_URL=ws://$(HOST_IP):8000" >> frontend/.env
	@echo "Environment files created successfully."

check-env:
	@echo "Current HOST_IP: $(HOST_IP)"
	@echo "Current frontend/.env contents:"
	@cat frontend/.env || echo "frontend/.env does not exist"

up: setup-env
	HOST_IP=$(HOST_IP) docker compose up

down:
	docker compose down

re: down up

clean: down
	docker system prune -af --volumes

fbuild: setup-env
	HOST_IP=$(HOST_IP) docker compose build --no-cache && docker compose up

test:
	docker exec -it $(API_CONTAINER) python manage.py test pong

makemigrations:
	docker exec -it $(API_CONTAINER) python manage.py makemigrations

showmigrations:
	docker exec -it $(API_CONTAINER) python manage.py showmigrations

migrate:
	docker exec -it $(API_CONTAINER) python manage.py migrate

# テストデータをDBに入れる
loaddata:
	docker exec -it $(API_CONTAINER) python manage.py loaddata initial_data

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

check-ip:
	@echo "HOST_IP is set to: $(HOST_IP)"

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

.PHONY: all up down re clean fbuild test makemigrations migrate ruff super_ruff lint api_in front_in db_in api_logs front_logs db_logs help submit setup-env check-env
