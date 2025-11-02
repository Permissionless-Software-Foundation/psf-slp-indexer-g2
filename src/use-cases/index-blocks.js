/*
  Business logic for indexing blocks.
*/

// Global npm libraries
import RetryQueue from '@chris.troutner/retry-queue'

// Local libraries
import FilterBlock from './filter-block.js'
import Genesis from './tx-types/genesis.js'
import Mint from './tx-types/mint.js'
import Send from './tx-types/send.js'
import NftGenesis from './tx-types/nft-genesis.js'
import DAG from './dag.js'

// const EPOCH = 1000 // blocks between backups
const RETRY_CNT = 10

class IndexBlocks {
  constructor (localConfig = {}) {
    // Dependency Injection
    // Throw error if adapters are not provided.
    if (!localConfig.adapters) {
      throw new Error('Adapters are required for the index-blocks.js use case library.')
    }
    this.adapters = localConfig.adapters

    // Encapsulate dependencies
    this.filterBlock = new FilterBlock({ adapters: this.adapters })
    this.genesis = new Genesis({ adapters: this.adapters })
    this.mint = new Mint({ adapters: this.adapters })
    this.send = new Send({ adapters: this.adapters })
    this.nftGenesis = new NftGenesis({ adapters: this.adapters })
    this.dag = new DAG({ adapters: this.adapters })
    this.RETRY_CNT = RETRY_CNT
    this.retryQueue = new RetryQueue()

    // Bind 'this' object to all subfunctions
    this.processBlock = this.processBlock.bind(this)
    this.processSlpTxs = this.processSlpTxs.bind(this)
    this.handleProcessFailure = this.handleProcessFailure.bind(this)
    this.processTx = this.processTx.bind(this)
    this.processData = this.processData.bind(this)
  }

  // Processes an entire block.
  async processBlock (blockHeight) {
    try {
      // Get the block hash for the current block height.
      // const blockHash = await this.adapters.rpc.getBlockHash(blockHeight)
      const blockHash = await this.retryQueue.addToQueue(this.adapters.rpc.getBlockHash, { height: blockHeight })
      // console.log("blockHash: ", blockHash);

      // Now get the actual data stored in that block.
      // const block = await this.adapters.rpc.getBlock(blockHash)
      const block = await this.retryQueue.addToQueue(this.adapters.rpc.getBlock, { hash: blockHash })
      // console.log('block: ', block)

      // Transactions in the block.
      const txs = block.tx

      const now = new Date()
      console.log(
        `\nIndexing block ${blockHeight} with ${
          txs.length
        } transactions. Time now: ${now.toLocaleString()}`
      )
      // console.log('txs: ', txs)
      console.log('blockHeight: ', blockHeight)

      // Filter and sort block transactions, to make indexing more efficient
      // and easier to debug.
      const filteredTxs = await this.filterBlock.filterAndSortSlpTxs2(
        txs,
        blockHeight
      )
      // console.log('filteredTxs: ', filteredTxs)
      const slpTxs = filteredTxs.combined
      const nonSlpTxs = filteredTxs.nonSlpTxs
      // console.log(`slpTxs: ${JSON.stringify(slpTxs, null, 2)}`)

      // If the block has no txs after filtering for SLP txs, then skip processing.
      if (slpTxs && slpTxs.length) {
        console.log(`slpTxs: ${slpTxs.length}`)

        // Progressively processes TXs in the array.
        await this.processSlpTxs(slpTxs, blockHeight)

        // Do a second round of this.filterBlock.deleteBurnedUtxos() for
        // all non-SLP transactions. Handles corner-case where a token UTXO
        // is burned in the same block that it was created.
        for (let i = 0; i < nonSlpTxs.length; i++) {
          const thisTxid = nonSlpTxs[i]
          const burnResult = await this.filterBlock.deleteBurnedUtxos(thisTxid)

          if (!burnResult) {
            console.log(
              `deleteBurnedUtxos() errored on on txid ${thisTxid}. Coinbase?`
            )
          }
        }
      }

      // Check each of the non-SLP transaction to see if it matches the profile
      // of a Claim.
      // console.log('nonSlpTxs: ', nonSlpTxs)
      if (nonSlpTxs && nonSlpTxs.length) {
        for (let i = 0; i < nonSlpTxs.length; i++) {
          const thisTxid = nonSlpTxs[i]

          // Check if this transaction is a Claim.
          const isClaim = await this.adapters.transaction.isPinClaim(thisTxid)
          // console.log(`TX ${thisTxid} is pin claim: ${!!isClaim}`)
          if (isClaim) {
            console.log(`Claim found: ${JSON.stringify(isClaim, null, 2)}`)
            // console.log(`Claim key: ${isClaim.about}, value: ${JSON.stringify(isClaim, null, 2)}`)

            // Store the claim in the database.
            await this.adapters.pinClaimDb.createPinClaim(thisTxid, isClaim)

            // Trigger webhook
            try {
              // Trigger webhook. Do not wait, so that code execution is not blocked.
              this.adapters.webhook.webhookNewClaim(isClaim)
            } catch (err) {
              /* exit quietly */
              console.log('Error trying to execute webhook: ', err)
            }
          }
        }
      }

      // // Create a zip-file backup every 'epoch' of blocks, but only in phase 1.
      // // console.log(`blockHeight: ${blockHeight}, indexState: ${this.indexState}`)
      // if (blockHeight % EPOCH === 0 && this.indexState === 'phase1') {
      //   // Clean up stale TXs in the pTxDb.
      //   await this.managePtxdb.cleanPTXDB(blockHeight)

      //   console.log(`this.indexState: ${this.indexState}`)
      //   console.log(`Creating zip archive of database at block ${blockHeight}`)
      //   await this.dbBackup.zipDb(blockHeight, EPOCH)

      //   return 2
      // } else if ((blockHeight - 1) % EPOCH === 0 && this.indexState === 'phase2') {
      //   // In phase 2 (ZMQ), roll back to the last backup and resync, to generate
      //   // a new backup. This prevents the backup file from being corrupted by ZMQ
      //   // transaction processing while in phase2.

      //   const rollbackHeight = blockHeight - 1 - EPOCH

      //   // Roll back the database to the last epoch.
      //   await this.dbBackup.unzipDb(rollbackHeight)

      //   // Kill the process, which will allow the app to shut down, and pm2 or Docker can
      //   // restart it at a block height to resync and take a proper backup while
      //   // in phase1.
      //   console.log('Killing process, expecting process manager to restart this app.')
      //   this.process.exit(0)

      //   return 3
      // }

      return 1
    } catch (err) {
      console.error('Error in processBlock()')
      throw err
    }
  }

