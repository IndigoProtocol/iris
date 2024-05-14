#/bin/sh

## Utilize Demeter for the ogmios instances
export OGMIOS_HOST=dmtr_ogmios1d4z857z58yuxvuzhg9ckws66v3pyunjj23mszphy75.mainnet-v5.ogmios-m1.demeter.run
export OGMIOS_PORT=443
export OGMIOS_TLS=true

## MySQL Database
export MYSQL_USER=user
export MYSQL_PASSWORD=password
export MYSQL_ROOT_PASSWORD=rootpassword
export MYSQL_DATABASE=iris

## GitHub Access Token
export GITHUB_ACCESS_TOKEN=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

docker compose up --no-deps --build