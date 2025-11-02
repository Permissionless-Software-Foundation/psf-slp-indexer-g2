/*
  This library contains business logic for maintaining the state of the indexer.
*/

// Public npm libraries
import RetryQueue from '@chris.troutner/retry-queue'

class State {
  constructor (localConfig = {}) {
    if (!localConfig.adapters) {
      throw new Error('Adapters are required for the state.js use case library.')
    }
    this.adapters = localConfig.adapters

    // Encapsulate dependencies
    this.retryQueue = new RetryQueue({})

    // Bind 'this' object to all subfunctions
    this.getStatus = this.getStatus.bind(this)
  }

  // Get the sync status of the indexer.
  async getStatus () {
    try {
      const status = await this.adapters.statusDb.getStatus()
      // console.log('Indexer State: ', status)

      return status
    } catch (err) {
      console.error('Error in IndexBlocks.getStatus(): ', err)
      throw err
    }
  }

  // Update the sync status of the indexer.
  async updateIndexedBlockHeight (inObj = {}) {
    try {
      const { lastIndexedBlockHeight } = inObj

      const status = await this.adapters.statusDb.getStatus()
      status.lastIndexedBlockHeight = lastIndexedBlockHeight

      // console.log('updateIndexedBlockHeight() status: ', status)
      // console.log('updateIndexedBlockHeight() lastIndexedBlockHeight: ', lastIndexedBlockHeight)

      // Make sure the synced block height is the expected value.
      if (status.syncedBlockHeight !== (lastIndexedBlockHeight - 1)) {
        throw new Error(`Expected synced block height to be ${lastIndexedBlockHeight - 1}, but got ${status.syncedBlockHeight}`)
      }

      // Update the synced block height.
      status.syncedBlockHeight = lastIndexedBlockHeight

      await this.adapters.statusDb.updateStatus(status)
      return lastIndexedBlockHeight + 1
    } catch (err) {
      console.error('Error in use-cases/state.js updateIndexedBlockHeight()')
      throw err
    }
  }
}

export default State
