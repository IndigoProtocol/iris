FROM node:18.16

# Set the working directory in the container
WORKDIR /usr/src/app

COPY . .

RUN npm install && npm run build --experimental-specifier-resolution=node && \
    chmod +x entrypoint.sh && \
    mkdir -p ./logs/api/ && \
    mkdir -p ./logs/indexer/


EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]