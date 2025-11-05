/*
  Unit tests for the backup-db.js library
*/

import { assert } from 'chai'
import sinon from 'sinon'

import DbCtrl from '../../../src/adapters/backup-db.js'

describe('#backup-db', () => {
  let uut, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new DbCtrl()
  })

  afterEach(() => sandbox.restore())

  describe('#backupDb', () => {
    it('should backup the databases', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'post').resolves()

      const result = await uut.backupDb(100, 1234567890)

      assert.equal(result, true)
      assert.equal(uut.axios.post.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'post').rejects(new Error('test error'))

        await uut.backupDb(100, 1234567890)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#rollbackDb', () => {
    it('should rollback databases', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'post').resolves()

      const result = await uut.rollbackDb(100)

      assert.equal(result, true)
      assert.equal(uut.axios.post.called, true)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'post').rejects(new Error('test error'))

        await uut.rollbackDb(100)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })
})

