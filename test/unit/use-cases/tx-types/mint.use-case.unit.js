/*
  Unit tests for MINT tx indexing library mint.js
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import cloneDeep from 'lodash.clonedeep'
import BigNumber from 'bignumber.js'

// Local libraries
import Mint from '../../../../src/use-cases/tx-types/mint.js'
import mockDataLib from '../../mocks/mint-mock.js'

describe('#mint.js', () => {
  let uut, sandbox, mockData

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    // Create mock adapters
    const mockCache = {
      get: sandbox.stub()
    }
    const mockAddrDb = {
      getAddr: sandbox.stub(),
      createAddr: sandbox.stub().resolves()
    }
    const mockTokenDb = {
      getToken: sandbox.stub(),
      createToken: sandbox.stub().resolves()
    }
    const mockTxDb = {
      getTx: sandbox.stub().rejects(new Error('not in db')),
      createTx: sandbox.stub().resolves()
    }
    const mockUtxoDb = {
      createUtxo: sandbox.stub().resolves(),
      deleteUtxo: sandbox.stub().resolves()
    }

    const adapters = {
      cache: mockCache,
      addrDb: mockAddrDb,
      tokenDb: mockTokenDb,
      txDb: mockTxDb,
      utxoDb: mockUtxoDb
    }

    uut = new Mint({ adapters })

    mockData = cloneDeep(mockDataLib)
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw error if adapters are not passed in', () => {
      try {
        uut = new Mint()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'Adapters are required for the mint.js use case library.')
      }
    })
  })

  describe('#removeBatonInAddr', () => {
    it('should remove mint baton from input address', async () => {
      // Mock database
      uut.adapters.addrDb.getAddr.reset()
      uut.adapters.addrDb.getAddr
      // First call should throw an error
        .onCall(0).rejects(new Error('not found'))
      // Second call returns baton input data.
        .onCall(1).resolves(mockData.mintAddrDb01)

      const result = await uut.removeBatonInAddr(mockData.mintData)

      assert.equal(result, true)
    })

    it('should throw error if baton is not found', async () => {
      try {
      // Change the token ID of the mock data, to force the desired code path.
        mockData.mintAddrDb01.utxos[0].txid = 'fake-txid'

        // Mock database
        uut.adapters.addrDb.getAddr.reset()
        uut.adapters.addrDb.getAddr
        // First call should throw an error
          .onCall(0).rejects(new Error('not found'))
          // Second call returns baton input data.
          .onCall(1).resolves(mockData.mintAddrDb01)

        await uut.removeBatonInAddr(mockData.mintData)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'Minting baton not found. UTXO 938cc18e618967d787897bbc64b9a8d201b94ec7c69b1a9949eab0433ba5cdf8:2 is not in database.')
      }
    })
  })

  describe('#addTokensFromOutput', () => {
    it('should update address balance with newly minted tokens', async () => {
      // Force generation of a new address
      uut.adapters.addrDb.getAddr.reset()
      uut.adapters.addrDb.getAddr.rejects(new Error('not found'))

      const result = await uut.addTokensFromOutput(mockData.mintData)
      assert.equal(result, true)
    })

    it('should catch and throw errors', async () => {
      try {
        await uut.addTokensFromOutput()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Cannot destructure property')
      }
    })
  })

  describe('#updateBalanceFromMint', () => {
    it('should add new balances to the address', async () => {
      const result = await uut.updateBalanceFromMint(mockData.mintAddrDb02, mockData.mintData.slpData)
      // console.log(`mockData.mintAddrDb02: ${JSON.stringify(mockData.mintAddrDb02, null, 2)}`)

      assert.equal(result, true)
      assert.equal(mockData.mintAddrDb02.balances[0].qty, '234123')
    })

    it('should add new tokens to existing balance', async () => {
      // Force address to have a balance of a different token
      mockData.mintAddrDb02.balances.push({
        tokenId: 'abc123'
      })
      // Force address to have an existing balance
      mockData.mintAddrDb02.balances.push({
        tokenId: mockData.mintData.slpData.tokenId,
        qty: new BigNumber(10)
      })

      const result = await uut.updateBalanceFromMint(mockData.mintAddrDb02, mockData.mintData.slpData)
      // console.log(`mockData.mintAddrDb02: ${JSON.stringify(mockData.mintAddrDb02, null, 2)}`)

      assert.equal(result, true)
      assert.equal(mockData.mintAddrDb02.balances[1].qty, '234133')
    })

    it('should catch and throw errors', async () => {
      try {
        await uut.updateBalanceFromMint()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Cannot read')
      }
    })
  })

  describe('#updateTokenStats', () => {
    it('should update token stats', async () => {
      // Simulate token stats in the database
      uut.adapters.tokenDb.getToken.reset()
      uut.adapters.tokenDb.getToken.resolves({
        tokensInCirculationBN: new BigNumber(1),
        tokensInCirculationStr: '1',
        txs: []
      })

      const result = await uut.updateTokenStats(mockData.mintData)
      // console.log('result: ', result)

      assert.equal(result.tokensInCirculationStr, '234124')
      assert.equal(result.mintBatonIsActive, true)
    })

    it('should mark baton as inactive', async () => {
      // Simulate token stats in the database
      uut.adapters.tokenDb.getToken.reset()
      uut.adapters.tokenDb.getToken.resolves({
        tokensInCirculationBN: new BigNumber(1),
        tokensInCirculationStr: '1',
        txs: []
      })

      // Force mint baton to be inactive
      mockData.mintData.slpData.mintBatonVout = 0

      const result = await uut.updateTokenStats(mockData.mintData)
      // console.log('result: ', result)

      assert.equal(result.tokensInCirculationStr, '234124')
      assert.equal(result.mintBatonIsActive, false)
    })

    it('should catch and throw errors', async () => {
      try {
        await uut.updateTokenStats()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Cannot destructure property')
      }
    })
  })

  describe('#addBatonOutAddr', () => {
    it('should add the baton to the output address', async () => {
      // Force generation of a new address
      uut.adapters.addrDb.getAddr.reset()
      uut.adapters.addrDb.getAddr.rejects(new Error('not found'))

      const result = await uut.addBatonOutAddr(mockData.mintData)
      // console.log('result: ', result)

      // Assert that the baton was placed in the new output address.
      assert.equal(result.utxos[0].type, 'baton')
    })

    it('should return if the mint baton is null', async () => {
      // Force mint baton to be dead ended.
      mockData.mintData.slpData.mintBatonVout = 0

      const result = await uut.addBatonOutAddr(mockData.mintData)

      assert.equal(result, undefined)
    })

    it('should catch and throw errors', async () => {
      try {
        await uut.addBatonOutAddr()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Cannot destructure property')
      }
    })
  })

  describe('#processTx', () => {
    it('should exit if SLP tx fails DAG validation', async () => {
      // Force DAG validation to fail
      sandbox.stub(uut.dag, 'crawlDag').resolves({ isValid: false })

      const result = await uut.processTx(mockData.mintData)

      assert.equal(result, false)
    })

    it('should successfully process Mint TX', async () => {
      // Mock dependencies
      sandbox.stub(uut.dag, 'crawlDag').resolves({ isValid: true })
      sandbox.stub(uut, 'removeBatonInAddr').resolves()
      sandbox.stub(uut, 'addTokensFromOutput').resolves()
      sandbox.stub(uut, 'updateTokenStats').resolves()
      sandbox.stub(uut, 'addBatonOutAddr').resolves()

      const result = await uut.processTx(mockData.mintData)

      assert.equal(result, true)
    })

    it('should catch and throw errors', async () => {
      try {
        await uut.processTx()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Cannot read')
      }
    })

    it('should exit if input tx has invalid mint baton', async () => {
      // Force DAG validation to pass
      sandbox.stub(uut.dag, 'crawlDag').resolves({ isValid: true })

      // Force baton input to fail
      sandbox.stub(uut, 'findBatonInput').returns(null)

      const result = await uut.processTx(mockData.mintData)

      assert.equal(result, false)
    })
  })

  describe('#findBatonInput', () => {
    it('should return baton vin', () => {
      const result = uut.findBatonInput(mockData.mintData)
      // console.log('result: ', result)

      assert.equal(result, 1)
    })

    it('should return null for invalid mint tx', () => {
      const result = uut.findBatonInput(mockData.invalidMintData01)
      // console.log('result: ', result)

      assert.equal(result, null)
    })

    it('should catch and throw errors', async () => {
      try {
        await uut.findBatonInput()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Cannot read')
      }
    })
  })
})
