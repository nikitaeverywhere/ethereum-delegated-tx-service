#!/bin/bash

COMPOSE_FILES="-f docker-compose.yml"
NAME_PREFIX=ethereum-delegated-tx

docker-compose -p $NAME_PREFIX $COMPOSE_FILES rm -f
docker-compose -p $NAME_PREFIX $COMPOSE_FILES build --pull
docker-compose -p $NAME_PREFIX $COMPOSE_FILES up -d --force-recreate
docker exec -it $(docker ps --latest --quiet) bash