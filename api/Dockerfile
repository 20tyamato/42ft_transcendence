FROM python:3.11.1

WORKDIR /code

ENV PYTHONUNBUFFERED 1
ENV PATH="/root/.local/bin:$PATH"

# poetryのインストールと設定
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    poetry config virtualenvs.create false

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# プロジェクト全体をコピー
COPY . .

# 依存関係のインストール
RUN poetry install --no-interaction --no-ansi --no-root

# サーバー起動
CMD ["poetry", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]

