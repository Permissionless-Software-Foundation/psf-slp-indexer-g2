/*
  Unit tests for the dag.js library
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import cloneDeep from 'lodash.clonedeep'

// Local libraries
import DAG from '../../../src/use-cases/dag.js'
import mockDataLib from '../mocks/dag-mock.js'

describe('#dag.js', () => {
  let uut, sandbox, mockData

  beforeEach(() => {
    // Mock test data
    mockData = cloneDeep(mockDataLib)

    // Restore the sandbox before each test.
    sandbox = sinon.createSandbox()

    // Create mock adapters with cache
    const mockCache = {
      get: sandbox.stub()
    }

    const adapters = {
      cache: mockCache
    }

    uut = new DAG({ adapters })
  })

  afterEach(() => sandbox.restore())

  describe('#constructor()', () => {
    it('should throw an error if adapters instance is not provided', () => {
      try {
        uut = new DAG()

        assert.fail('Unexpected code path')
        console.log(uut)
      } catch (err) {
        assert.equal(
          err.message,
          'Adapters are required for the dag.js use case library.'
        )
      }
    })
  })

  describe('#crawlDag()', () => {
    it('should throw an error if txid is not included', async () => {
      try {
        await uut.crawlDag()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'txid required to crawl DAG')
      }
    })

    it('should throw an error if tokenId is not included', async () => {
      try {
        const txid = '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e'

        await uut.crawlDag(txid)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'tokenId required to crawl DAG')
      }
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        uut.adapters.cache.get.reset()
        uut.adapters.cache.get.rejects(new Error('test error'))

        const txid = '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e'
        const tokenId =
            '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'

        await uut.crawlDag(txid, tokenId)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })

    // Happy path - simple two-tx DAG.
    it('should return true for valid SEND', async () => {
      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0).resolves(mockData.slpSendTxData01)
        .onCall(1).resolves(mockData.slpGenesisTxData01)

      const txid = '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e'
      const tokenId =
        '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'

      const result = await uut.crawlDag(txid, tokenId)
      // console.log('result: ', result)

      assert.equal(result.isValid, true)
      assert.equal(result.dag.length, 2)
    })

    it('should return false if tx has no inputs', async () => {
      // Force token quantity to be zero.
      mockData.slpSendTxData01.vin[0].tokenQty = 0

      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0).resolves(mockData.slpSendTxData01)
        .onCall(1).resolves(mockData.slpGenesisTxData01)

      const txid = '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e'
      const tokenId =
        '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'

      const result = await uut.crawlDag(txid, tokenId)
      // console.log('result: ', result)

      assert.equal(result.isValid, false)
      assert.equal(result.dag.length, 1)
    })

    it('should return true for a mint baton', async () => {
      // Force token quantity to be zero
      mockData.slpSendTxData01.vin[0].tokenQty = 0

      // Force input to have mint baton
      mockData.slpSendTxData01.vin[0].isMintBaton = true

      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0).resolves(mockData.slpSendTxData01)
        .onCall(1).resolves(mockData.slpGenesisTxData01)

      const txid = '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e'
      const tokenId =
        '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'

      const result = await uut.crawlDag(txid, tokenId)
      // console.log('result: ', result)

      assert.equal(result.isValid, true)
      assert.equal(result.dag.length, 2)
    })

    it('should return false if parent has different token type', async () => {
      // Force parent TX to have a different token type.
      mockData.slpGenesisTxData01.tokenType = 45

      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0).resolves(mockData.slpSendTxData01)
        .onCall(1).resolves(mockData.slpGenesisTxData01)

      const txid = '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e'
      const tokenId =
        '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'

      const result = await uut.crawlDag(txid, tokenId)
      // console.log('result: ', result)

      assert.equal(result.isValid, false)
      assert.equal(result.dag.length, 1)
    })

    it('should throw an error if parent has different tokenId', async () => {
      // Force parent to have different token ID
      mockData.slpGenesisTxData01.tokenId =
        'aaaaae35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'

      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0).resolves(mockData.slpSendTxData01)
        .onCall(1).resolves(mockData.slpGenesisTxData01)

      const txid = '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e'
      const tokenId =
        '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'

      try {
        await uut.crawlDag(txid, tokenId)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'TokenID does not match')
      }
    })

    it('should return true if endFound is true', async () => {
      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0).resolves(mockData.slpSendTxData01)
        .onCall(1).resolves(mockData.slpGenesisTxData01)

      const txid = '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e'
      const tokenId =
        '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'

      const result = await uut.crawlDag(txid, tokenId, [], true)
      // console.log('result: ', result)

      assert.equal(result.isValid, true)
      assert.equal(result.dag.length, 0)
    })

    it('should return false if endFound is false', async () => {
      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0).resolves(mockData.slpSendTxData01)
        .onCall(1).resolves(mockData.slpGenesisTxData01)

      const txid = '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e'
      const tokenId =
        '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'

      const result = await uut.crawlDag(txid, tokenId, [], false)
      // console.log('result: ', result)

      assert.equal(result.isValid, false)
      assert.equal(result.dag.length, 0)
    })

    it('should validate 3-tx DAG', async () => {
      // Mock dependencies - need to cover all recursive calls
      // The DAG crawls: threeTxTestData01 -> threeTxTestData02 -> threeTxTestData03 (genesis)
      uut.adapters.cache.get.reset()
      // Use a function-based approach to handle all calls
      uut.adapters.cache.get.callsFake((txid) => {
        if (txid === mockData.threeTxTestData01.txid) {
          return Promise.resolve(mockData.threeTxTestData01)
        }
        if (txid === mockData.threeTxTestData02.txid) {
          return Promise.resolve(mockData.threeTxTestData02)
        }
        if (txid === mockData.threeTxTestData03.txid) {
          return Promise.resolve(mockData.threeTxTestData03)
        }
        // Fallback - return undefined to trigger error handling
        return Promise.resolve(undefined)
      })

      const txid =
        '4e52e0ec21d26feb8bdcafdbe48d0f15662f1ba2b3bea8200bcf0a90d7c209ee'
      const tokenId =
        'd9aa162704578945543f5856400546310392a3e68a7922fbc3490e2f21cc7501'

      const result = await uut.crawlDag(txid, tokenId)
      // console.log('result: ', result)

      assert.equal(result.isValid, true)
      assert.equal(result.dag.length, 3)
    })

    it('should use pre-cached, pre-validated parent TXs', async () => {
      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get.callsFake((txid) => {
        if (txid === mockData.cachedTx01.txid) {
          return Promise.resolve(mockData.cachedTx01)
        }
        if (txid === mockData.cachedTxParent01.txid) {
          return Promise.resolve(mockData.cachedTxParent01)
        }
        return Promise.resolve(undefined)
      })

      const txid = '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e'
      const tokenId =
        '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'

      const result = await uut.crawlDag(txid, tokenId)
      // console.log('result: ', result)

      assert.equal(result.isValid, true)
      assert.equal(result.dag.length, 2)
    })

    it('should exit immediately for genesis TX', async () => {
      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0).resolves(mockData.slpGenesisTxData01)

      const txid = '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'
      const tokenId =
        '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'

      const result = await uut.crawlDag(txid, tokenId)
      // console.log('result: ', result)

      assert.equal(result.isValid, true)
      assert.equal(result.dag.length, 1)
    })

    it('should invalidate NFT if Genesis does not originate from a Group token.', async () => {
      // Mock dependencies
      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0).resolves(mockData.invalidNftTx01)
        .onCall(1).resolves(mockData.invlidNftParentTx01)

      const txid = '6d68a7ffbb63ef851c43025f801a1d365cddda50b00741bca022c743d74cd61a'
      const tokenId =
        '9b6db26b64aedcedc0bd9a3037b29b3598573ec5cea99eec03faa838616cd683'

      const result = await uut.crawlDag(txid, tokenId)
      // console.log('result: ', result)

      assert.equal(result.isValid, false)
      assert.isArray(result.dag)
      // The txid is added to dag before validation, so length will be at least 1
      assert.isAtLeast(result.dag.length, 1)
    })

    it('should return early when parentTx found in DB with matching vout (lines 127-135)', async () => {
      // Create mock data where parentTx.isValidSlp = true and vout matches
      const childTx = {
        txid: 'child-tx-123',
        tokenType: 1,
        tokenId: 'token-id-123',
        vin: [{
          txid: 'parent-tx-123',
          vout: 1,
          tokenQty: 1000,
          tokenId: 'token-id-123'
        }],
        vout: []
      }

      const parentTx = {
        txid: 'parent-tx-123',
        tokenType: 1,
        tokenId: 'token-id-123',
        isValidSlp: true,
        vin: [],
        vout: [{
          n: 1,
          tokenQty: 1000
        }]
      }

      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0).resolves(childTx)
        .onCall(1).resolves(parentTx)

      const txid = 'child-tx-123'
      const tokenId = 'token-id-123'

      const result = await uut.crawlDag(txid, tokenId)

      assert.equal(result.isValid, true)
      assert.isArray(result.dag)
      assert.include(result.dag, 'parent-tx-123')
      // Should return early, so should only have 2 calls (child and parent)
      assert.equal(uut.adapters.cache.get.callCount, 2)
    })

    it('should invalidate NFT Genesis not originating from Group token (lines 156-163)', async () => {
      // Create mock data where parentTx is NFT (tokenType !== 1) and vin[0].tokenQty === 0
      const nftTx = {
        txid: 'nft-tx-123',
        tokenType: 65,
        tokenId: 'nft-token-id-123',
        vin: [{
          txid: 'nft-genesis-tx-123',
          vout: 1,
          tokenQty: 1,
          tokenId: 'nft-token-id-123'
        }],
        vout: []
      }

      const nftGenesisTx = {
        txid: 'nft-genesis-tx-123',
        tokenType: 65,
        txType: 'GENESIS',
        tokenId: 'nft-token-id-123',
        vin: [{
          txid: 'some-parent',
          vout: 0,
          tokenQty: 0, // No group token on vin[0]
          tokenId: null
        }],
        vout: []
      }

      uut.adapters.cache.get.reset()
      uut.adapters.cache.get
        .onCall(0).resolves(nftTx)
        .onCall(1).resolves(nftGenesisTx)

      const txid = 'nft-tx-123'
      const tokenId = 'nft-token-id-123'

      const result = await uut.crawlDag(txid, tokenId)

      assert.equal(result.isValid, false)
      assert.deepEqual(result.dag, [])
    })
  })
})
