/*
  Unit tests for the addr-db.js library
*/

import { assert } from 'chai'
import sinon from 'sinon'

import AddrDb from '../../../src/adapters/addr-db.js'

describe('#addr-db', () => {
  let uut, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new AddrDb()
  })

  afterEach(() => sandbox.restore())

  describe('#getAddr', () => {
    it('should get an address', async () => {
      // Mock dependencies
      const mockData = { addr: 'test-addr', data: 'test-data' }
      sandbox.stub(uut.axios, 'get').resolves({ data: mockData })

      const result = await uut.getAddr('test-addr')

      assert.equal(result, mockData)
      assert.equal(uut.axios.get.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'get').rejects(new Error('test error'))

        await uut.getAddr('test-addr')

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#createAddr', () => {
    it('should create an address', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'post').resolves({ data: mockData })

      const result = await uut.createAddr('test-addr', { data: 'test' })

      assert.equal(result, mockData)
      assert.equal(uut.axios.post.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'post').rejects(new Error('test error'))

        await uut.createAddr('test-addr', { data: 'test' })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#updateAddr', () => {
    it('should update an address', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'put').resolves({ data: mockData })

      const result = await uut.updateAddr('test-addr', { data: 'updated' })

      assert.equal(result, mockData)
      assert.equal(uut.axios.put.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'put').rejects(new Error('test error'))

        await uut.updateAddr('test-addr', { data: 'updated' })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#deleteAddr', () => {
    it('should delete an address', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'delete').resolves({ data: mockData })

      const result = await uut.deleteAddr('test-addr')

      assert.equal(result, mockData)
      assert.equal(uut.axios.delete.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'delete').rejects(new Error('test error'))

        await uut.deleteAddr('test-addr')

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })
})

