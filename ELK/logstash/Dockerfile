ARG ELASTIC_VERSION

FROM docker.elastic.co/logstash/logstash:${ELASTIC_VERSION:-8.17.1}

# 設定ファイルをコピー
COPY config/logstash.yml /usr/share/logstash/config/logstash.yml
COPY pipeline/ /usr/share/logstash/pipeline/