  // This processes each SLP tx in-order in the array. If an error is found,
  // the current TX is moved to the back of the queue. Processing continues
  // until the array is empty, or the same TX has failed to process RETRY_CNT
  // times in a row.
  async processSlpTxs (slpTxs, blockHeight) {
    try {
      const errors = [] // Track errors

      // Loop through each tx in the slpTxs array, until all the TXs have been
      // removed from the array.
      do {
        // Get the first element in the slpTxs array.
        const tx = slpTxs.shift()
        console.log(`tx: ${JSON.stringify(tx, null, 2)}`)
        console.log(`slpTxs: ${slpTxs.length}`)

        try {
          // Attempt to process TX
          await this.processTx({ tx, blockHeight })
        } catch (err) {
          // Temp. Seeing if we can skip errors when in phase 2.
          if (this.indexState === 'phase2') {
            console.log(
              'Skipping error because indexer is in phase 2, indexing the tip of the chain.'
            )

            return null
          }

          console.log('----> HANDLING ERROR <----')
          console.log(err)

          // Move the tx to the back of the queue.
          slpTxs.push(tx)

          // Get the error object for this tx.
          const errObj = errors.filter((x) => x.tx === tx)

          // Create a new error object if it doesn't exist.
          if (!errObj.length) {
            const newErrObj = {
              tx,
              cnt: 0
            }

            errors.push(newErrObj)

            errObj.push(newErrObj)
          } else {
            // Increment the error count for this tx.
            errObj[0].cnt++
          }

          console.log(`Error count for ${tx}: ${errObj[0].cnt}`)

          const retryCnt = this.RETRY_CNT
          if (errObj[0].cnt > retryCnt) {
            await this.handleProcessFailure(blockHeight, tx, err.message)
            throw new Error(
              `Failed to process TXID ${tx} after ${retryCnt} tries.`
            )
          }
        }

        // Loop while there are still elements in the slpTxs array.
      } while (slpTxs.length)

      return true
    } catch (err) {
      console.error('Error in processSlpTxs()')
      throw err
    }
  }

