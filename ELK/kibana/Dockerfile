ARG ELASTIC_VERSION

FROM docker.elastic.co/kibana/kibana:${ELASTIC_VERSION:-8.17.1}

# 設定ファイルをコピー
COPY config/kibana.yml /usr/share/kibana/config/kibana.yml