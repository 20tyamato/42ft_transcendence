# Container name variables
PROJECT_NAME := $(shell basename $(CURDIR))
API_CONTAINER := $(PROJECT_NAME)-api-1
FRONTEND_CONTAINER := $(PROJECT_NAME)-frontend-1
DB_CONTAINER := $(PROJECT_NAME)-db-1

all: up

setup: hostip ssl-certs elk-setup

up: setup elk-up
	docker compose up

upbuild: setup elk-upbuild
	docker compose up --build

down: elk-down
	docker compose down

re: clean upbuild

clean: down
	docker volume rm $(shell docker volume ls -q | grep "^$(PROJECT_NAME)") || true
	docker system prune -f --volumes
	@echo "Removing SSL certificates..."
	@rm -rf certs

fbuild: hostip
	docker compose build --no-cache && docker compose up

# ------------------------------
# ELK
# ------------------------------

elk-setup:
	docker network create ft_transcendence_app-network || true
	docker compose -f docker-compose.elk.yml up setup

elk-up:
	docker compose -f docker-compose.elk.yml up -d

elk-upbuild:
	docker compose -f docker-compose.elk.yml up --build -d

elk-down:
	docker compose -f docker-compose.elk.yml down

elk-reload:
	docker compose -f docker-compose.elk.yml down
	docker compose -f docker-compose.elk.yml build --no-cache
	docker compose -f docker-compose.elk.yml up -d

# ------------------------------
# Utilities
# ------------------------------

# SSL certificate generation
ssl-certs:
	@echo "Generating SSL certificates..."
	@chmod +x scripts/generate_certs.sh
	@./scripts/generate_certs.sh

ssl-check:
	@echo "Checking SSL certificate..."
	@if [ -f certs/server.crt ]; then \
		echo "Certificate exists. Details:"; \
		openssl x509 -in certs/server.crt -text -noout | grep "Subject:\\|Issuer:\\|Validity"; \
	else \
		echo "Certificate does not exist. Run 'make ssl-certs' to generate it."; \
	fi

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
	docker exec -it $(API_CONTAINER) poetry run ruff check . --fix && docker exec -it $(API_CONTAINER) poetry run ruff format .

super_ruff:
	docker exec -it $(API_CONTAINER) poetry run ruff check .

hash:
	docker exec -it $(API_CONTAINER) python manage.py create_password_hash $(string)

lint:
	docker exec -it $(FRONTEND_CONTAINER) npm run lint:fix

api_in:
	docker exec -it $(API_CONTAINER) bash

front_in:
	docker exec -it $(FRONTEND_CONTAINER) bash

hostip:
	@scripts/setup-host-ip.sh

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
	@echo " elk-setup - setup ELK server"
	@echo " elk-up - up elk"
	@echo " hostip - set HOST_IP in .env"
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

.PHONY: all up down re clean fbuild test makemigrations migrate ruff super_ruff lint api_in front_in db_in api_logs front_logs db_logs help submit ssl-certs ssl-check
