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

ruff:
	docker exec -it ft_transcendence-api-1 poetry run ruff check .

lint:
	cd frontend && npm run lint

.PHONY: all up down re clean fbuild ruff
