/*
  Unit tests for the filter-block.js library
*/

import { assert } from 'chai'
import sinon from 'sinon'
import cloneDeep from 'lodash.clonedeep'

import mockDataLib from '../mocks/filter-block-mock.js'
import FilterBlock from '../../../src/use-cases/filter-block.js'

describe('#filter-block.js', () => {
  let uut, sandbox, mockData

  beforeEach(() => {
    // Restore the sandbox before each test.
    sandbox = sinon.createSandbox()

    mockData = cloneDeep(mockDataLib)

    // Create mock adapters
    const mockCache = {
      get: sandbox.stub(),
      txDb: {
        get: sandbox.stub().rejects(new Error('not in db'))
      }
    }
    const mockTransaction = {
      getTokenInfo: sandbox.stub(),
      getTxWithRetry: sandbox.stub()
    }
    const mockBlacklist = {
      checkBlacklist: sandbox.stub().returns(false)
    }
    const mockUtxoDb = {
      getUTxo: sandbox.stub(),
      get: sandbox.stub(),
      del: sandbox.stub().resolves()
    }
    const mockAddrDb = {
      get: sandbox.stub(),
      put: sandbox.stub().resolves()
    }
    const mockTokenDb = {
      get: sandbox.stub(),
      put: sandbox.stub().resolves()
    }
    const mockTxDb = {
      put: sandbox.stub().resolves()
    }

    const adapters = {
      cache: mockCache,
      transaction: mockTransaction,
      blacklist: mockBlacklist,
      utxoDb: mockUtxoDb,
      addrDb: mockAddrDb,
      tokenDb: mockTokenDb,
      txDb: mockTxDb
    }

    uut = new FilterBlock({ adapters })

    // Set direct properties on instance since code uses both patterns
    uut.addrDb = mockAddrDb
    uut.utxoDb = mockUtxoDb
    uut.tokenDb = mockTokenDb
    uut.txDb = mockTxDb
    uut.cache = mockCache
    uut.transaction = mockTransaction
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw error if adapters are not passed', () => {
      try {
        uut = new FilterBlock()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(
          err.message,
          'Adapters are required for the filter-block.js use case library.'
        )
      }
    })
  })

  describe('#retryWrapper', () => {
    it('should throw an error if function handler is not provided', async () => {
      try {
        await uut.retryWrapper()
        assert.fail('unexpected code path')
      } catch (err) {
        assert.include(err.message, 'function handler is required')
      }
    })

    it('should throw an error if input object is not provided', async () => {
      try {
        const funcHandler = () => {}
        await uut.retryWrapper(funcHandler)
        assert.fail('unexpected code path')
      } catch (err) {
        assert.include(err.message, 'input object is required')
      }
    })

    it('should execute the given function.', async () => {
      const inputTest = 'test'
      // func mock to execute into the retry wrapper
      const funcHandle = sinon.spy()

      await uut.retryWrapper(funcHandle, inputTest)

      assert.equal(inputTest, funcHandle.getCall(0).args[0])
      assert.equal(funcHandle.callCount, 1)
    })

    it('should call handleValidationError() when p-retry error is thrown', async () => {
      try {
        const inputTest = 'test'
        const funcHandle = () => {
          throw new Error('test error')
        }
        uut.attempts = 1

        await uut.retryWrapper(funcHandle, inputTest)

        assert.fail('unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })

    it('should retry the specific number of times before giving up', async () => {
      const inputTest = 'test'
      const funcHandle = () => {
        throw new Error('test error')
      }
      // func handler
      const spy = sinon.spy(funcHandle)

      // p-retry attempts
      const attempts = 1

      try {
        uut.attempts = attempts

        await uut.retryWrapper(spy, inputTest)

        assert.fail('unexpected code path')
      } catch (error) {
        assert.equal(spy.callCount, attempts + 1)
      }
    })
  })

  describe('#filterSlpTxs', () => {
    it('should filter SLP txs from block', async () => {
      // From block 652,276
      const txs = [
        '5d7001c04bfb21a3d45bb084269ce811bf11269bc020eb4146440ebd66057d4a',
        '01b2118775d84a48dec3d31c760fddd8abc44dad6073b26f72d57fbc636d912d',
        '38d5f98dbe7ff2f0205c1a370d5d587d8d98aa65ad60d7026e381e7ba559d5d0',
        'a0b18e78d60b8ead3a5c45a00a964d04c2a8c268d62043fccc644b0efdcf5dd8',
        'e05035a3719559fa4627016fd1edb2cc490092c906a3415394a16b0d0add8178'
      ]

      // The first 4 blocks are not SLP. The 5th is.
      uut.adapters.transaction.getTokenInfo.reset()
      uut.adapters.transaction.getTokenInfo
        .onCall(0)
        .resolves(false)
        .onCall(1)
        .resolves(false)
        .onCall(2)
        .resolves(false)
        .onCall(3)
        .resolves(false)
        .onCall(4)
        .resolves(true)
      sandbox.stub(uut, 'deleteBurnedUtxos').resolves(true)

      const { slpTxs, nonSlpTxs } = await uut.filterSlpTxs(txs)
      // console.log(slpTxs)

      assert.isArray(slpTxs)
      assert.isArray(nonSlpTxs)
      assert.equal(slpTxs.length, 1)
      assert.equal(slpTxs[0], txs[4])
    })

    it('should skip blacklisted tokens (line 133)', async () => {
      const txs = [
        'blacklisted-tx-123',
        'normal-slp-tx-456'
      ]

      // First tx is SLP but blacklisted
      uut.adapters.transaction.getTokenInfo.reset()
      uut.adapters.transaction.getTokenInfo
        .onCall(0)
        .resolves({ tokenId: 'blacklisted-token-id' })
        .onCall(1)
        .resolves({ tokenId: 'normal-token-id' })

      // Set blacklist check to return true for the first token
      uut.adapters.blacklist.checkBlacklist.reset()
      uut.adapters.blacklist.checkBlacklist
        .onCall(0)
        .returns(true) // blacklisted
        .onCall(1)
        .returns(false) // not blacklisted

      sandbox.stub(uut, 'deleteBurnedUtxos').resolves(true)

      const { slpTxs, nonSlpTxs } = await uut.filterSlpTxs(txs)

      assert.isArray(slpTxs)
      assert.isArray(nonSlpTxs)
      // Blacklisted token should not be in slpTxs, but in nonSlpTxs
      assert.equal(slpTxs.length, 1)
      assert.equal(slpTxs[0], 'normal-slp-tx-456')
      assert.equal(nonSlpTxs.length, 1)
      assert.equal(nonSlpTxs[0], 'blacklisted-tx-123')
    })

    it('should catch and throw errors', async () => {
      try {
        // From block 652,276
        const txs = [
          '5d7001c04bfb21a3d45bb084269ce811bf11269bc020eb4146440ebd66057d4a',
          '01b2118775d84a48dec3d31c760fddd8abc44dad6073b26f72d57fbc636d912d',
          '38d5f98dbe7ff2f0205c1a370d5d587d8d98aa65ad60d7026e381e7ba559d5d0',
          'a0b18e78d60b8ead3a5c45a00a964d04c2a8c268d62043fccc644b0efdcf5dd8',
          'e05035a3719559fa4627016fd1edb2cc490092c906a3415394a16b0d0add8178'
        ]

        // Force an error
        uut.adapters.transaction.getTokenInfo.reset()
        uut.adapters.transaction.getTokenInfo.rejects(new Error('test error'))

        // Force retry to be 0.
        uut.attempts = 0

        await uut.filterSlpTxs(txs)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#checkForParent2', () => {
    it('should return 2-tx DAG', async () => {
      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0)
        .resolves(mockData.twoTxDag01)
        .onCall(1)
        .resolves(mockData.twoTxDag02)
        .onCall(2)
        .resolves(mockData.twoTxDag02)
        .onCall(3)
        .resolves(mockData.twoTxDag03)

      const txid =
        'e5ff3083cd2dcf87a40a4a4a478349a394c1a1eeffe4857c2a173b183fdd42a2'

      const result = await uut.checkForParent2(txid, 543413)
      // console.log('result: ', result)

      assert.equal(result.hasParent, true)
      assert.equal(result.dag.length, 2)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force error
        uut.adapters.cache.get.reset()
        uut.adapters.cache.get.rejects(new Error('test error'))

        const txid =
          'e5ff3083cd2dcf87a40a4a4a478349a394c1a1eeffe4857c2a173b183fdd42a2'

        await uut.checkForParent2(txid, 543413)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })

    it('should skip a TX if the TXID already exists in the array', async () => {
      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0)
        .resolves(mockData.twoTxDag01)
        .onCall(1)
        .resolves(mockData.twoTxDag01)

      const txid =
        'e5ff3083cd2dcf87a40a4a4a478349a394c1a1eeffe4857c2a173b183fdd42a2'

      const result = await uut.checkForParent2(txid, 543413)
      // console.log('result: ', result)

      assert.equal(result.hasParent, true)
      assert.equal(result.dag.length, 1)
    })
  })

  describe('#forwardDag', () => {
    it('should add forward TXID to DAG', async () => {
      // force cache to get data from the full node.
      uut.adapters.cache.txDb.get.reset()
      uut.adapters.cache.txDb.get.rejects(new Error('no entry'))

      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0)
        .resolves(mockData.forwardDagTx01)
        .onCall(1)
        .resolves(mockData.forwardDagTx02)
        .onCall(2)
        .resolves(mockData.forwardDagTx03)
        .onCall(3)
        .resolves(mockData.forwardDagTx02)
        .onCall(4)
        .resolves(mockData.forwardDagTx03)

      const chainedArray = [
        '170147548aad6de7c1df686c56e4846e0936c4573411b604a18d0ec76482dde2',
        'e5ff3083cd2dcf87a40a4a4a478349a394c1a1eeffe4857c2a173b183fdd42a2',
        'f56121d5a21a319204cf26ce68a6d607fefa02ba6ac42b4647fcad813b32d8b3',
        '660057b446cc4c930493607aa02e943e4fe7c38ae0816797ff7234ba72fea50f'
      ]
      const unsortedArray = [
        '234893177b18a95dbfc1eb855d69f1c9cc256a317a6c51be8fd1b9a38ae072ce',
        '82a9c47118dd221bf528e8b9ee9daef626ca52fb824b92cbe52a83e87afb0fac',
        '483d0198ed272bd0be7c6bbaf0e60340cce926f7d32143e2b09c5513922eaf87'
      ]

      const result = await uut.forwardDag(chainedArray, unsortedArray)
      // console.log('result: ', result)

      assert.equal(result.success, true)
      assert.equal(result.chainedArray.length, 5)
      assert.equal(result.unsortedArray.length, 2)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        uut.adapters.cache.get.reset()
        uut.adapters.cache.get.rejects(new Error('test error'))

        await uut.forwardDag(['fake-txid'], ['fake-txid'])

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#filterAndSortSlpTxs2', () => {
    it('should filter and sort a combination of independent and chained txs', async () => {
      // force cache to get data from the full node.
      uut.adapters.cache.txDb.get.reset()
      uut.adapters.cache.txDb.get.rejects(new Error('no entry'))

      const blockHeight = 543413
      const txs = [
        '170147548aad6de7c1df686c56e4846e0936c4573411b604a18d0ec76482dde2',
        '82a9c47118dd221bf528e8b9ee9daef626ca52fb824b92cbe52a83e87afb0fac',
        'e5ff3083cd2dcf87a40a4a4a478349a394c1a1eeffe4857c2a173b183fdd42a2'
      ]

      // Mock dependencies
      sandbox.stub(uut, 'filterSlpTxs').resolves({ slpTxs: txs, nonSlpTxs: [] })
      sandbox
        .stub(uut, 'checkForParent2')
        .onCall(0)
        .resolves({ hasParent: false, dag: [txs[0]] })
        .onCall(1)
        .resolves({ hasParent: false, dag: [txs[1]] })
      sandbox
        .stub(uut, 'forwardDag')
        .onCall(0)
        .resolves({
          success: true,
          chainedArray: [txs[0], txs[2]],
          unsortedArray: [txs[1]]
        })

      const { combined, nonSlpTxs } = await uut.filterAndSortSlpTxs2(txs, blockHeight)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(combined.length, 3)
      assert.include(combined[0], '82a9') // Independent tx
      assert.include(combined[2], 'e5ff') // newest chained tx
      assert.isArray(nonSlpTxs)
    })

    it('should return an empty array if given an empty array', async () => {
      const blockHeight = 543413
      const txs = []

      const result = await uut.filterAndSortSlpTxs2(txs, blockHeight)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result.combined)
      assert.equal(result.combined.length, 0)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut, 'filterSlpTxs').rejects(new Error('test error'))

        const blockHeight = 543413
        const txs = []

        await uut.filterAndSortSlpTxs2(txs, blockHeight)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })

    it('should remove independent TXs from the slp tx array', async () => {
      // force cache to get data from the full node.
      uut.adapters.cache.txDb.get.reset()
      uut.adapters.cache.txDb.get.rejects(new Error('no entry'))

      const blockHeight = 543413
      const txs = [
        '170147548aad6de7c1df686c56e4846e0936c4573411b604a18d0ec76482dde2',
        '82a9c47118dd221bf528e8b9ee9daef626ca52fb824b92cbe52a83e87afb0fac',
        'e5ff3083cd2dcf87a40a4a4a478349a394c1a1eeffe4857c2a173b183fdd42a2'
      ]

      // Mock dependencies
      sandbox.stub(uut, 'filterSlpTxs').resolves({ slpTxs: mockData.slpTxs01, nonSlpTxs: [] })
      sandbox
        .stub(uut, 'checkForParent2')
        .onCall(0)
        .resolves({ hasParent: false, dag: ['82a9c47118dd221bf528e8b9ee9daef626ca52fb824b92cbe52a83e87afb0fac'] })
        .onCall(1)
        .resolves({ hasParent: false, dag: ['170147548aad6de7c1df686c56e4846e0936c4573411b604a18d0ec76482dde2'] })
      sandbox
        .stub(uut, 'forwardDag')
        .onCall(0)
        .resolves({
          success: false,
          chainedArray: ['82a9c47118dd221bf528e8b9ee9daef626ca52fb824b92cbe52a83e87afb0fac']
        })
        .onCall(1)
        .resolves({
          success: true,
          chainedArray: [
            '170147548aad6de7c1df686c56e4846e0936c4573411b604a18d0ec76482dde2',
            'e5ff3083cd2dcf87a40a4a4a478349a394c1a1eeffe4857c2a173b183fdd42a2',
            'f56121d5a21a319204cf26ce68a6d607fefa02ba6ac42b4647fcad813b32d8b3',
            '660057b446cc4c930493607aa02e943e4fe7c38ae0816797ff7234ba72fea50f',
            '483d0198ed272bd0be7c6bbaf0e60340cce926f7d32143e2b09c5513922eaf87',
            '234893177b18a95dbfc1eb855d69f1c9cc256a317a6c51be8fd1b9a38ae072ce',
            'a333e7ebd34f0e24b567e99ed27241e3cfda5e9952cacdaa8fab31a7ee7e544d'
          ]
        })

      const { combined, nonSlpTxs } = await uut.filterAndSortSlpTxs2(txs, blockHeight)
      // console.log('combined: ', combined)
      // console.log('nonSlpTxs: ', nonSlpTxs)

      assert.equal(combined.length, 8)
      assert.include(combined[0], '82a9') // Independent tx
      assert.include(combined[2], 'e5ff') // newest chained tx
      assert.isArray(nonSlpTxs)
    })
  })

  describe('#getAddressFromTxid', () => {
    it('should return data from the utxo database', async () => {
      // Mock dependencies
      uut.adapters.utxoDb.getUTxo.reset()
      uut.adapters.utxoDb.getUTxo.resolves({ address: 'addr' })

      const result = await uut.getAddressFromTxid('fake-txid', 0)

      assert.equal(result, 'addr')
    })

    it('should return false if UTXO is not in database', async () => {
      // Mock dependencies
      uut.adapters.utxoDb.getUTxo.reset()
      uut.adapters.utxoDb.getUTxo.rejects(new Error('not found'))

      const result = await uut.getAddressFromTxid('fake-txid', 0)

      assert.equal(result, false)
    })
  })

  describe('#deleteBurnedUtxos', () => {
    it('should update address and token data from burn TXID', async () => {
      // Mock dependencies
      uut.adapters.transaction.getTxWithRetry.reset()
      uut.adapters.transaction.getTxWithRetry.resolves(mockData.burnTx01)
      sandbox.stub(uut, 'getAddressFromTxid').resolves('bitcoincash:qp3t5cuncq2czduh27ps3jmz08m37ey3s5le8qca2f')
      uut.addrDb.get.reset()
      uut.addrDb.get
        .onCall(0)
        .rejects(new Error('not found'))
        .onCall(1)
        .resolves(mockData.addrData01)
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get.resolves(mockData.burnTx01)
      uut.tokenDb.get.reset()
      uut.tokenDb.get.resolves(mockData.tokenData01)
      uut.addrDb.put.reset()
      uut.addrDb.put.resolves()
      uut.utxoDb.del.reset()
      uut.utxoDb.del.resolves()
      uut.tokenDb.put.reset()
      uut.tokenDb.put.resolves()

      const txid =
        '70d69e0f3d58e52526ef8136b20993b5b4d3f7c936771fd2f490ccfc5c019372'

      const result = await uut.deleteBurnedUtxos(txid)

      assert.equal(result, true)
    })

    it('should return true after processing non-token tx', async () => {
      // Mock dependencies
      uut.adapters.transaction.getTxWithRetry.reset()
      uut.adapters.transaction.getTxWithRetry.resolves(mockData.burnTx01)
      // Force utxo DB to not have the UTXOs in question. This simulates a non-
      // slp transaction.
      sandbox.stub(uut, 'getAddressFromTxid').resolves(false)

      const txid =
        '70d69e0f3d58e52526ef8136b20993b5b4d3f7c936771fd2f490ccfc5c019372'

      const result = await uut.deleteBurnedUtxos(txid)

      assert.equal(result, true)
    })

    it('should return false on a processing error', async () => {
      // Force error
      uut.adapters.transaction.getTxWithRetry.reset()
      uut.adapters.transaction.getTxWithRetry.rejects(new Error('test error'))

      const result = await uut.deleteBurnedUtxos()

      assert.equal(result, false)
    })
  })
})
