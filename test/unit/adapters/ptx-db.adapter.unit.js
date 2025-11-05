/*
  Unit tests for the ptx-db.js library
*/

import { assert } from 'chai'
import sinon from 'sinon'

import PTxDb from '../../../src/adapters/ptx-db.js'

describe('#ptx-db', () => {
  let uut, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new PTxDb()
  })

  afterEach(() => sandbox.restore())

  describe('#getPTx', () => {
    it('should get a processed transaction', async () => {
      // Mock dependencies
      const mockData = { ptxKey: 'test-key', data: 'test-data' }
      sandbox.stub(uut.axios, 'get').resolves({ data: mockData })

      const result = await uut.getPTx('test-key')

      assert.equal(result, mockData)
      assert.equal(uut.axios.get.called, true)
    })
  })

  describe('#createPTx', () => {
    it('should create a processed transaction', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'post').resolves({ data: mockData })

      const result = await uut.createPTx('test-key', { data: 'test' })

      assert.equal(result, mockData)
      assert.equal(uut.axios.post.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'post').rejects(new Error('test error'))

        await uut.createPTx('test-key', { data: 'test' })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#updatePTx', () => {
    it('should update a processed transaction', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'put').resolves({ data: mockData })

      const result = await uut.updatePTx('test-key', { data: 'updated' })

      assert.equal(result, mockData)
      assert.equal(uut.axios.put.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'put').rejects(new Error('test error'))

        await uut.updatePTx('test-key', { data: 'updated' })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#deletePTx', () => {
    it('should delete a processed transaction', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'delete').resolves({ data: mockData })

      const result = await uut.deletePTx('test-key')

      assert.equal(result, mockData)
      assert.equal(uut.axios.delete.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'delete').rejects(new Error('test error'))

        await uut.deletePTx('test-key')

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })
})

