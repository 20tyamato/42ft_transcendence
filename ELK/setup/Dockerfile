ARG ELASTIC_VERSION

FROM docker.elastic.co/elasticsearch/elasticsearch:${ELASTIC_VERSION:-8.17.1}

# 必要なスクリプトと設定ファイルをコピー
COPY entrypoint.sh /entrypoint.sh
COPY lib.sh /lib.sh
COPY roles/ /roles/
COPY policies/ /policies/
COPY templates/ /templates/

# 実行権限を付与
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]