  // This function is used to roll back to a previous snapshot, when the indexer
  // gets stuck.
  // It determines the block height of the problematic parent transaction, then
  // rolls the database to a block height before that transaction.
  async handleProcessFailure (blockHeight, tx, errMsg) {
    try {
      // Subtract one from the block height. This ensure we roll back to a block
      // before where the problem happened.
      // This protects against a corner-case where restoring from a problematic
      // backup, causes the indexer to get stuck in a loop, trying to restore the
      // same problematic backup over and over.
      blockHeight = blockHeight - 1

      console.log(`Error in block height: ${blockHeight}`)
      console.log(`errMsg: ${errMsg}`)

      // Round down to nearest 1000 blocks
      const rollbackHeight = Math.floor(blockHeight / 1000) * 1000
      console.log(`Rolling back to block height: ${rollbackHeight}`)

      try {
        await this.adapters.dbCtrl.rollbackDb(rollbackHeight)
      } catch (err) {
        console.log('rollback API threw an error: ', err.message)
        /* exit quietly */
      }

      console.log('This is where the database would roll back to the previous snapshot.')

      // const txData = await this.cache.get(tx)
      // // console.log(
      // //   `TX Data for problematic TX: ${JSON.stringify(txData, null, 2)}`
      // // )

      // // Figure out the block height of the parent transaction.
      // let targetBlockHeight = blockHeight // Initial (wrong) value.

      // // Loop through each Vin and find the oldest parent with the smallest
      // // (oldest) block height.
      // for (let i = 0; i < txData.vin.length; i++) {
      //   const thisVin = txData.vin[i]
      //   console.log(`thisVin: ${JSON.stringify(thisVin, null, 2)}`)

      //   // Skip any non-token inputs.
      //   if (!thisVin.tokenQty && !thisVin.isMintBaton) continue

      //   // Get parent TX data
      //   const parentTxData = await this.cache.get(thisVin.txid)

      //   // Find and track the oldest parent block height.
      //   if (parentTxData.blockheight < targetBlockHeight) {
      //     targetBlockHeight = parentTxData.blockheight
      //   }
      // }
      // console.log(`targetBlockHeight: ${targetBlockHeight}`)

      // // Round the hight to the nearest epoch
      // const rollbackHeight = Math.floor(targetBlockHeight / EPOCH) * EPOCH
      // console.log(
      //   `Rolling database back to this block height: ${rollbackHeight}`
      // )

      // // Roll back the database to before the parent transaction.
      // await this.dbBackup.unzipDb(rollbackHeight)

      // Kill the process, which will allow the app to shut down, and pm2 or Docker can
      // restart it at a block height prior to the problematic parent transaction.
      this.process.exit(0)

      return true
    } catch (err) {
      console.error('Error in handleProcessFailure: ', err)

      // Do not throw an error, as this is an error handlilng function.
      return false
    }
  }

