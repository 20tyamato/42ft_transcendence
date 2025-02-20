import logging
import os
from datetime import datetime
from typing import Optional

import aiohttp
from asgiref.sync import async_to_sync


class Logger:
    _instance: Optional["Logger"] = None

    def __new__(cls) -> "Logger":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        self._logstash_url = os.getenv("BACKEND_LOGSTASH_URL")
        if not self._logstash_url:
            raise ValueError(
                "BACKEND_LOGSTASH_URL is not set. please set the environment variable."
            )

        # 標準のロガーの設定
        self._logger = logging.getLogger("pong")
        self._logger.setLevel(logging.INFO)

        # 既存のハンドラーをクリア
        self._logger.handlers = []

        # コンソールハンドラーの設定
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        formatter = logging.Formatter("%(message)s")  # タイムスタンプを削除
        console_handler.setFormatter(formatter)
        self._logger.addHandler(console_handler)

    def _sync_send_to_logstash(self, level: str, message: str) -> None:
        async def _send():
            try:
                log_data = {
                    "timestamp": datetime.now().isoformat(),
                    "level": level,
                    "message": message,
                    "application": "backend",
                }
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        self._logstash_url,
                        headers={"Content-Type": "application/json"},
                        json=log_data,
                        timeout=5,
                    ) as response:
                        if response.status != 200:
                            print(f"Logstashへの送信に失敗: {response.status}")
            except Exception as e:
                print(f"Logstashへの送信中にエラー発生: {str(e)}")

        try:
            async_to_sync(_send)()
        except Exception as e:
            print(f"同期的な実行中にエラー発生: {str(e)}")

    def _format_message(self, level: str, message: str) -> str:
        return f"{datetime.now().isoformat()} - {level.upper()} - {message}"

    def info(self, message: str) -> None:
        formatted_message = self._format_message("INFO", message)
        print(formatted_message)
        self._sync_send_to_logstash("info", message)

    def error(self, message: str) -> None:
        formatted_message = self._format_message("ERROR", message)
        print(formatted_message)
        self._sync_send_to_logstash("error", message)

    def warn(self, message: str) -> None:
        formatted_message = self._format_message("WARNING", message)
        print(formatted_message)
        self._sync_send_to_logstash("warn", message)

    def log(self, message: str) -> None:
        formatted_message = self._format_message("LOG", message)
        print(formatted_message)
        self._sync_send_to_logstash("log", message)


logger = Logger()
