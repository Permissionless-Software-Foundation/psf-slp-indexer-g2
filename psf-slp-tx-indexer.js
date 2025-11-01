/*
  This is the main entry point for the SLP TX indexer.
*/

// Global npm libraries
// import RetryQueue from '@chris.troutner/retry-queue'

// Local libraries
import Adapters from './src/adapters/adapters-index.js'
import UseCases from './src/use-cases/use-cases-index.js'
import Controllers from './src/controllers/controllers-index.js'

// const EPOCH = 1000 // blocks between backups

async function start () {
  try {
    const adapters = new Adapters()
    const useCases = new UseCases({ adapters })
    const controllers = new Controllers({ useCases, adapters })
    await controllers.initControllers()
    await controllers.startTxRESTController()

    console.log('Starting SLP TX indexer...')

    let runTxIndexer = false
    do {
      await useCases.utils.sleep(1000)

      runTxIndexer = await controllers.txRESTController.runTxIndexing
      if (runTxIndexer) {
        console.log('TX Indexer triggered from REST API!')
        break
      }
    } while (1)
  } catch (err) {
    console.error('Error in psf-slp-tx-indexer.js: ', err.message)
    process.exit(1)
  }
}

start()
