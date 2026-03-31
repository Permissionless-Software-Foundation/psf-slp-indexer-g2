# Memory Optimization Session Summary (2026-03-31)

This note summarizes the memory-focused refactors made to the SLP indexer codebase, with emphasis on what changed and why.

## Why this work was done

The indexers had several high-pressure in-memory structures that could either:

- grow too large (or unbounded),
- trigger high GC pressure and allocation churn,
- and/or perform expensive O(n) operations in hot loops.

The goal was to reduce memory consumption and improve runtime stability without changing indexing correctness.

## High-level outcomes

- Replaced array-based TX dedupe with bounded O(1) membership checks.
- Added hard caps to ZMQ ingestion queues.
- Reduced temporary array churn in block filtering/sorting hot paths.
- Replaced array scans with `Map` for retry tracking.
- Added bounded eviction for transaction caches.
- Added configuration knobs and runtime observability for queue/cache behavior.
- Added validation artifacts (`memory-benchmark.js`, `memory-validation.md`).

## File-by-file changes

### 1) `psf-slp-tx-indexer.js`

#### What changed

- Replaced:
  - `seenTxs = []`
  - `seenTxs.includes(tx)` for membership
  - `seenTxs.shift()` for eviction
- With:
  - `seenTxs = new Set()`
  - `seenTxQueue = []` (FIFO order)
  - bounded size via `config.seenTxMax`

#### Why

The previous pattern did linear scans and linear evictions on a potentially large array (up to 100k entries).  
`Set` gives O(1) average membership checks, reducing CPU and heap churn in the tx hot path.

---

### 2) `src/adapters/zmq.js`

#### What changed

- Added queue caps:
  - `txQueue` bounded by `config.zmqTxQueueMax`
  - `blockQueue` bounded by `config.zmqBlockQueueMax`
- Added overflow policy:
  - drop oldest item when cap is exceeded
- Added counters/logging:
  - `txQueueDrops`
  - `blockQueueDrops`

#### Why

These queues were unbounded. Under burst load, producer throughput can exceed consumer throughput, causing unbounded memory growth and degraded GC behavior.

---

### 3) `src/use-cases/index-blocks.js`

#### What changed

- Replaced retry/error bookkeeping from array/filter lookups:
  - `errors = []` + `errors.filter(...)`
- With:
  - `errors = new Map()` keyed by txid

#### Why

This avoids repeated array scans in error/retry paths, reducing temporary allocations and CPU overhead while preserving retry semantics.

---

### 4) `src/use-cases/filter-block.js`

#### What changed

- Reduced array-copy heavy patterns in sorting logic:
  - removed repeated `concat` + dedupe rebuilds,
  - reduced repeated `filter` passes for removals,
  - switched removal in `forwardDag()` to `splice` in-place when suitable.
- Kept public output contract unchanged:
  - `{ combined, nonSlpTxs }`

#### Why

The filter/sort phase runs per block and can process many txids. Reducing array reconstruction lowers peak allocations and GC pressure.

---

### 5) `src/adapters/transaction.js`

#### What changed

- Added bounded eviction support to:
  - `tokenCache`
  - `txCache`
- Added FIFO key tracking arrays and eviction counters.
- Added configurable max sizes from config:
  - `tokenCacheMax`
  - `txCacheMax`
- Preserved existing high-water hard-reset behavior for compatibility (`> 1,000,000` insertions).

#### Why

These caches are large object maps and can dominate memory over long runs. Bounded eviction smooths memory growth and avoids huge heap footprints.

---

### 6) `src/adapters/cache.js`

#### What changed

- Added bounded local cache eviction via FIFO key tracking.
- Added:
  - `localTxCacheMax`
  - eviction counters/logging
- Preserved compatibility behavior for existing tests/counters, including hard reset threshold.

#### Why

The local in-memory tx cache previously relied on very large reset thresholds; bounded eviction keeps steady-state memory more predictable.

---

### 7) `config/index.js`

#### What changed

Added env-configurable limits:

- `SEEN_TX_MAX`
- `ZMQ_TX_QUEUE_MAX`
- `ZMQ_BLOCK_QUEUE_MAX`
- `TX_CACHE_MAX`
- `TOKEN_CACHE_MAX`
- `LOCAL_TX_CACHE_MAX`

#### Why

Operational tuning needs to be environment-specific. These knobs let you trade memory usage vs. cache hit rate/throughput.

## Validation performed in this session

- Unit tests executed after changes: **passing** (`npm test`).
- Lint diagnostics on changed files: **no linter errors**.
- Added and executed a micro-benchmark:
  - `memory-benchmark.js`
  - sample run (`BENCH_OPS=50000`, `BENCH_MAX=10000`) showed very large speedup for dedupe path using `Set`+FIFO versus legacy array pattern.

## New supporting docs/tools added

- `memory-benchmark.js`
  - quick local benchmark for dedupe strategy performance and heap delta.
- `memory-validation.md`
  - checklist and procedure to compare baseline vs capped runtime behavior.

## Operational notes for developers

- Start with conservative defaults in production and tune upward only if hit-rate/throughput suffers.
- Watch these signals during soak runs:
  - queue depth and drop counters (`zmq`),
  - cache eviction counters,
  - RSS/heap trends,
  - effective tx/sec and tail latency.
- If drops/evictions are frequent and throughput is impacted, raise limits incrementally.

