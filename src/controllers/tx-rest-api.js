/*
  REST API Controller for starting the TX indexer.
*/

// Public npm libraries.
import express from 'express'

// Local libraries.
import config from '../../config/index.js'

const port = config.txRestApiPort // TX REST API port

class TxRESTController {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error('Adapters are required for the TX REST API.')
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error('Use cases are required for the TX REST API.')
    }

    // Encapsulate dependencies.
    this.app = express()

    // State
    this.runTxIndexing = false

    // Bind 'this' object to all subfunctions.
    this.start = this.start.bind(this)
  }

  // This function should be called at startup to launch the express server.
  start () {
    // This simple GET request will start the TX indexer.
    this.app.get('/tx-start', (req, res) => {
      this.runTxIndexing = true
      console.log('Staring TX Indexer...')

      res.send({
        report: {
          success: true
        }
      })
    })

    // Start server
    this.app.listen(port, () => {
      // console.log('Server is running on port 3000');
      console.log(`TX Indexer listening at http://localhost:${port}`)
    })
  }
}

export default TxRESTController
