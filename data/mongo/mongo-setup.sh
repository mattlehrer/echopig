#!/usr/bin/env bash
echo "Creating mongo users..."
mongo admin --host localhost -u $MONGO_ROOT_USERNAME -p $MONGO_ROOT_PASSWORD --eval "db.createUser({user: '${MONGO_EPDB_USERNAME}', pwd: '${MONGO_EPDB_PASSWORD}', roles: [{role: 'readWrite', db: 'echopig'}]});"
echo "Mongo echopig db user created."