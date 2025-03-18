ARG ELASTIC_VERSION

FROM docker.elastic.co/elasticsearch/elasticsearch:${ELASTIC_VERSION:-8.17.1}

# 設定ファイルをコピー
COPY config/elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml