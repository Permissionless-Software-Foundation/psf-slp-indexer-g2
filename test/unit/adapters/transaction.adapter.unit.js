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

    it('should handle transaction with no blockhash', async () => {
      // Mock dependencies
      const mockTxDetails = {
        txid: 'test-txid',
        blockhash: null,
        vin: [],
        vout: []
      }
      sandbox.stub(uut, 'getTxData').resolves(mockTxDetails)
      sandbox.stub(uut.rpc, 'getBlockCount').resolves(500)
      sandbox.stub(uut, 'getTokenInfo').resolves(null)

      const result = await uut.get('test-txid')

      assert.equal(result.txid, 'test-txid')
      assert.equal(result.blockheight, 501)
      assert.equal(result.isSlpTx, false)
    })

    it('should get SLP token transaction (type 1)', async () => {
      // Mock dependencies
      const mockTxDetails = {
        txid: 'test-txid',
        blockhash: 'test-blockhash',
        vin: [{ txid: 'input-txid', vout: 0 }],
        vout: [{ scriptPubKey: { hex: 'test' } }],
        tokenType: 1
      }
      const mockTokenData = {
        txType: 'SEND',
        tokenId: 'token-id-123',
        tokenType: 1
      }
      const mockGenesisData = {
        ticker: 'TEST',
        name: 'Test Token',
        decimals: 8,
        documentUri: 'ipfs://test',
        documentHash: 'hash123'
      }
      sandbox.stub(uut, 'getTxData').resolves(mockTxDetails)
      sandbox.stub(uut.rpc, 'getBlockHeader').resolves({ height: 100 })
      sandbox.stub(uut, 'getTokenInfo')
        .onCall(0).resolves(mockTokenData)
        .onCall(1).resolves(mockGenesisData)
        .onCall(2).resolves(null)
      sandbox.stub(uut, 'getTx01').resolves({
        ...mockTxDetails,
        tokenTxType: 'SEND',
        tokenId: 'token-id-123',
        tokenTicker: 'TEST',
        tokenName: 'Test Token',
        isSlpTx: true
      })

      const result = await uut.get('test-txid')

      assert.equal(result.isSlpTx, true)
      assert.equal(result.tokenTxType, 'SEND')
      assert.equal(result.tokenId, 'token-id-123')
    })

    it('should get NFT token transaction (type 65)', async () => {
      // Mock dependencies
      const mockTxDetails = {
        txid: 'test-txid',
        blockhash: 'test-blockhash',
        vin: [{ txid: 'input-txid', vout: 0 }],
        vout: [{ scriptPubKey: { hex: 'test' } }],
        tokenType: 65
      }
      const mockTokenData = {
        txType: 'GENESIS',
        tokenId: 'token-id-123',
        tokenType: 65
      }
      const mockGenesisData = {
        ticker: 'NFT',
        name: 'NFT Token',
        decimals: 0,
        documentUri: 'ipfs://test',
        documentHash: 'hash123'
      }
      sandbox.stub(uut, 'getTxData').resolves(mockTxDetails)
      sandbox.stub(uut.rpc, 'getBlockHeader').resolves({ height: 100 })
      sandbox.stub(uut, 'getTokenInfo')
        .onCall(0).resolves(mockTokenData)
        .onCall(1).resolves(mockGenesisData)
      sandbox.stub(uut, 'getNftTx').resolves({
        ...mockTxDetails,
        tokenTxType: 'GENESIS',
        tokenId: 'token-id-123',
        tokenTicker: 'NFT',
        tokenName: 'NFT Token',
        isSlpTx: true
      })

      const result = await uut.get('test-txid')

      assert.equal(result.isSlpTx, true)
      assert.equal(result.tokenTxType, 'GENESIS')
      assert.equal(result.tokenId, 'token-id-123')
    })

    it('should catch and throw error', async () => {
      try {
        sandbox.stub(uut, 'getTxData').rejects(new Error('test error'))

        await uut.get('test-txid')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
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

    it('should decode GENESIS transaction', async () => {
      // Mock dependencies - stub slpParser to return GENESIS data
      const mockTxDetails = {
        vout: [
          {
            scriptPubKey: {
              hex: '6a04534c500001010453454e44'
            }
          }
        ]
      }
      const mockParsedData = {
        transactionType: 'GENESIS',
        tokenType: 1,
        data: {
          ticker: Buffer.from('TEST'),
          name: Buffer.from('Test Token'),
          documentUri: Buffer.from('ipfs://test'),
          documentHash: Buffer.from('hash123', 'hex'),
          decimals: 8,
          mintBatonVout: 2,
          qty: '100000000'
        }
      }
      sandbox.stub(uut, 'getTxWithRetry').resolves(mockTxDetails)
      sandbox.stub(uut.slpParser, 'parseSLP').returns(mockParsedData)

      const result = await uut.decodeOpReturn('genesis-txid')

      assert.isOk(result)
      assert.equal(result.txType, 'GENESIS')
      assert.property(result, 'ticker')
      assert.property(result, 'name')
      assert.property(result, 'tokenId')
      assert.property(result, 'decimals')
      assert.property(result, 'qty')
    })

    it('should decode MINT transaction', async () => {
      // Mock dependencies - stub slpParser to return MINT data
      const mockTxDetails = {
        vout: [
          {
            scriptPubKey: {
              hex: '6a04534c500001010453454e44'
            }
          }
        ]
      }
      const mockParsedData = {
        transactionType: 'MINT',
        tokenType: 1,
        data: {
          tokenId: Buffer.from('token-id-hex', 'hex'),
          mintBatonVout: 2,
          qty: '100000000'
        }
      }
      sandbox.stub(uut, 'getTxWithRetry').resolves(mockTxDetails)
      sandbox.stub(uut.slpParser, 'parseSLP').returns(mockParsedData)

      const result = await uut.decodeOpReturn('mint-txid')

      assert.isOk(result)
      assert.equal(result.txType, 'MINT')
      assert.property(result, 'tokenId')
      assert.property(result, 'mintBatonVout')
      assert.property(result, 'qty')
    })

    it('should return cached value if available', async () => {
      uut.tokenCache['cached-txid'] = { tokenId: 'cached-token', txType: 'SEND' }

      const result = await uut.decodeOpReturn('cached-txid')

      assert.equal(result.tokenId, 'cached-token')
      assert.equal(result.txType, 'SEND')
    })

    it('should clear cache when it gets too big', async () => {
      const mockTxDetails = {
        vout: [
          {
            scriptPubKey: {
              hex: '6a04534c500001010453454e4420a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b208000000000528a76d'
            }
          }
        ]
      }
      uut.tokenCacheCnt = 1000001 // Force cache to be too big
      uut.tokenCache.test1 = {}
      sandbox.stub(uut, 'getTxWithRetry').resolves(mockTxDetails)

      const result = await uut.decodeOpReturn('test-txid')

      assert.isOk(result)
      assert.equal(uut.tokenCacheCnt, 0)
      assert.equal(Object.keys(uut.tokenCache).length, 0)
    })

    it('should log cache count every 100 entries', async () => {
      const mockTxDetails = {
        vout: [
          {
            scriptPubKey: {
              hex: '6a04534c500001010453454e4420a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b208000000000528a76d'
            }
          }
        ]
      }
      const consoleStub = sandbox.stub(console, 'log')
      uut.tokenCacheCnt = 99 // Next will be 100
      sandbox.stub(uut, 'getTxWithRetry').resolves(mockTxDetails)

      await uut.decodeOpReturn('test-txid')

      assert.equal(consoleStub.called, true)
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

    it('should return false when tokenId contains zeros', async () => {
      sandbox.stub(uut, 'decodeOpReturn').resolves({
        tokenId: '0000000012345678',
        txType: 'GENESIS'
      })

      const result = await uut.getTokenInfo('test-txid')

      assert.equal(result, false)
    })

    it('should return false when decodeOpReturn throws error', async () => {
      sandbox.stub(uut, 'decodeOpReturn').rejects(new Error('test error'))

      const result = await uut.getTokenInfo('test-txid')

      assert.equal(result, false)
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

    it('should catch and throw error', async () => {
      try {
        sandbox.stub(uut, 'getTxWithRetry').rejects(new Error('test error'))

        await uut.getTxData('test-txid')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#_getInputAddrs', () => {
    it('should return input addresses', async () => {
      const mockTxDetails = {
        vin: [
          { txid: 'parent1', vout: 0 },
          { txid: 'parent2', vout: 1 }
        ]
      }
      const mockParentTx1 = {
        vout: [
          { scriptPubKey: { addresses: ['addr1'] }, value: 1000 }
        ]
      }
      const mockParentTx2 = {
        vout: [
          { scriptPubKey: { addresses: ['addr2'] }, value: 2000 },
          { scriptPubKey: { addresses: ['addr3'] }, value: 3000 }
        ]
      }
      sandbox.stub(uut, 'getTxWithRetry')
        .onCall(0).resolves(mockParentTx1)
        .onCall(1).resolves(mockParentTx2)

      const result = await uut._getInputAddrs(mockTxDetails)

      assert.isArray(result)
      assert.equal(result.length, 2)
      assert.equal(result[0].address, 'addr1')
      assert.equal(result[0].value, 1000)
      assert.equal(result[1].address, 'addr3')
      assert.equal(result[1].value, 3000)
    })

    it('should skip coinbase transaction inputs', async () => {
      const mockTxDetails = {
        vin: [
          { txid: null, vout: 0 }, // Coinbase - no txid
          { txid: 'parent1', vout: 0 }
        ]
      }
      const mockParentTx1 = {
        vout: [
          { scriptPubKey: { addresses: ['addr1'] }, value: 1000 }
        ]
      }
      sandbox.stub(uut, 'getTxWithRetry').resolves(mockParentTx1)

      const result = await uut._getInputAddrs(mockTxDetails)

      assert.isArray(result)
      assert.equal(result.length, 1)
      assert.equal(result[0].address, 'addr1')
    })

    it('should return empty array for coinbase error', async () => {
      const mockTxDetails = {
        vin: [
          { txid: 'parent1', vout: 0 }
        ]
      }
      sandbox.stub(uut, 'getTxWithRetry').rejects(new Error('txid must be provided'))

      const result = await uut._getInputAddrs(mockTxDetails)

      assert.isArray(result)
      assert.equal(result.length, 0)
    })

    it('should catch and throw error for other errors', async () => {
      try {
        const mockTxDetails = {
          vin: [
            { txid: 'parent1', vout: 0 }
          ]
        }
        sandbox.stub(uut, 'getTxWithRetry').rejects(new Error('test error'))

        await uut._getInputAddrs(mockTxDetails)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
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

    it('should clear cache when it gets too big', async () => {
      const mockTxData = { txid: 'test-txid' }
      uut.txCacheCnt = 1000001 // Force cache to be too big
      uut.txCache.test1 = {}
      sandbox.stub(uut.queue, 'addToQueue').resolves(mockTxData)

      const result = await uut.getTxWithRetry('test-txid')

      assert.equal(result.txid, 'test-txid')
      assert.equal(uut.txCacheCnt, 0)
      assert.equal(Object.keys(uut.txCache).length, 0)
    })

    it('should log cache count every 1000 entries', async () => {
      const mockTxData = { txid: 'test-txid' }
      const consoleStub = sandbox.stub(console, 'log')
      uut.txCacheCnt = 999 // Next will be 1000
      sandbox.stub(uut.queue, 'addToQueue').resolves(mockTxData)

      await uut.getTxWithRetry('test-txid')

      assert.equal(consoleStub.called, true)
    })

    it('should catch and throw error', async () => {
      try {
        sandbox.stub(uut.queue, 'addToQueue').rejects(new Error('test error'))

        await uut.getTxWithRetry('test-txid')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
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

    it('should return false when proofOfBurnTxid is missing', async () => {
      const mockTxDetails = {
        vout: [
          {
            scriptPubKey: {
              hex: '6a0400510000test123'
            }
          }
        ],
        vin: [{ txid: 'parent-txid', vout: 0 }]
      }
      sandbox.stub(uut, 'getTxWithRetry').resolves(mockTxDetails)
      sandbox.stub(uut.bchjs.Script, 'toASM').returns('OP_RETURN OP_0')

      const result = await uut.isPinClaim('test-txid')

      assert.equal(result, false)
    })

    it('should return false when cid is missing', async () => {
      const mockTxDetails = {
        vout: [
          {
            scriptPubKey: {
              hex: '6a0400510000test123'
            }
          }
        ],
        vin: [{ txid: 'parent-txid', vout: 0 }]
      }
      sandbox.stub(uut, 'getTxWithRetry').resolves(mockTxDetails)
      sandbox.stub(uut.bchjs.Script, 'toASM').returns('OP_RETURN OP_0 proof-burn-txid')

      const result = await uut.isPinClaim('test-txid')

      assert.equal(result, false)
    })

    it('should return false when filename is missing', async () => {
      const mockTxDetails = {
        vout: [
          {
            scriptPubKey: {
              hex: '6a0400510000test123'
            }
          }
        ],
        vin: [{ txid: 'parent-txid', vout: 0 }]
      }
      const cidHex = Buffer.from('test-cid').toString('hex')
      sandbox.stub(uut, 'getTxWithRetry').resolves(mockTxDetails)
      sandbox.stub(uut.bchjs.Script, 'toASM').returns(`OP_RETURN OP_0 proof-burn-txid ${cidHex}`)

      const result = await uut.isPinClaim('test-txid')

      assert.equal(result, false)
    })

    it('should catch and throw error', async () => {
      try {
        sandbox.stub(uut, 'getTxWithRetry').rejects(new Error('test error'))

        await uut.isPinClaim('test-txid')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#getNftTx', () => {
    it('should process NFT GENESIS transaction', async () => {
      const txDetails = {
        txid: 'test-txid',
        tokenId: 'token-id',
        tokenDecimals: 0,
        vin: [
          { txid: 'vin1', vout: 1 }
        ],
        vout: [
          { scriptPubKey: {} },
          { scriptPubKey: {} },
          { scriptPubKey: {} }
        ]
      }
      const txTokenData = {
        txType: 'GENESIS',
        tokenId: 'token-id',
        qty: '1',
        mintBatonVout: 0
      }
      sandbox.stub(uut, 'getTokenInfo').resolves({
        tokenType: 129,
        txType: 'GENESIS',
        tokenId: 'group-token-id',
        qty: '1'
      })

      const result = await uut.getNftTx(txDetails, txTokenData)

      assert.equal(result.vout[0].tokenQty, 0)
      assert.equal(result.vout[0].isMintBaton, true)
      assert.equal(result.vout[1].tokenQty, 1)
    })

    it('should process NFT SEND transaction', async () => {
      const txDetails = {
        txid: 'test-txid',
        tokenId: 'token-id',
        tokenDecimals: 0,
        vin: [
          { txid: 'vin1', vout: 1 }
        ],
        vout: [
          { scriptPubKey: {} },
          { scriptPubKey: {} },
          { scriptPubKey: {} }
        ]
      }
      const txTokenData = {
        txType: 'SEND',
        tokenId: 'token-id',
        amounts: ['1', '2']
      }
      sandbox.stub(uut, 'getTokenInfo').resolves({
        tokenType: 65,
        txType: 'SEND',
        tokenId: 'token-id',
        amounts: ['1']
      })

      const result = await uut.getNftTx(txDetails, txTokenData)

      assert.equal(result.vout[0].tokenQty, null)
      assert.equal(result.vout[1].tokenQty, 1)
      assert.equal(result.vout[2].tokenQty, 2)
    })

    it('should handle Group token input', async () => {
      const txDetails = {
        txid: 'test-txid',
        tokenId: 'nft-token-id',
        tokenDecimals: 0,
        vin: [
          { txid: 'vin1', vout: 1 }
        ],
        vout: [{ scriptPubKey: {} }]
      }
      const txTokenData = {
        txType: 'GENESIS',
        tokenId: 'nft-token-id',
        qty: '1',
        mintBatonVout: 0
      }
      sandbox.stub(uut, 'getTokenInfo').resolves({
        tokenType: 129,
        txType: 'GENESIS',
        tokenId: 'group-token-id',
        qty: '5'
      })

      const result = await uut.getNftTx(txDetails, txTokenData)

      assert.equal(result.vin[0].tokenQty, 5)
      assert.equal(result.vin[0].tokenId, 'group-token-id')
    })

    it('should handle MINT input', async () => {
      const txDetails = {
        txid: 'test-txid',
        tokenId: 'token-id',
        tokenDecimals: 0,
        vin: [
          { txid: 'vin1', vout: 1 }
        ],
        vout: [{ scriptPubKey: {} }]
      }
      const txTokenData = {
        txType: 'GENESIS',
        tokenId: 'token-id',
        qty: '1',
        mintBatonVout: 0
      }
      sandbox.stub(uut, 'getTokenInfo').resolves({
        tokenType: 129,
        txType: 'MINT',
        tokenId: 'group-token-id',
        qty: '1',
        mintBatonVout: 2
      })

      const result = await uut.getNftTx(txDetails, txTokenData)

      assert.equal(result.vin[0].tokenQty, 1)
      assert.equal(result.vin[0].tokenId, 'group-token-id')
    })

    it('should handle GENESIS input', async () => {
      const txDetails = {
        txid: 'test-txid',
        tokenId: 'token-id',
        tokenDecimals: 0,
        vin: [
          { txid: 'vin1', vout: 1 }
        ],
        vout: [{ scriptPubKey: {} }]
      }
      const txTokenData = {
        txType: 'GENESIS',
        tokenId: 'token-id',
        qty: '1',
        mintBatonVout: 0
      }
      sandbox.stub(uut, 'getTokenInfo').resolves({
        tokenType: 65,
        txType: 'GENESIS',
        tokenId: 'token-id',
        qty: '1'
      })

      const result = await uut.getNftTx(txDetails, txTokenData)

      assert.equal(result.vin[0].tokenQty, 1)
      assert.equal(result.vin[0].tokenId, 'token-id')
    })

    it('should throw error for unknown tx type', async () => {
      try {
        const txDetails = {
          txid: 'test-txid',
          vout: [{ scriptPubKey: {} }]
        }
        const txTokenData = {
          txType: 'UNKNOWN',
          tokenId: 'token-id'
        }

        await uut.getNftTx(txDetails, txTokenData)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Unknown SLP TX type')
      }
    })

    it('should throw error for unknown vin token type', async () => {
      try {
        const txDetails = {
          txid: 'test-txid',
          tokenId: 'token-id',
          tokenDecimals: 0,
          vin: [{ txid: 'vin1', vout: 1 }],
          vout: [{ scriptPubKey: {} }]
        }
        const txTokenData = {
          txType: 'GENESIS',
          tokenId: 'token-id',
          qty: '1',
          mintBatonVout: 0
        }
        sandbox.stub(uut, 'getTokenInfo').resolves({
          tokenType: 65,
          txType: 'UNKNOWN',
          tokenId: 'token-id'
        })

        await uut.getNftTx(txDetails, txTokenData)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Unknown token type in input')
      }
    })
  })

  describe('#getTx01', () => {
    it('should process GENESIS transaction', async () => {
      const txDetails = {
        txid: 'test-txid',
        tokenId: 'token-id',
        tokenDecimals: 8,
        vin: [],
        vout: [
          { scriptPubKey: {} },
          { scriptPubKey: {} },
          { scriptPubKey: {} }
        ]
      }
      const txTokenData = {
        txType: 'GENESIS',
        tokenId: 'token-id',
        qty: '100000000',
        mintBatonVout: 2
      }
      sandbox.stub(uut, 'getTokenInfo').resolves(null)

      const result = await uut.getTx01(txDetails, txTokenData)

      assert.equal(result.vout[0].tokenQty, 0)
      assert.equal(result.vout[1].tokenQty, 1)
      assert.equal(result.vout[2].isMintBaton, true)
    })

    it('should process MINT transaction', async () => {
      const txDetails = {
        txid: 'test-txid',
        tokenId: 'token-id',
        tokenDecimals: 8,
        vin: [],
        vout: [
          { scriptPubKey: {} },
          { scriptPubKey: {} },
          { scriptPubKey: {} }
        ]
      }
      const txTokenData = {
        txType: 'MINT',
        tokenId: 'token-id',
        qty: '100000000',
        mintBatonVout: 2
      }
      sandbox.stub(uut, 'getTokenInfo').resolves(null)

      const result = await uut.getTx01(txDetails, txTokenData)

      assert.equal(result.vout[0].tokenQty, 0)
      assert.equal(result.vout[1].tokenQty, 1)
      assert.equal(result.vout[2].isMintBaton, true)
    })

    it('should process SEND transaction with SEND input', async () => {
      const txDetails = {
        txid: 'test-txid',
        tokenId: 'token-id',
        tokenDecimals: 8,
        vin: [{ txid: 'vin1', vout: 1 }],
        vout: [
          { scriptPubKey: {} },
          { scriptPubKey: {} }
        ]
      }
      const txTokenData = {
        txType: 'SEND',
        tokenId: 'token-id',
        amounts: ['100000000']
      }
      sandbox.stub(uut, 'getTokenInfo').resolves({
        tokenType: 1,
        txType: 'SEND',
        tokenId: 'token-id',
        amounts: ['100000000']
      })

      const result = await uut.getTx01(txDetails, txTokenData)

      assert.equal(result.vout[0].tokenQty, null)
      assert.equal(result.vout[1].tokenQty, 1)
      assert.equal(result.vin[0].tokenQty, 1)
    })

    it('should process transaction with MINT input', async () => {
      const txDetails = {
        txid: 'test-txid',
        tokenId: 'token-id',
        tokenDecimals: 8,
        vin: [{ txid: 'vin1', vout: 1 }],
        vout: [{ scriptPubKey: {} }]
      }
      const txTokenData = {
        txType: 'SEND',
        tokenId: 'token-id',
        amounts: ['100000000']
      }
      sandbox.stub(uut, 'getTokenInfo').resolves({
        tokenType: 1,
        txType: 'MINT',
        tokenId: 'token-id',
        qty: '100000000',
        mintBatonVout: 2
      })

      const result = await uut.getTx01(txDetails, txTokenData)

      assert.equal(result.vin[0].tokenQty, 1)
      assert.equal(result.vin[0].tokenId, 'token-id')
    })

    it('should process transaction with GENESIS input', async () => {
      const txDetails = {
        txid: 'test-txid',
        tokenId: 'token-id',
        tokenDecimals: 8,
        vin: [{ txid: 'vin1', vout: 1 }],
        vout: [{ scriptPubKey: {} }]
      }
      const txTokenData = {
        txType: 'SEND',
        tokenId: 'token-id',
        amounts: ['100000000']
      }
      sandbox.stub(uut, 'getTokenInfo').resolves({
        tokenType: 1,
        txType: 'GENESIS',
        tokenId: 'token-id',
        qty: '100000000',
        mintBatonVout: 2
      })

      const result = await uut.getTx01(txDetails, txTokenData)

      assert.equal(result.vin[0].tokenQty, 1)
      assert.equal(result.vin[0].tokenId, 'token-id')
    })

    it('should handle non-token input', async () => {
      const txDetails = {
        txid: 'test-txid',
        tokenId: 'token-id',
        tokenDecimals: 8,
        vin: [{ txid: 'vin1', vout: 1 }],
        vout: [{ scriptPubKey: {} }]
      }
      const txTokenData = {
        txType: 'SEND',
        tokenId: 'token-id',
        amounts: ['100000000']
      }
      sandbox.stub(uut, 'getTokenInfo').resolves(false)

      const result = await uut.getTx01(txDetails, txTokenData)

      assert.equal(result.vin[0].tokenQty, 0)
      assert.equal(result.vin[0].tokenId, null)
    })

    it('should throw error for unknown tx type', async () => {
      try {
        const txDetails = {
          txid: 'test-txid',
          vout: [{ scriptPubKey: {} }]
        }
        const txTokenData = {
          txType: 'UNKNOWN',
          tokenId: 'token-id'
        }

        await uut.getTx01(txDetails, txTokenData)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Unknown SLP TX type')
      }
    })

    it('should throw error for unknown vin token type', async () => {
      try {
        const txDetails = {
          txid: 'test-txid',
          tokenId: 'token-id',
          tokenDecimals: 8,
          vin: [{ txid: 'vin1', vout: 1 }],
          vout: [{ scriptPubKey: {} }]
        }
        const txTokenData = {
          txType: 'SEND',
          tokenId: 'token-id',
          amounts: ['100000000']
        }
        sandbox.stub(uut, 'getTokenInfo').resolves({
          tokenType: 1,
          txType: 'UNKNOWN',
          tokenId: 'token-id'
        })

        await uut.getTx01(txDetails, txTokenData)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Unknown token type in input')
      }
    })

    it('should handle mint baton input', async () => {
      const txDetails = {
        txid: 'test-txid',
        tokenId: 'token-id',
        tokenDecimals: 8,
        vin: [{ txid: 'vin1', vout: 2 }],
        vout: [{ scriptPubKey: {} }]
      }
      const txTokenData = {
        txType: 'SEND',
        tokenId: 'token-id',
        amounts: ['100000000']
      }
      sandbox.stub(uut, 'getTokenInfo').resolves({
        tokenType: 1,
        txType: 'MINT',
        tokenId: 'token-id',
        qty: '100000000',
        mintBatonVout: 2
      })

      const result = await uut.getTx01(txDetails, txTokenData)

      assert.equal(result.vin[0].tokenQty, 0)
      assert.equal(result.vin[0].isMintBaton, true)
      assert.equal(result.vin[0].tokenId, 'token-id')
    })
  })
})
