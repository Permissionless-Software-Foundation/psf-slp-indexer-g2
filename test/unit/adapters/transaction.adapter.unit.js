/*
  Unit tests for the transaction.js library.
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

import Transaction from '../../../src/adapters/transaction.js'

describe('#Transaction', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new Transaction()
  })

  afterEach(() => sandbox.restore())

  describe('#get', () => {
    it('should throw an error for a non-string input', async () => {
      try {
        const txid = 53423 // Not a string.

        await uut.get(txid)

        assert.equal(true, false, 'Unexpected result.')
      } catch (err) {
        assert.include(err.message, 'must be a string')
      }
    })

    it('should get transaction data', async () => {
      // Mock dependencies
      const mockTxDetails = {
        txid: 'test-txid',
        blockhash: 'test-blockhash',
        vin: [],
        vout: []
      }
      sandbox.stub(uut, 'getTxData').resolves(mockTxDetails)
      sandbox.stub(uut.rpc, 'getBlockHeader').resolves({ height: 100 })
      sandbox.stub(uut, 'getTokenInfo').resolves(null)

      const result = await uut.get('test-txid')

      assert.equal(result.txid, 'test-txid')
      assert.equal(result.blockheight, 100)
      assert.equal(result.isSlpTx, false)
    })
  })

  describe('#decodeOpReturn', () => {
    it('should throw an error for non-string input', async () => {
      try {
        const txid = 53423 // Not a string.

        await uut.decodeOpReturn(txid)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'txid string must be included')
      }
    })

    it('should decode OP_RETURN data', async () => {
      // Mock dependencies
      const mockTxDetails = {
        vout: [
          {
            scriptPubKey: {
              hex: '6a04534c500001010453454e4420a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b208000000000528a76d'
            }
          }
        ]
      }
      sandbox.stub(uut, 'getTxWithRetry').resolves(mockTxDetails)

      const result = await uut.decodeOpReturn('test-txid')

      assert.isOk(result)
      assert.equal(result.txType, 'SEND')
    })
  })

  describe('#getTokenInfo', () => {
    it('should get token info from cache', async () => {
      // Mock dependencies
      uut.tokenCache['test-txid'] = { tokenId: 'test-token', txType: 'GENESIS' }

      const result = await uut.getTokenInfo('test-txid')

      assert.equal(result.tokenId, 'test-token')
      assert.equal(result.txType, 'GENESIS')
    })

    it('should get token info by decoding OP_RETURN', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'decodeOpReturn').resolves({
        tokenId: 'test-token',
        txType: 'GENESIS'
      })

      const result = await uut.getTokenInfo('test-txid')

      assert.equal(result.tokenId, 'test-token')
      assert.equal(result.txType, 'GENESIS')
    })
  })

  describe('#getTxData', () => {
    it('should throw an error for non-string input', async () => {
      try {
        const txid = 53423 // Not a string.

        await uut.getTxData(txid)

        assert.fail('Unexpected code path')
      } catch (err) {
        // Error comes from getTxWithRetry which validates the input
        assert.isOk(err.message)
      }
    })

    it('should get transaction data', async () => {
      // Mock dependencies
      const mockTxDetails = {
        txid: 'test-txid',
        vin: [{ txid: 'input-txid', vout: 0 }],
        vout: []
      }
      const mockInputAddrs = [
        { vin: 0, address: 'addr1', value: 1000 }
      ]
      sandbox.stub(uut, 'getTxWithRetry').resolves(mockTxDetails)
      sandbox.stub(uut, '_getInputAddrs').resolves(mockInputAddrs)

      const result = await uut.getTxData('test-txid')

      assert.equal(result.txid, 'test-txid')
      assert.equal(result.vin[0].address, 'addr1')
      assert.equal(result.vin[0].value, 1000)
    })
  })

  describe('#getTxWithRetry', () => {
    it('should throw an error for non-string input', async () => {
      try {
        const txid = 53423 // Not a string.

        await uut.getTxWithRetry(txid)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'txid string must be included')
      }
    })

    it('should get transaction from cache', async () => {
      // Mock dependencies
      uut.txCache['test-txid'] = { txid: 'test-txid', data: 'cached' }

      const result = await uut.getTxWithRetry('test-txid')

      assert.equal(result.txid, 'test-txid')
      assert.equal(result.data, 'cached')
    })

    it('should get transaction with retry', async () => {
      // Mock dependencies
      const mockTxData = { txid: 'test-txid' }
      sandbox.stub(uut.queue, 'addToQueue').resolves(mockTxData)

      const result = await uut.getTxWithRetry('test-txid')

      assert.equal(result.txid, 'test-txid')
    })
  })

  describe('#isPinClaim', () => {
    it('should return false for non-pin claim transaction', async () => {
      // Mock dependencies
      const mockTxDetails = {
        vout: [
          {
            scriptPubKey: {
              hex: '6a04534c500001010453454e44'
            }
          }
        ]
      }
      sandbox.stub(uut, 'getTxWithRetry').resolves(mockTxDetails)

      const result = await uut.isPinClaim('test-txid')

      assert.equal(result, false)
    })

    it('should return true for pin claim transaction', async () => {
      // Mock dependencies
      const mockTxDetails = {
        vout: [
          {
            scriptPubKey: {
              hex: '6a0400510000test123'
            }
          }
        ],
        vin: [
          {
            txid: 'parent-txid',
            vout: 0
          }
        ]
      }
      const mockParentTx = {
        vout: [
          {
            scriptPubKey: {
              addresses: ['test-address']
            }
          }
        ]
      }
      // Convert test strings to hex for the mock
      const cidHex = Buffer.from('test-cid').toString('hex')
      const filenameHex = Buffer.from('test-filename').toString('hex')
      sandbox.stub(uut, 'getTxWithRetry')
        .onCall(0).resolves(mockTxDetails)
        .onCall(1).resolves(mockParentTx)
      // Script array: [0]=OP_RETURN, [1]=OP_0, [2]=proofOfBurnTxid, [3]=cidHex, [4]=filenameHex
      sandbox.stub(uut.bchjs.Script, 'toASM').returns(`OP_RETURN OP_0 proof-burn-txid ${cidHex} ${filenameHex}`)

      const result = await uut.isPinClaim('test-txid')

      assert.isObject(result)
      assert.equal(result.proofOfBurnTxid, 'proof-burn-txid')
      assert.equal(result.cid, 'test-cid')
      assert.equal(result.filename, 'test-filename')
      assert.equal(result.claimTxid, 'test-txid')
      assert.equal(result.address, 'test-address')
    })
  })
})
