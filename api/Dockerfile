FROM python:3.11.1

USER root
WORKDIR /code

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/root/.local/bin:$PATH"
ENV DJANGO_ENV=development


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
RUN --mount=type=cache,target=/root/.cache/pip \
    poetry install --no-interaction --no-ansi --no-root

# watchmanのインストール
RUN pip install watchdog watchdog[watchmedo]

# エントリーポイントスクリプトに実行権限を付与
RUN chmod +x entrypoint.sh

# サーバー起動
ENTRYPOINT ["./entrypoint.sh"]
