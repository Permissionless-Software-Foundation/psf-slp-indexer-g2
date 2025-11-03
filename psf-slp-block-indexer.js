/*
  Entry point for the SLP block indexer.

  Testing notes:
  - First Genesis tx occurs in block 543376, txid: 545cba6f72a08cbcb08c7d4e8166267942e8cb9a611328805c62fa538e861ba4
  - First Send tx occurs in block 543409, txid: 874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e
  - First Mint tx occurs in block 543614 txid: ee9d3cf5153599c134147e3fac9844c68e216843f4452a1ce15a29452af6db34
  - First NFT tx occurs in block 589808 txid: 3b66b7e0f80473ae9e761892046b843689a1281405504ae6d93a30156aeefeda

*/

// Global npm libraries
import RetryQueue from '@chris.troutner/retry-queue'
import 'dotenv/config'

// Local libraries
import Adapters from './src/adapters/adapters-index.js'
import UseCases from './src/use-cases/use-cases-index.js'
import Controllers from './src/controllers/controllers-index.js'

const EPOCH = 1000 // blocks between backups

async function start () {
  try {
    // Initialize the adapter libraries.
    const adapters = new Adapters()
    await adapters.initAdapters()

    // Initialize the use case libraries.
    const useCases = new UseCases({ adapters })
    await useCases.initUseCases()

    // Initialize the controller libraries.
    const controllers = new Controllers({ useCases, adapters })
    await controllers.initControllers()

    const queue = new RetryQueue()
    let indexState = 'phase0'

    console.log('Starting SLP block indexer...')

    const status = await useCases.state.getStatus()
    console.log('Indexer State: ', status)
    console.log('')
    console.log('Starting Phase 1: Initial Block Download (IBD) - indexing to the tip of the chain.')

    // const blockData = await useCases.indexBlocks.processBlock(status.syncedBlockHeight)
    // console.log('Block data: ', blockData)

    let nextBlockHeight = status.syncedBlockHeight + 1
    let biggestBlockHeight = await queue.addToQueue(adapters.rpc.getBlockCount, {})
    do {
      const start = new Date()

      await useCases.indexBlocks.processBlock(nextBlockHeight)

      // Report the time to process the block
      const end = new Date()
      const blockProcessTime = end.getTime() - start.getTime()
      if (blockProcessTime > 60000) {
        console.log(`Block ${nextBlockHeight} processed in ${blockProcessTime / 1000 / 60} minutes.`)
      } else {
        console.log(`Block ${nextBlockHeight} processed in ${blockProcessTime / 1000} seconds.`)
      }

      // Change phase after processing first block. This prevents unneeded
      // zipping of the database after a restart.
      indexState = 'phase1'

      // Update the synced block height.
      nextBlockHeight = await useCases.state.updateIndexedBlockHeight({ lastIndexedBlockHeight: nextBlockHeight })

      // Shut down elegantly if the 'q' key was detected.
      const shouldStop = controllers.keyboard.stopStatus()
      // console.log('shouldStop: ', shouldStop)
      if (shouldStop) {
        console.log(
          `'q' key detected. Stopping indexing. Last block processed was ${
            nextBlockHeight
          }`
        )
        process.exit(1)
      }

      // Create a zip-file backup every 'epoch' of blocks
      if (nextBlockHeight % EPOCH === 0) {
        console.log(`\n\nCreating zip archive of database at block ${nextBlockHeight}\n`)
        await adapters.dbCtrl.backupDb(nextBlockHeight, EPOCH)
      }

      // Get the block height of the tip of the chain.
      biggestBlockHeight = await queue.addToQueue(adapters.rpc.getBlockCount, {})

    // } while (nextBlockHeight < 589808) // First NFT Genesis tx
    // } while (nextBlockHeight < 543410) // First send
    // } while (nextBlockHeight < 543376) // First Genesis
    // } while (nextBlockHeight < 543614) // First Mint
    // } while (nextBlockHeight < 598098)
    // } while (nextBlockHeight < 922965)
    } while (nextBlockHeight < biggestBlockHeight)

    // Debugging: state the current state of the indexer.
    console.log(`\n\nLeaving ${indexState}`)
    indexState = 'phase2'

    console.log(
      `\n\nIBD has completed. Last block synced: ${nextBlockHeight - 1}\n`
    )

    // Start connection to ZMQ/websocket interface on full node.
    await adapters.zmq.connect()
    console.log('Connected to ZMQ port of full node.')

    // Enable TX indexer here.
    await adapters.txIndexerAdapter.startTxIndexer()
    console.log('TX indexer started.')

    // Enter permanent loop, processing ZMQ input.
    let loopCnt = 0
    do {
      // TODO: add getBlockCounty to a auto-retry in case it fails.
      let blockHeight = await queue.addToQueue(adapters.rpc.getBlockCount, {})
      // console.log('Current chain block height: ', blockHeight)
      // console.log(`status.syncedBlockHeight: ${status.syncedBlockHeight}`)

      // On a new block, process it.
      const block = adapters.zmq.getBlock()
      if (block) {
        console.log('block: ', block)

        const blockHeader = await queue.addToQueue(adapters.rpc.getBlockHeader, block.hash)
        blockHeight = blockHeader.height
        console.log(`processing block ${blockHeight}`)

        // Update the status DB.
        status.syncedBlockHeight = blockHeight
        status.chainBlockHeight = blockHeight
        await adapters.statusDb.updateStatus(status)

        // Process the block.
        await useCases.indexBlocks.processBlock(blockHeight)
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
    console.error('Error in psf-slp-block-indexer.js/start(): ', err)
    process.exit(1)
  }
}
start()
