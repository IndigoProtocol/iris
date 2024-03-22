#!/usr/bin/env bash

set -x

if [[ -z "${CARDANO_NODE_DATA_FOLDER}" ]]; then
  echo "Missing required CARDANO_NODE_DATA_FOLDER, pass it as first param"
  exit 1
fi

if [ ! -d "${CARDANO_NODE_DATA_FOLDER}/db" ]; then
  echo "db missing, downloading"
  rm -fr "${CARDANO_NODE_DATA_FOLDER}/*"
  curl -o - https://downloads.csnapshots.io/snapshots/mainnet/$(curl -s https://downloads.csnapshots.io/snapshots/mainnet/mainnet-db-snapshot.json| jq -r .[].file_name ) \
    | lz4 -c -d - \
    | tar -x -C "${CARDANO_NODE_DATA_FOLDER}"
else
  echo "data folder already exists. Skipping..."
fi

exit 0
