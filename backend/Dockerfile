FROM python:3.11.1

WORKDIR /code

ENV PYTHONUNBUFFERED 1

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 必要なPythonパッケージをインストール
COPY ./requirements.txt /code/
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt


# アプリコードを追加
COPY . /code/

# サーバー起動
# CMD ["python", "main.py", "runserver", "0.0.0.0:8000"]

