all: up

up:
	docker compose up --build

down:
	docker compose down

re: down up

clean: down
	docker system prune -af --volumes

fbuild:
	docker compose up --build --no-cache

test:
	docker exec -it ft_transcendence-api-1 python manage.py test pong

ruff:
	docker exec -it ft_transcendence-api-1 poetry run ruff check .

lint:
	cd frontend && npm run lint

api_in:
	docker exec -it ft_transcendence-api-1 bash

api_logs:
	docker logs -f ft_transcendence-api-1

frontend_in:
	docker exec -it ft_transcendence-frontend-1 bash

frontend_logs:
	docker logs -f ft_transcendence-frontend-1

db_in:
	docker exec -it ft_transcendence-db-1 bash

db_logs:
	docker logs -f ft_transcendence-db-1

.PHONY: all up down re clean fbuild ruff lint api_in api_logs frontend_in frontend_logs db_in db_logs
