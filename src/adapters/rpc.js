/*
  Adapter library for interacting with the BCHN Full Node over its JSON RPC.
*/

// Public npm libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'

class RPC {
  constructor () {
    // Encapsulate dependencies
    this.axios = axios
    this.config = config

    // Bind 'this' object to subfunctions
    this.getAxiosOptions = this.getAxiosOptions.bind(this)
    this.getBlockCount = this.getBlockCount.bind(this)
    this.getBlockHeader = this.getBlockHeader.bind(this)
    this.getBlock = this.getBlock.bind(this)
    this.getBlockHash = this.getBlockHash.bind(this)
    this.getRawTransaction = this.getRawTransaction.bind(this)
  }

  // Axios options used when calling axios.post() to talk with a full node.
  getAxiosOptions () {
    return {
      method: 'post',
      baseURL: `http://${this.config.rpcIp}:${this.config.rpcPort}/`,
      timeout: 15000,
      auth: {
        username: this.config.rpcUser,
        password: this.config.rpcPass
      },
      data: {
        jsonrpc: '1.0'
      }
    }
  }

  // Get the current block height of the BCH blockchain.
  async getBlockCount () {
    try {
      // Axios options
      const options = this.getAxiosOptions()
      options.data.id = 'getblockcount'
      options.data.method = 'getblockcount'
      options.data.params = []

      const response = await this.axios.request(options)

      return response.data.result
    } catch (err) {
      // Write out error to error log.
      console.error('Error in rpc.js/getBlockCount().', err.message)

      throw err
    }
  }

  // Given a block hash, return the block header. This includes the block height.
  async getBlockHeader (hash, verbose = true) {
    try {
      if (!hash) throw new Error('Block hash must be provided')

      const options = this.getAxiosOptions()
      options.data.id = 'getblockheader'
      options.data.method = 'getblockheader'
      options.data.params = [hash, verbose]

      const response = await this.axios.request(options)

      return response.data.result
    } catch (err) {
      // Write out error to error log.
      console.error('Error in rpc.js/getBlockHeader().', err.message)

      throw err
    }
  }

  // Get the contents of a block, given its block hash.
  async getBlock (inObj = {}) {
    try {
      const { hash, verbose = true } = inObj

      if (!hash) throw new Error('Block hash must be provided')

      // Axios options
      const options = this.getAxiosOptions()

      options.data.id = 'getblock'
      options.data.method = 'getblock'
      options.data.params = [hash, verbose]

      const response = await this.axios.request(options)

      return response.data.result
    } catch (err) {
      // Write out error to error log.
      console.error('Error in rpc.js/getBlock() ', err.message)

      throw err
    }
  }

  // Given a block height, return the block hash matching that block height.
  async getBlockHash (inObj = {}) {
    try {
      const { height } = inObj

      if (!height) throw new Error('Block height must be provided')

      // Axios options
      const options = this.getAxiosOptions()

      options.data.id = 'getblockhash'
      options.data.method = 'getblockhash'
      options.data.params = [parseInt(height)]

      const response = await this.axios.request(options)

      return response.data.result
    } catch (err) {
      // Write out error to error log.
      console.error('Error in rpc.js/getBlockHash() ', err.message)

      throw err
    }
  }

  // Get details on a transaction, given a TXID.
  async getRawTransaction (txid, verbose = true) {
    try {
      if (!txid) throw new Error('txid must be provided')

      const options = this.getAxiosOptions()

      options.data.id = 'getrawtransaction'
      options.data.method = 'getrawtransaction'
      options.data.params = [txid, verbose]

      const response = await this.axios.request(options)

      return response.data.result
    } catch (err) {
      // console.log('error txid: ', txid)

      // Don't log the error for this specific response.
      if (err.message.includes('txid must be provided')) throw err

      // Write out error to error log.
      console.error('Error in rpc.js/getRawTransaction() ', err.message)

      throw err
    }
  }
}

// module.exports = RPC
export default RPC
