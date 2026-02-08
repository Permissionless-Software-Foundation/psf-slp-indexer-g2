# psf-slp-indexer-g2

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

## Overview

This is a Node.js application that indexes blocks and transactions on the Bitcoin Cash (BCH) blockchain. It tracks SLP token transactions (Genesis, Mint, Send, NFT Genesis) and Pin Claim transactions. Indexed data is stored in the [psf-slp-db](https://github.com/Permissionless-Software-Foundation/psf-slp-db) LevelDB application via its REST API.

The indexer runs as two separate processes:

- **Block Indexer** — Performs an Initial Block Download (IBD) to catch up to the tip of the chain, then monitors the full node's ZMQ interface for new blocks. Creates periodic zip-file backups of the database. After IBD completes, it signals the TX Indexer to start.
- **TX Indexer** — Waits for the Block Indexer to finish IBD, then monitors the full node's ZMQ interface for new unconfirmed transactions and indexes them in real time.

## Requirements

- node **^20.x**
- npm **^10.x**
- Docker **^24.0.7**
- Docker Compose **^1.27.4**
- A running BCH full node with RPC and ZMQ enabled
- A running [psf-slp-db](https://github.com/Permissionless-Software-Foundation/psf-slp-db) instance

## Installation

### Production Environment

The [production/docker](./production/docker) directory contains Dockerfiles and a `docker-compose.yml` for building a production deployment. The compose file starts three containers: `slp-db`, `block-indexer`, and `tx-indexer`.

```bash
cd production/docker
docker-compose build
docker-compose up -d
```

- You can bring the containers down with `docker-compose down`
- You can bring the containers back up with `docker-compose up -d`.

Each container mounts a `.env` file and a startup shell script from the host. See the Configuration section below for details on the environment variables.

### Development Environment

A development environment will allow you to modify the code on-the-fly and contribute to the code base of this repository.

```bash
git clone https://github.com/Permissionless-Software-Foundation/psf-slp-indexer-g2
cd psf-slp-indexer-g2
npm install
```

Start the block indexer:

```bash
npm run block-indexer
```

Start the TX indexer (in a separate terminal):

```bash
npm run tx-indexer
```

Shell scripts are also provided for convenience: `slp-block.sh` and `slp-tx.sh`.

### Configuration

This app is configured using environment variables. Create a `.env` file in the project root and set the values as needed. The `.env` file is loaded automatically at startup. All configuration is defined in [config/index.js](./config/index.js).

#### psf-slp-db Connection

| Variable | Default | Description |
|---|---|---|
| `PSF_SLP_DB_URL` | `http://localhost:5020` | URL of the psf-slp-db REST API. The indexer reads and writes all indexed data through this endpoint. |

#### Full Node RPC

These settings connect the indexer to a BCH full node for retrieving block and transaction data.

| Variable | Default | Description |
|---|---|---|
| `RPC_IP` | `172.17.0.1` | IP address of the BCH full node RPC server. The default is the Docker bridge gateway, suitable for containers accessing a full node on the host. |
| `RPC_PORT` | `8332` | TCP port of the full node's RPC interface. |
| `RPC_USER` | `bitcoin` | Username for RPC authentication. |
| `RPC_PASS` | `password` | Password for RPC authentication. |

#### Full Node ZMQ

| Variable | Default | Description |
|---|---|---|
| `ZMQ_PORT` | `28332` | TCP port of the full node's ZMQ interface. Used to receive real-time notifications of new blocks and transactions. |

#### TX Indexer REST API

The block indexer communicates with the TX indexer over a small internal REST API to signal when IBD is complete.

| Variable | Default | Description |
|---|---|---|
| `TX_REST_API_PORT` | `5454` | TCP port the TX indexer listens on for its internal REST API. |
| `TX_REST_API_IP` | `localhost` | IP address the block indexer uses to reach the TX indexer's REST API. Change this when the two processes run in separate containers. |

#### Token Blacklist

| Variable | Default | Description |
|---|---|---|
| `DISABLE_BLACKLIST` | *(unset)* | Set to any value to disable the built-in token blacklist. When unset, several known problematic tokens (FlexUSD, FLEX Coin, TribeOS, Honk, SOUR) are automatically excluded from indexing. |

#### Backups

| Variable | Default | Description |
|---|---|---|
| `EXIT_ON_MISSING_BACKUP` | `false` | Controls behavior when the indexer is fully synced but a backup file is missing. Set to `true` to exit the process instead of rolling back to genesis. Any other value (or unset) will allow the rollback. |

#### Pin Service Webhook

| Variable | Default | Description |
|---|---|---|
| `PIN_API_URL` | `http://172.17.0.1:5031` | URL of the ipfs-file-pin-service API. When a Pin Claim transaction is detected, the indexer sends a webhook to this endpoint. |

## File Structure

The file layout of this repository follows the principles of [Clean Architecture](https://christroutner.github.io/trouts-blog/blog/clean-architecture). Understanding the principles laid out in that article will help developers navigate the code base.

## Usage

- `npm run block-indexer` Start the block indexer
- `npm run tx-indexer` Start the TX indexer
- `npm test` Run mocha tests
- `npm run lint` Run standard linter with auto-fix

## License

[GPL v3](./LICENSE)
