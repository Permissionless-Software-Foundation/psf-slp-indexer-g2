#!/bin/bash

#export RPC_IP=172.17.0.1
export RPC_IP=192.168.1.65
export RPC_PORT=8332
export ZMQ_PORT=28332
export RPC_USER=bitcoin
export RPC_PASS=password

npm run block-indexer
