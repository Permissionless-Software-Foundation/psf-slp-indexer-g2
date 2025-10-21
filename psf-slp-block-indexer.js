/*
  Entry point for the SLP block indexer.

  Testing notes:
  - First Genesis tx occurs in block 543376, txid: 545cba6f72a08cbcb08c7d4e8166267942e8cb9a611328805c62fa538e861ba4
  - First Send tx occurs in block 543409, txid: 874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e
  - First Mint tx occurs in block 543614 txid: ee9d3cf5153599c134147e3fac9844c68e216843f4452a1ce15a29452af6db34
  - First NFT tx occurs in block 589808 txid: 3b66b7e0f80473ae9e761892046b843689a1281405504ae6d93a30156aeefeda

*/

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

    console.log('Starting SLP block indexer...')

    const status = await useCases.state.getStatus()
    console.log('Indexer State: ', status)
    console.log('')

    // const blockData = await useCases.indexBlocks.processBlock(status.syncedBlockHeight)
    // console.log('Block data: ', blockData)

    let nextBlockHeight = status.syncedBlockHeight + 1
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
    // } while (nextBlockHeight < 589808) // First NFT Genesis tx
    // } while (nextBlockHeight < 543410) // First send
    // } while (nextBlockHeight < 543376) // First Genesis
    // } while (nextBlockHeight < 543614) // First Mint
    // } while (nextBlockHeight < 598098)
    } while (nextBlockHeight < 700003)

    console.log('\n\nIndexing complete.')
    process.exit(0)
  } catch (err) {
    console.error('Error in psf-slp-block-indexer.js/start(): ', err)
    process.exit(1)
  }
}
start()
