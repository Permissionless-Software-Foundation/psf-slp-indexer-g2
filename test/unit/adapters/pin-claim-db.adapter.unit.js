/*
  Unit tests for the pin-claim-db.js library
*/

import { assert } from 'chai'
import sinon from 'sinon'

import PinClaimDb from '../../../src/adapters/pin-claim-db.js'

describe('#pin-claim-db', () => {
  let uut, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new PinClaimDb()
  })

  afterEach(() => sandbox.restore())

  describe('#getPinClaim', () => {
    it('should get a pin claim', async () => {
      // Mock dependencies
      const mockData = { claimId: 'test-claim', data: 'test-data' }
      sandbox.stub(uut.axios, 'get').resolves({ data: mockData })

      const result = await uut.getPinClaim('test-claim')

      assert.equal(result, mockData)
      assert.equal(uut.axios.get.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'get').rejects(new Error('test error'))

        await uut.getPinClaim('test-claim')

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#createPinClaim', () => {
    it('should create a pin claim', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'post').resolves({ data: mockData })

      const result = await uut.createPinClaim('test-claim', { data: 'test' })

      assert.equal(result, mockData)
      assert.equal(uut.axios.post.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'post').rejects(new Error('test error'))

        await uut.createPinClaim('test-claim', { data: 'test' })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#updatePinClaim', () => {
    it('should update a pin claim', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'put').resolves({ data: mockData })

      const result = await uut.updatePinClaim('test-claim', { data: 'updated' })

      assert.equal(result, mockData)
      assert.equal(uut.axios.put.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'put').rejects(new Error('test error'))

        await uut.updatePinClaim('test-claim', { data: 'updated' })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#deletePinClaim', () => {
    it('should delete a pin claim', async () => {
      // Mock dependencies
      const mockData = { success: true }
      sandbox.stub(uut.axios, 'delete').resolves({ data: mockData })

      const result = await uut.deletePinClaim('test-claim')

      assert.equal(result, mockData)
      assert.equal(uut.axios.delete.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'delete').rejects(new Error('test error'))

        await uut.deletePinClaim('test-claim')

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })
})
