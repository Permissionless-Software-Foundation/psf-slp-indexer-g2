/*
  Unit tests for the tx-db.js library
*/

import { assert } from 'chai'
import sinon from 'sinon'

import TxDb from '../../../src/adapters/tx-db.js'

describe('#tx-db', () => {
  let uut, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new TxDb()
  })

  afterEach(() => sandbox.restore())

  describe('#getTx', () => {
    it('should get a transaction', async () => {
      // Mock dependencies
      const mockData = { txid: 'test-tx', data: 'test-data' }
      sandbox.stub(uut.axios, 'get').resolves({ data: mockData })

      const result = await uut.getTx('test-tx')

      assert.equal(result, mockData)
      assert.equal(uut.axios.get.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'get').rejects(new Error('test error'))

        await uut.getTx('test-tx')

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#createTx', () => {
    it('should create a transaction', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'post').resolves({ data: mockData })

      const result = await uut.createTx('test-tx', { data: 'test' })

      assert.equal(result, mockData)
      assert.equal(uut.axios.post.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'post').rejects(new Error('test error'))

        await uut.createTx('test-tx', { data: 'test' })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#updateTx', () => {
    it('should update a transaction', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'put').resolves({ data: mockData })

      const result = await uut.updateTx('test-tx', { data: 'updated' })

      assert.equal(result, mockData)
      assert.equal(uut.axios.put.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'put').rejects(new Error('test error'))

        await uut.updateTx('test-tx', { data: 'updated' })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#deleteTx', () => {
    it('should delete a transaction', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'delete').resolves({ data: mockData })

      const result = await uut.deleteTx('test-tx')

      assert.equal(result, mockData)
      assert.equal(uut.axios.delete.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'delete').rejects(new Error('test error'))

        await uut.deleteTx('test-tx')

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })
})
