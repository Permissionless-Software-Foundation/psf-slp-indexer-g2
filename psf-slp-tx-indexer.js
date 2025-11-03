/*
  This is the main entry point for the SLP TX indexer.
*/

// Global npm libraries
import RetryQueue from '@chris.troutner/retry-queue'
import 'dotenv/config'

// Local libraries
import Adapters from './src/adapters/adapters-index.js'
import UseCases from './src/use-cases/use-cases-index.js'
import Controllers from './src/controllers/controllers-index.js'

// const EPOCH = 1000 // blocks between backups

async function start () {
  try {
    const queue = new RetryQueue()
    const adapters = new Adapters()
    const useCases = new UseCases({ adapters })
    const controllers = new Controllers({ useCases, adapters })
    await controllers.initControllers()
    await controllers.startTxRESTController()

    console.log('Starting SLP TX indexer...')

    let runTxIndexer = false
    const seenTxs = []

    // Loop until the TX is started via REST API.
    do {
      await useCases.utils.sleep(2000)

      runTxIndexer = await controllers.txRESTController.runTxIndexing
      if (runTxIndexer) {
        console.log('TX Indexer triggered from REST API!')

        break
      }
    } while (1)

    // Start connection to ZMQ/websocket interface on full node.
    await adapters.zmq.connect()
    console.log('Connected to ZMQ port of full node.')

    let loopCnt = 0
    do {
      const blockHeight = await queue.addToQueue(adapters.rpc.getBlockCount, {})

      // On a new transaction, process it.
      // tx is a TXID.
      const tx = adapters.zmq.getTx()

      if (tx) {
        // console.log('tx: ', tx)
        try {
          const inData = {
            tx,
            blockHeight
          }

          // When a block comes in over ZMQ, it triggers the TX indexer to process each
          // TX in the block. Checking the TXID against the PTxDB is really slow. This
          // is a quick in-memory check, which is much faster.
          if (seenTxs.includes(tx)) {
            // If the TXID has already been seen, skip it.
            continue
          } else {
            seenTxs.push(tx)
            if (seenTxs.length > 100000) {
              seenTxs.shift()
            }
          }

          // console.log(`inData: ${JSON.stringify(inData, null, 2)}`)
          await useCases.indexBlocks.processTx(inData)
        } catch (err) {
          /* exit quietly */
        }
      }

      // Periodically print to the console to indicate that the ZMQ is being
      // monitored.
      loopCnt++
      if (loopCnt > 100) {
        loopCnt = 0
        const now = new Date()
        console.log(`Checked ZMQ. ${now.toLocaleString()}, block height: ${blockHeight}`)
      }

      // Wait a few seconds between loops.
      await useCases.utils.sleep(500)
    } while (1)
  } catch (err) {
    console.error('Error in psf-slp-tx-indexer.js: ', err.message)
    process.exit(1)
  }
}

start()
