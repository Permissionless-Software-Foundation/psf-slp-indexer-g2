/*
  Adapter library for TX indexer.
  This lets the block indexer trigger the TX indexer to start after IBD.
*/

// Global libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'

class TxIndexerAdapter {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.config = config
  }

  async startTxIndexer () {
    try {
      const response = await this.axios.get(`http://localhost:${this.config.txRestApiPort}/tx-start`)
      console.log('Response: ', response.data)

      return true
    } catch (err) {
      console.error('Error in TxIndexerAdapter.startTxIndexer(): ', err.message)
    }
  }
}

export default TxIndexerAdapter
