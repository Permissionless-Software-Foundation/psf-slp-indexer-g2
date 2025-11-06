/*
  Unit tests for the index-blocks.js library
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import cloneDeep from 'lodash.clonedeep'

// Local libraries
import IndexBlocks from '../../../src/use-cases/index-blocks.js'
import mockDataLib from '../mocks/index-blocks-mock.js'

describe('#index-blocks.js', () => {
  let uut, sandbox, mockData
  let mockProcess

  beforeEach(() => {
    // Mock test data
    mockData = cloneDeep(mockDataLib)

    // Restore the sandbox before each test.
    sandbox = sinon.createSandbox()

    // Mock process.exit
    mockProcess = {
      exit: sandbox.stub()
    }

    // Create comprehensive mock adapters
    const mockRpc = {
      getBlockHash: sandbox.stub(),
      getBlock: sandbox.stub()
    }
    const mockCache = {
      get: sandbox.stub()
    }
    const mockTransaction = {
      decodeOpReturn: sandbox.stub(),
      isPinClaim: sandbox.stub().returns(false)
    }
    const mockBlacklist = {
      checkBlacklist: sandbox.stub().returns(false)
    }
    const mockFilterBlock = {
      filterAndSortSlpTxs2: sandbox.stub().resolves({
        combined: [],
        nonSlpTxs: []
      }),
      deleteBurnedUtxos: sandbox.stub().resolves(true)
    }
    const mockPinClaimDb = {
      createPinClaim: sandbox.stub().resolves()
    }
    const mockWebhook = {
      webhookNewClaim: sandbox.stub()
    }
    const mockPTxDb = {
      getPTx: sandbox.stub().rejects(new Error('not found')),
      put: sandbox.stub().resolves(),
      createPTx: sandbox.stub().resolves()
    }
    const mockTxDb = {
      put: sandbox.stub().resolves(),
      createTx: sandbox.stub().resolves()
    }
    const mockGenesis = {
      processTx: sandbox.stub().resolves()
    }
    const mockMint = {
      processTx: sandbox.stub().resolves()
    }
    const mockSend = {
      processTx: sandbox.stub().resolves()
    }
    const mockNftGenesis = {
      processTx: sandbox.stub().resolves()
    }
    const mockDbCtrl = {
      rollbackDb: sandbox.stub().resolves()
    }
    const mockRetryQueue = {
      addToQueue: sandbox.stub()
    }

    const adapters = {
      rpc: mockRpc,
      cache: mockCache,
      transaction: mockTransaction,
      blacklist: mockBlacklist,
      pinClaimDb: mockPinClaimDb,
      webhook: mockWebhook,
      pTxDb: mockPTxDb,
      txDb: mockTxDb,
      dbCtrl: mockDbCtrl
    }

    uut = new IndexBlocks({ adapters })

    // Mock internal dependencies (retryQueue is created in constructor)
    uut.filterBlock = mockFilterBlock
    uut.genesis = mockGenesis
    uut.mint = mockMint
    uut.send = mockSend
    uut.nftGenesis = mockNftGenesis
    uut.process = mockProcess
    // Replace retryQueue with mock
    uut.retryQueue = mockRetryQueue
  })

  afterEach(() => sandbox.restore())

  describe('#constructor()', () => {
    it('should throw an error if adapters instance is not provided', () => {
      try {
        uut = new IndexBlocks()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(
          err.message,
          'Adapters are required for the index-blocks.js use case library.'
        )
      }
    })

    it('should initialize all dependencies', () => {
      const adapters = {
        rpc: {},
        cache: {},
        transaction: {},
        blacklist: {},
        pinClaimDb: {},
        webhook: {},
        pTxDb: {},
        txDb: {},
        dbCtrl: {}
      }

      uut = new IndexBlocks({ adapters })

      assert.isOk(uut.filterBlock)
      assert.isOk(uut.genesis)
      assert.isOk(uut.mint)
      assert.isOk(uut.send)
      assert.isOk(uut.nftGenesis)
      assert.isOk(uut.dag)
      assert.isOk(uut.retryQueue)
      assert.equal(uut.RETRY_CNT, 10)
    })
  })

  describe('#processBlock()', () => {
    it('should process block with SLP transactions', async () => {
      const blockHeight = 100
      const blockHash = 'block-hash-01'
      const block = cloneDeep(mockData.block01)

      uut.retryQueue.addToQueue
        .onCall(0).resolves(blockHash)
        .onCall(1).resolves(block)

      uut.filterBlock.filterAndSortSlpTxs2.resolves({
        combined: ['txid01'],
        nonSlpTxs: ['txid02', 'txid03']
      })

      const result = await uut.processBlock(blockHeight)

      assert.equal(result, 1)
      assert.equal(uut.retryQueue.addToQueue.callCount, 2)
      assert.equal(uut.filterBlock.filterAndSortSlpTxs2.called, true)
    })

    it('should process block with no SLP transactions', async () => {
      const blockHeight = 100
      const blockHash = 'block-hash-01'
      const block = cloneDeep(mockData.block01)

      uut.retryQueue.addToQueue
        .onCall(0).resolves(blockHash)
        .onCall(1).resolves(block)

      uut.filterBlock.filterAndSortSlpTxs2.resolves({
        combined: [],
        nonSlpTxs: ['txid01', 'txid02']
      })

      const result = await uut.processBlock(blockHeight)

      assert.equal(result, 1)
    })

    it('should process block with Pin Claims in non-SLP transactions', async () => {
      const blockHeight = 100
      const blockHash = 'block-hash-01'
      const block = cloneDeep(mockData.block01)

      uut.retryQueue.addToQueue
        .onCall(0).resolves(blockHash)
        .onCall(1).resolves(block)

      uut.filterBlock.filterAndSortSlpTxs2.resolves({
        combined: [],
        nonSlpTxs: ['txid01']
      })

      uut.adapters.transaction.isPinClaim
        .onCall(0).returns(mockData.pinClaim01)

      const result = await uut.processBlock(blockHeight)

      assert.equal(result, 1)
      assert.equal(uut.adapters.pinClaimDb.createPinClaim.called, true)
      assert.equal(uut.adapters.webhook.webhookNewClaim.called, true)
    })

    it('should handle webhook errors gracefully', async () => {
      const blockHeight = 100
      const blockHash = 'block-hash-01'
      const block = cloneDeep(mockData.block01)

      uut.retryQueue.addToQueue
        .onCall(0).resolves(blockHash)
        .onCall(1).resolves(block)

      uut.filterBlock.filterAndSortSlpTxs2.resolves({
        combined: [],
        nonSlpTxs: ['txid01']
      })

      uut.adapters.transaction.isPinClaim
        .onCall(0).returns(mockData.pinClaim01)

      uut.adapters.webhook.webhookNewClaim.throws(new Error('webhook error'))

      const result = await uut.processBlock(blockHeight)

      assert.equal(result, 1)
      assert.equal(uut.adapters.pinClaimDb.createPinClaim.called, true)
    })

    it('should handle errors in deleteBurnedUtxos', async () => {
      const blockHeight = 100
      const blockHash = 'block-hash-01'
      const block = cloneDeep(mockData.block01)

      uut.retryQueue.addToQueue
        .onCall(0).resolves(blockHash)
        .onCall(1).resolves(block)

      uut.filterBlock.filterAndSortSlpTxs2.resolves({
        combined: ['txid01'],
        nonSlpTxs: ['txid02']
      })

      uut.filterBlock.deleteBurnedUtxos.resolves(false)

      const result = await uut.processBlock(blockHeight)

      assert.equal(result, 1)
    })

    it('should handle empty block', async () => {
      const blockHeight = 100
      const blockHash = 'block-hash-01'
      const block = cloneDeep(mockData.block02)

      uut.retryQueue.addToQueue
        .onCall(0).resolves(blockHash)
        .onCall(1).resolves(block)

      uut.filterBlock.filterAndSortSlpTxs2.resolves({
        combined: [],
        nonSlpTxs: []
      })

      const result = await uut.processBlock(blockHeight)

      assert.equal(result, 1)
    })

    it('should handle RPC call failures', async () => {
      const blockHeight = 100

      uut.retryQueue.addToQueue.rejects(new Error('RPC error'))

      try {
        await uut.processBlock(blockHeight)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'RPC error')
      }
    })
  })

  describe('#processSlpTxs()', () => {
    beforeEach(() => {
      uut.processTx = sandbox.stub().resolves()
    })

    it('should process array of SLP transactions successfully', async () => {
      const slpTxs = ['txid01', 'txid02', 'txid03']
      const blockHeight = 100

      const result = await uut.processSlpTxs(slpTxs, blockHeight)

      assert.equal(result, true)
      assert.equal(uut.processTx.callCount, 3)
    })

    it('should handle empty array', async () => {
      const slpTxs = []
      const blockHeight = 100

      const result = await uut.processSlpTxs(slpTxs, blockHeight)

      assert.equal(result, true)
      // Empty array should return immediately without processing
    })

    it('should retry failed transactions', async () => {
      const slpTxs = ['txid01']
      const blockHeight = 100

      uut.processTx
        .onCall(0).rejects(new Error('processing error'))
        .onCall(1).resolves()

      const result = await uut.processSlpTxs(slpTxs, blockHeight)

      assert.equal(result, true)
      assert.equal(uut.processTx.callCount, 2)
    })

    it('should skip error in phase2 index state', async () => {
      const slpTxs = ['txid01']
      const blockHeight = 100
      uut.indexState = 'phase2'

      uut.processTx.rejects(new Error('processing error'))

      const result = await uut.processSlpTxs(slpTxs, blockHeight)

      assert.equal(result, null)
      assert.equal(uut.processTx.callCount, 1)
    })

    it('should throw after RETRY_CNT failures', async () => {
      const slpTxs = ['txid01']
      const blockHeight = 100

      uut.processTx.rejects(new Error('processing error'))
      uut.RETRY_CNT = 2

      try {
        await uut.processSlpTxs(slpTxs, blockHeight)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Failed to process TXID')
        // After initial attempt fails, it retries. When cnt > RETRY_CNT (2), it throws.
        // So it tries: initial (cnt=0) -> retry1 (cnt=1) -> retry2 (cnt=2) -> retry3 (cnt=3, >2, throws)
        // Total: RETRY_CNT + 2 attempts = 4 attempts (initial + 3 retries)
        assert.equal(uut.processTx.callCount, uut.RETRY_CNT + 2)
      }
    })

    it('should handle errors gracefully', async () => {
      const slpTxs = ['txid01']
      const blockHeight = 100

      uut.processTx.rejects(new Error('unexpected error'))

      try {
        await uut.processSlpTxs(slpTxs, blockHeight)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Failed to process TXID')
      }
    })
  })

  describe('#handleProcessFailure()', () => {
    it('should calculate rollback height and call rollbackDb', async () => {
      const blockHeight = 2543
      const tx = 'txid01'
      const errMsg = 'test error'

      const result = await uut.handleProcessFailure(blockHeight, tx, errMsg)

      assert.equal(result, true)
      assert.equal(uut.adapters.dbCtrl.rollbackDb.called, true)
      // Should round down to nearest 1000: Math.floor(2542 / 1000) * 1000 = 2000
      assert.equal(uut.adapters.dbCtrl.rollbackDb.firstCall.args[0], 2000)
      assert.equal(uut.process.exit.called, true)
    })

    it('should handle rollbackDb errors gracefully', async () => {
      const blockHeight = 2543
      const tx = 'txid01'
      const errMsg = 'test error'

      uut.adapters.dbCtrl.rollbackDb.rejects(new Error('rollback error'))

      const result = await uut.handleProcessFailure(blockHeight, tx, errMsg)

      assert.equal(result, true)
      assert.equal(uut.process.exit.called, true)
    })

    it('should catch and handle errors gracefully', async () => {
      const blockHeight = 2543
      const tx = 'txid01'
      const errMsg = 'test error'

      // Mock process.exit to prevent actual exit
      uut.process.exit = sandbox.stub()
      
      // Make rollbackDb throw an error that gets caught internally
      uut.adapters.dbCtrl.rollbackDb.rejects(new Error('unexpected error'))

      // Even if rollbackDb fails, it should still exit
      const result = await uut.handleProcessFailure(blockHeight, tx, errMsg)

      // Should still return true even if rollbackDb errored
      assert.equal(result, true)
      assert.equal(uut.process.exit.called, true)
    })
  })

  describe('#processTx()', () => {
    beforeEach(() => {
      uut.processData = sandbox.stub().resolves()
    })

    it('should process new transaction successfully', async () => {
      const tx = 'txid01'
      const blockHeight = 100

      uut.adapters.transaction.decodeOpReturn.resolves({
        tokenId: 'token-id-01',
        tokenType: 1
      })
      uut.adapters.cache.get.resolves({
        txid: 'txid01',
        vin: [],
        vout: []
      })

      const result = await uut.processTx({ tx, blockHeight })

      assert.equal(result, true)
      assert.equal(uut.processData.called, true)
      assert.equal(uut.adapters.pTxDb.createPTx.called, true)
    })

    it('should skip transaction already processed', async () => {
      const tx = 'txid01'
      const blockHeight = 100

      uut.adapters.pTxDb.getPTx.resolves({})

      const result = await uut.processTx({ tx, blockHeight })

      assert.equal(result, false)
      assert.equal(uut.processData.called, false)
    })

    it('should handle blacklisted tokens', async () => {
      const tx = 'txid01'
      const blockHeight = 100

      uut.adapters.transaction.decodeOpReturn.resolves({
        tokenId: 'blacklisted-token',
        tokenType: 1
      })
      uut.adapters.blacklist.checkBlacklist.returns(true)

      const result = await uut.processTx({ tx, blockHeight })

      assert.equal(result.isValidSlp, null)
      assert.equal(uut.adapters.txDb.put.called, true)
      assert.equal(uut.adapters.pTxDb.put.called, true)
      assert.equal(uut.processData.called, false)
    })

    it('should handle Pin Claims when decodeOpReturn fails', async () => {
      const tx = 'txid01'
      const blockHeight = 100

      uut.adapters.transaction.decodeOpReturn.rejects(new Error('not SLP'))
      uut.adapters.transaction.isPinClaim.returns(mockData.pinClaim01)

      const result = await uut.processTx({ tx, blockHeight })

      assert.equal(result, true)
      assert.equal(uut.adapters.pinClaimDb.createPinClaim.called, true)
      assert.equal(uut.processData.called, false)
    })

    it('should handle Pin Claims when cache.get fails', async () => {
      const tx = 'txid01'
      const blockHeight = 100

      uut.adapters.transaction.decodeOpReturn.resolves({
        tokenId: 'token-id-01',
        tokenType: 1
      })
      uut.adapters.cache.get.rejects(new Error('cache error'))
      uut.adapters.transaction.isPinClaim.returns(mockData.pinClaim01)

      const result = await uut.processTx({ tx, blockHeight })

      assert.equal(result, true)
      assert.equal(uut.adapters.pinClaimDb.createPinClaim.called, true)
      assert.equal(uut.processData.called, false)
    })

    it('should handle webhook errors for Pin Claims', async () => {
      const tx = 'txid01'
      const blockHeight = 100

      uut.adapters.transaction.decodeOpReturn.rejects(new Error('not SLP'))
      uut.adapters.transaction.isPinClaim.returns(mockData.pinClaim01)
      uut.adapters.webhook.webhookNewClaim.throws(new Error('webhook error'))

      const result = await uut.processTx({ tx, blockHeight })

      assert.equal(result, true)
      assert.equal(uut.adapters.pinClaimDb.createPinClaim.called, true)
    })

    it('should handle errors gracefully', async () => {
      const tx = 'txid01'
      const blockHeight = 100

      uut.adapters.pTxDb.getPTx.rejects(new Error('not found'))
      uut.adapters.transaction.decodeOpReturn.rejects(new Error('unexpected error'))
      uut.adapters.transaction.isPinClaim.returns(false)
      uut.processData.rejects(new Error('unexpected error'))

      try {
        await uut.processTx({ tx, blockHeight })
        assert.fail('Unexpected code path')
      } catch (err) {
        // Error should be thrown from processTx
        assert.isOk(err)
      }
    })
  })

  describe('#processData()', () => {
    it('should route GENESIS transaction (Type 1)', async () => {
      const data = cloneDeep(mockData.slpTx01)

      const result = await uut.processData(data)

      assert.equal(result, true)
      assert.equal(uut.genesis.processTx.called, true)
      assert.equal(uut.adapters.txDb.createTx.called, true)
    })

    it('should route GENESIS transaction (NFT, Type 65)', async () => {
      const data = cloneDeep(mockData.slpTxNftGenesis)

      const result = await uut.processData(data)

      assert.equal(result, true)
      assert.equal(uut.nftGenesis.processTx.called, true)
      assert.equal(uut.adapters.txDb.createTx.called, true)
    })

    it('should route MINT transaction', async () => {
      const data = cloneDeep(mockData.slpTx02)

      const result = await uut.processData(data)

      assert.equal(result, true)
      assert.equal(uut.mint.processTx.called, true)
      assert.equal(uut.adapters.txDb.createTx.called, true)
    })

    it('should route SEND transaction', async () => {
      const data = cloneDeep(mockData.slpTx03)

      const result = await uut.processData(data)

      assert.equal(result, true)
      assert.equal(uut.send.processTx.called, true)
      assert.equal(uut.adapters.txDb.createTx.called, true)
    })

    it('should mark unsupported tokenType as null', async () => {
      const data = cloneDeep(mockData.slpTxUnsupportedType)

      // Need to set txDb reference correctly
      uut.txDb = uut.adapters.txDb

      const result = await uut.processData(data)

      assert.equal(result, false)
      assert.equal(data.txData.isValidSlp, null)
      assert.equal(uut.adapters.txDb.put.called, true)
    })

    it('should mark transaction as valid if not explicitly marked invalid', async () => {
      const data = cloneDeep(mockData.slpTx01)
      data.txData.isValidSlp = undefined

      const result = await uut.processData(data)

      assert.equal(result, true)
      assert.equal(data.txData.isValidSlp, true)
    })

    it('should preserve invalid mark if transaction already marked invalid', async () => {
      const data = cloneDeep(mockData.slpTx01)
      data.txData.isValidSlp = false

      const result = await uut.processData(data)

      assert.equal(result, true)
      assert.equal(data.txData.isValidSlp, false)
    })

    it('should preserve null mark if transaction already marked null', async () => {
      const data = cloneDeep(mockData.slpTx01)
      data.txData.isValidSlp = null

      const result = await uut.processData(data)

      assert.equal(result, true)
      assert.equal(data.txData.isValidSlp, null)
    })

    it('should handle errors gracefully', async () => {
      const data = cloneDeep(mockData.slpTx01)

      uut.genesis.processTx.rejects(new Error('processing error'))

      try {
        await uut.processData(data)
        assert.fail('Unexpected code path')
      } catch (err) {
        // Error message should include the original error or be rethrown
        assert.isOk(err)
      }
    })
  })
})

