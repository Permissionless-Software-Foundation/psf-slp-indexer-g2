/*
  Unit tests for the tx-indexer.js library
*/

import { assert } from 'chai'
import sinon from 'sinon'

import TxIndexerAdapter from '../../../src/adapters/tx-indexer.js'

describe('#tx-indexer', () => {
  let uut, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new TxIndexerAdapter()
  })

  afterEach(() => sandbox.restore())

  describe('#startTxIndexer', () => {
    it('should start the tx indexer', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'get').resolves({ data: { success: true } })

      const result = await uut.startTxIndexer()

      assert.equal(result, true)
      assert.equal(uut.axios.get.called, true)
    })

    it('should handle errors gracefully', async () => {
      // Mock dependencies - error should be caught and logged, not thrown
      sandbox.stub(uut.axios, 'get').rejects(new Error('test error'))

      await uut.startTxIndexer()

      // Should return undefined or false, not throw
      assert.isOk(true) // Just verify it doesn't throw
    })
  })
})
