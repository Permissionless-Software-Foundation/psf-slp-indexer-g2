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
        chainBlockHeight: 543500
      }
      sandbox.stub(uut.axios, 'get').resolves({ data: mockData })

      const result = await uut.getStatus()

      assert.equal(result, mockData)
      assert.equal(uut.axios.get.called, true)
    })

    it('should create status if not found', async () => {
      // Mock dependencies
      uut.config.exitOnMissingBackup = false
      sandbox.stub(uut.axios, 'get').rejects(new Error('not found'))
      sandbox.stub(uut.retryQueue, 'addToQueue').resolves(543500)
      sandbox.stub(uut.axios, 'post').resolves({ data: { success: true } })

      const result = await uut.getStatus()

      assert.equal(result.startBlockHeight, 543375)
      assert.equal(result.syncedBlockHeight, 543375)
      assert.equal(result.chainBlockHeight, 543500)
      assert.equal(uut.axios.post.called, true)
    })

    it('should exit if status not found and EXIT_ON_MISSING_BACKUP is set', async () => {
      // Mock dependencies
      uut.config.exitOnMissingBackup = true
      sandbox.stub(uut.axios, 'get').rejects(new Error('not found'))
      const exitStub = sandbox.stub(process, 'exit').callsFake(() => {
        // Prevent actual exit but stop execution by throwing
        throw new Error('process.exit called')
      })
      // Stub post to verify it's not called
      sandbox.stub(uut.axios, 'post')

      try {
        await uut.getStatus()
        assert.fail('Should have exited')
      } catch (err) {
        // Verify process.exit was called with exit code 1
        assert.equal(exitStub.called, true)
        assert.equal(exitStub.firstCall.args[0], 1)
        // Verify that post was not called (should exit before creating new status)
        assert.equal(uut.axios.post.called, false)
      }
    })
  })

  describe('#updateStatus', () => {
    it('should update status', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'put').resolves({ data: { success: true } })

      const status = {
        startBlockHeight: 543375,
        syncedBlockHeight: 543400,
        chainBlockHeight: 543500
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
          chainBlockHeight: 543500
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