  // Process a single SLP transaction.
  async processTx (inData) {
    try {
      const { tx, blockHeight } = inData

      let dataToProcess = false

      // Check the pTxs database to see if this transaction has already been
      // processed. If so, skip it.
      try {
        // Will throw an error if tx is not found, which is the same as false.
        await this.adapters.pTxDb.getPTx(tx)

        // If TXID exists in the DB, then it's been processed. Exit.
        console.log(`${tx} already processed. Skipping.`)
        return false
      } catch (err) {
        // console.log(`Error getting tx ${tx} from processed database.`, err.message)
        /* exit quietly */
      }

      try {
        // Dev Note: Call this code paragraph before calling cache.get().
        // Otherwise, blacklisted tokens will hydrate (which is computationally
        // expensive) right before rejecting the TX.

        // Is the TX an SLP TX? If not, it will throw an error.
        const slpData = await this.adapters.transaction.decodeOpReturn(tx)
        // console.log('slpData: ', slpData)

        // Skip this TX if it is for a token that is in the blacklist.
        const tokenId = slpData.tokenId
        const isInBlacklist = this.adapters.blacklist.checkBlacklist(tokenId)
        if (isInBlacklist) {
          console.log(
            `Skipping TX ${tx}, it contains...\ntoken ${tokenId} which is in the blacklist.`
          )

          // Mark the transaction validity as 'null' to signal that this tx
          // has not been processed and the UTXO should be ignored.
          const txData = {
            txid: tx,
            blockHeight,
            isValidSlp: null
          }
          await this.adapters.txDb.put(tx, txData)

          // Save the TX to the processed database.
          await this.adapters.pTxDb.put(tx, blockHeight)

          // throw new Error('TX is for token in blacklist')
          return txData
        }

        // Get the transaction information.
        // See dev note above.
        const txData = await this.adapters.cache.get(tx)
        // console.log('txData: ', txData)

        // Combine available data for further processing.
        dataToProcess = {
          slpData,
          blockHeight,
          txData
        }
      } catch (err) {
        /* exit quietly */
        // console.log(`Error getting tx ${tx} from cache.`, err.message)

        // TODO: check if this TX is a Pin Claim.
        // Check if this transaction is a Claim.
        const isClaim = await this.adapters.transaction.isPinClaim(tx)
        // console.log(`TX ${tx.txid} is pin claim: ${!!isClaim}`)
        if (isClaim) {
          console.log(`Claim found: ${JSON.stringify(isClaim, null, 2)}`)
          // console.log(`Claim key: ${isClaim.about}, value: ${JSON.stringify(isClaim, null, 2)}`)

          // Store the claim in the database.
          await this.adapters.pinClaimDb.createPinClaim(tx, isClaim)

          // Trigger webhook
          try {
            // Trigger webhook. Do not wait, so that code execution is not blocked.
            this.adapters.webhook.webhookNewClaim(isClaim)
          } catch (err) { /* exit quietly */ }
        }
      }

      // Process the identified SLP transaction.
      if (dataToProcess) {
        console.log('Inspecting tx: ', tx)
        await this.processData(dataToProcess)
      }

      // Save the TX to the processed database.
      await this.adapters.pTxDb.createPTx(tx, blockHeight)

      // console.log(`Completed ${tx}`)

      return true
    } catch (err) {
      console.error('Error in processTx()')
      throw err
    }
  }

  // This function routes the data for individual SLP transactions for further
  // processing, based on the type of SLP transaction it is.
  async processData (data) {
    try {
      const { slpData, txData } = data
      // console.log('slpData: ', slpData)
      console.log('processData() starting. txData: ', JSON.stringify(txData, null, 2))

      // Skip tokens with an unknown token type.
      // But mark the TX as 'null', to signal to wallets that the UTXO should
      // be segregated so that it's not burned.
      if (
        slpData.tokenType !== 1 &&
        slpData.tokenType !== 65 &&
        slpData.tokenType !== 129
      ) {
        console.log(
          `Skipping TX ${txData.txid}, it is tokenType ${slpData.tokenType}, which is not yet supported.`
        )

        // Mark the transaction validity as 'null' to signal that this tx
        // has not been processed and the UTXO should be   ignored.
        txData.isValidSlp = null
        await this.txDb.put(txData.txid, txData)

        return false
      }

      // console.log(`txData: ${JSON.stringify(txData, null, 2)}`)

      // Route the data for processing, based on the type of transaction.
      if (slpData.txType.includes('GENESIS')) {
        if (slpData.tokenType === 65) {
          // NFT Genesis

          await this.nftGenesis.processTx(data)

          console.log(`NFT Genesis tx processed: ${txData.txid}`)
        } else {
          // Type 1 and Group GENESIS

          await this.genesis.processTx(data)

          console.log(`Genesis tx processed: ${txData.txid}`)
        }
      } else if (slpData.txType.includes('MINT')) {
        console.log(`Mint tx for token ID: ${slpData.tokenId}`)

        // console.log(`Mint data: ${JSON.stringify(data, null, 2)}`)
        await this.mint.processTx(data)

        console.log(`Mint tx processed: ${txData.txid}`)
      } else if (slpData.txType.includes('SEND')) {
        console.log(`Send tx. Block Height: ${data.blockHeight}`)

        await this.send.processTx(data)

        console.log(`Send tx processed: ${txData.txid}`)
      }

      // If a prior library did not explictely mark this TX as invalid,
      if (txData.isValidSlp !== false && txData.isValidSlp !== null) {
        // Mark TXID as valid.
        txData.isValidSlp = true
      }

      // console.log('index-blocks.js/processData() txData: ', JSON.stringify(txData, null, 2))

      // Add the transaction to the database
      await this.adapters.txDb.createTx(txData.txid, txData)

      return true
    } catch (err) {
      console.error('Error in processData(): ', err)
      throw err
    }
  }
}

export default IndexBlocks
