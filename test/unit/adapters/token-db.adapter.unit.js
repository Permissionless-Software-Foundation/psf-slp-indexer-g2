/*
  Unit tests for the token-db.js library
*/

import { assert } from 'chai'
import sinon from 'sinon'

import TokenDb from '../../../src/adapters/token-db.js'

describe('#token-db', () => {
  let uut, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new TokenDb()
  })

  afterEach(() => sandbox.restore())

  describe('#getToken', () => {
    it('should get a token', async () => {
      // Mock dependencies
      const mockData = { tokenId: 'test-token', data: 'test-data' }
      sandbox.stub(uut.axios, 'get').resolves({ data: mockData })

      const result = await uut.getToken('test-token')

      assert.equal(result, mockData)
      assert.equal(uut.axios.get.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'get').rejects(new Error('test error'))

        await uut.getToken('test-token')

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#createToken', () => {
    it('should create a token', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'post').resolves({ data: mockData })

      const result = await uut.createToken('test-token', { data: 'test' })

      assert.equal(result, mockData)
      assert.equal(uut.axios.post.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'post').rejects(new Error('test error'))

        await uut.createToken('test-token', { data: 'test' })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#updateToken', () => {
    it('should update a token', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'put').resolves({ data: mockData })

      const result = await uut.updateToken('test-token', { data: 'updated' })

      assert.equal(result, mockData)
      assert.equal(uut.axios.put.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'put').rejects(new Error('test error'))

        await uut.updateToken('test-token', { data: 'updated' })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#deleteToken', () => {
    it('should delete a token', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'delete').resolves({ data: mockData })

      const result = await uut.deleteToken('test-token')

      assert.equal(result, mockData)
      assert.equal(uut.axios.delete.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'delete').rejects(new Error('test error'))

        await uut.deleteToken('test-token')

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })
})

