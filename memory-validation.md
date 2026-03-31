# Memory Validation Checklist

This repository now includes bounded queue/cache controls:

- `SEEN_TX_MAX`
- `ZMQ_TX_QUEUE_MAX`
- `ZMQ_BLOCK_QUEUE_MAX`
- `TX_CACHE_MAX`
- `TOKEN_CACHE_MAX`
- `LOCAL_TX_CACHE_MAX`

## Quick Local Validation

1. Run tests:

```bash
npm test
```

2. Run dedupe micro-benchmark:

```bash
BENCH_OPS=50000 BENCH_MAX=10000 node --expose-gc memory-benchmark.js
```

## Runtime Comparison Procedure

1. Baseline run with large/unbounded-like settings (or pre-change build).
2. Capped run with conservative settings, e.g.:

```bash
SEEN_TX_MAX=100000 \
ZMQ_TX_QUEUE_MAX=50000 \
ZMQ_BLOCK_QUEUE_MAX=1000 \
TX_CACHE_MAX=100000 \
TOKEN_CACHE_MAX=100000 \
LOCAL_TX_CACHE_MAX=100000 \
npm run block-indexer
```

3. Compare:
   - resident set size (RSS)
   - heap used / heap total
   - queue drop counters from `zmq`
   - cache eviction counters from adapters
   - effective throughput (tx/sec)

## Acceptance Targets

- Memory remains bounded over long runs (no monotonic growth).
- No indexing correctness regression.
- Throughput is stable or improved under burst load.
