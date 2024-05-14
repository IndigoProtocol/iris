#!/bin/bash

env

# Check the value of the RUN_APP environment variable
if [ "$RUN_APP" == "indexer" ]; then
  npm run indexer
elif [ "$RUN_APP" == "api" ]; then
  npm run api
else
  echo "Error: Unknown application specified"
  exit 1
fi