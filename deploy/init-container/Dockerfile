FROM ubuntu
ARG CARDANO_NODE_DATA_FOLDER
RUN apt update && apt install -y liblz4-tool jq curl
WORKDIR /root/bin
COPY /init-container/download-cardano-node-db.sh /root/bin
CMD ["/root/bin/download-cardano-node-db.sh"]
