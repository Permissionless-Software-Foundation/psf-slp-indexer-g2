/*
  Top-level library for the use cases.
*/

// Public npm libraries
import RetryQueue from '@chris.troutner/retry-queue'

// Local libraries
import IndexBlocks from './index-blocks.js'
import State from './state.js'
import Utils from './utils.js'

class UseCases {
  constructor (localConfig = {}) {
    // Throw error if adapters are not provided.
    if (!localConfig.adapters) {
      throw new Error('Adapters are required for the use cases.')
    }
    this.adapters = localConfig.adapters

    // Encapsulate dependencies
    this.indexBlocks = new IndexBlocks({ adapters: this.adapters })
    this.retryQueue = new RetryQueue({})
    this.state = new State({ adapters: this.adapters })
    this.utils = new Utils()

    // Bind 'this' object to all subfunctions
    this.initUseCases = this.initUseCases.bind(this)
  }

  // This method is used to do any async initialization of child libraries that
  // may be needed before the main app starts.
  async initUseCases () {
    // await this.state.getStatus()

    // Get the current block height
    // const biggestBlockHeight = await this.retryQueue.addToQueue(this.adapters.rpc.getBlockCount, {})
    // console.log('Current chain block height: ', biggestBlockHeight)

    console.log('Starting bulk indexing.')

    console.log('Use cases initialized.')
    return true
  }
}

export default UseCases
