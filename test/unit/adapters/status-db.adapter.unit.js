/*
  Unit tests for the status-db.js library
*/

import { assert } from 'chai'
import sinon from 'sinon'

import StatusDb from '../../../src/adapters/status-db.js'

describe('#status-db', () => {
  let uut, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new StatusDb()
  })

  afterEach(() => sandbox.restore())

  describe('#getStatus', () => {
    it('should get status from database', async () => {
      // Mock dependencies
      const mockData = {
        startBlockHeight: 543375,
        syncedBlockHeight: 543400,
        chainTipHeight: 543500
      }
      sandbox.stub(uut.axios, 'get').resolves({ data: mockData })

      const result = await uut.getStatus()

      assert.equal(result, mockData)
      assert.equal(uut.axios.get.called, true)
    })

    it('should create status if not found', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'get').rejects(new Error('not found'))
      sandbox.stub(uut.retryQueue, 'addToQueue').resolves(543500)
      sandbox.stub(uut.axios, 'post').resolves({ data: { success: true } })

      const result = await uut.getStatus()

      assert.equal(result.startBlockHeight, 543375)
      assert.equal(result.syncedBlockHeight, 543375)
      assert.equal(result.chainTipHeight, 543500)
      assert.equal(uut.axios.post.called, true)
    })
  })

  describe('#updateStatus', () => {
    it('should update status', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'put').resolves({ data: { success: true } })

      const status = {
        startBlockHeight: 543375,
        syncedBlockHeight: 543400,
        chainTipHeight: 543500
      }

      const result = await uut.updateStatus(status)

      assert.equal(result, true)
      assert.equal(uut.axios.put.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'put').rejects(new Error('test error'))

        const status = {
          startBlockHeight: 543375,
          syncedBlockHeight: 543400,
          chainTipHeight: 543500
        }

        await uut.updateStatus(status)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })

    it('should throw error if status is missing required properties', async () => {
      try {
        // Missing required properties
        await uut.updateStatus({})

        assert.fail('Unexpected result')
      } catch (err) {
        assert.isOk(err.message)
      }
    })
  })
})
