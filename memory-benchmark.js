/*
  Lightweight benchmark to compare memory and throughput characteristics of:
  - Legacy array dedupe (includes + push + shift)
  - Bounded Set+FIFO dedupe (has + add + queue shift + delete)

  Run:
    node --expose-gc memory-benchmark.js
*/

function formatMb (bytes) {
  return (bytes / 1024 / 1024).toFixed(2)
}

function getHeapUsed () {
  return process.memoryUsage().heapUsed
}

function maybeGc () {
  if (global.gc) global.gc()
}

function benchmarkArrayDedupe (ops = 500000, max = 100000) {
  const seen = []
  const start = process.hrtime.bigint()

  for (let i = 0; i < ops; i++) {
    const txid = `tx-${i % (max * 2)}`
    if (!seen.includes(txid)) {
      seen.push(txid)
      if (seen.length > max) seen.shift()
    }
  }

  const end = process.hrtime.bigint()
  return {
    ms: Number(end - start) / 1e6,
    size: seen.length
  }
}

function benchmarkSetDedupe (ops = 500000, max = 100000) {
  const seenSet = new Set()
  const seenQueue = []
  const start = process.hrtime.bigint()

  for (let i = 0; i < ops; i++) {
    const txid = `tx-${i % (max * 2)}`
    if (!seenSet.has(txid)) {
      seenSet.add(txid)
      seenQueue.push(txid)
      if (seenQueue.length > max) {
        const oldest = seenQueue.shift()
        seenSet.delete(oldest)
      }
    }
  }

  const end = process.hrtime.bigint()
  return {
    ms: Number(end - start) / 1e6,
    size: seenSet.size
  }
}

function main () {
  const ops = process.env.BENCH_OPS ? Number(process.env.BENCH_OPS) : 500000
  const max = process.env.BENCH_MAX ? Number(process.env.BENCH_MAX) : 100000

  console.log(`Running benchmark with ops=${ops}, max=${max}`)

  maybeGc()
  const heapBeforeArray = getHeapUsed()
  const arrayResult = benchmarkArrayDedupe(ops, max)
  maybeGc()
  const heapAfterArray = getHeapUsed()

  maybeGc()
  const heapBeforeSet = getHeapUsed()
  const setResult = benchmarkSetDedupe(ops, max)
  maybeGc()
  const heapAfterSet = getHeapUsed()

  const arrayDelta = heapAfterArray - heapBeforeArray
  const setDelta = heapAfterSet - heapBeforeSet

  console.log('\nLegacy array dedupe:')
  console.log(`- time_ms: ${arrayResult.ms.toFixed(2)}`)
  console.log(`- final_size: ${arrayResult.size}`)
  console.log(`- heap_delta_mb: ${formatMb(arrayDelta)}`)

  console.log('\nBounded Set+FIFO dedupe:')
  console.log(`- time_ms: ${setResult.ms.toFixed(2)}`)
  console.log(`- final_size: ${setResult.size}`)
  console.log(`- heap_delta_mb: ${formatMb(setDelta)}`)

  console.log('\nRelative performance:')
  const speedup = arrayResult.ms / setResult.ms
  console.log(`- speedup_x: ${speedup.toFixed(2)}`)
}

main()
