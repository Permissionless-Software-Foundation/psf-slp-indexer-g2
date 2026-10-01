/*
  Unit tests for the backup.js library
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import Backup from '../../../src/use-cases/backup.js'

describe('#backup.js', () => {
  let uut, sandbox, adapters

  beforeEach(() => {
    // Restore the sandbox before each test.
    sandbox = sinon.createSandbox()

    // Create mock adapters
    adapters = {
      dbCtrl: {
        backupDb: sandbox.stub().resolves(true)
      }
    }

    uut = new Backup({ adapters })
  })

  afterEach(() => sandbox.restore())

  describe('#constructor()', () => {
    it('should throw an error if adapters instance is not provided', () => {
      try {
        uut = new Backup()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(
          err.message,
          'Must pass adapters when instantiating backup.js'
        )
      }
    })
  })

  describe('#backupIfNeeded()', () => {
    it('should request a backup at an epoch boundary', async () => {
      const result = await uut.backupIfNeeded(1000, 1000)

      assert.equal(result, true)
      assert.equal(adapters.dbCtrl.backupDb.callCount, 1)
      assert.deepEqual(adapters.dbCtrl.backupDb.firstCall.args, [1000, 1000])
    })

    it('should request a backup at a multiple of the epoch', async () => {
      const result = await uut.backupIfNeeded(2000, 1000)

      assert.equal(result, true)
      assert.equal(adapters.dbCtrl.backupDb.callCount, 1)
      assert.deepEqual(adapters.dbCtrl.backupDb.firstCall.args, [2000, 1000])
    })

    it('should not request a backup between epoch boundaries', async () => {
      const result = await uut.backupIfNeeded(1001, 1000)

      assert.equal(result, false)
      assert.equal(adapters.dbCtrl.backupDb.callCount, 0)
    })

    it('should not request a backup at height zero', async () => {
      const result = await uut.backupIfNeeded(0, 1000)

      assert.equal(result, false)
      assert.equal(adapters.dbCtrl.backupDb.callCount, 0)
    })

    it('should request a backup at height 1 with epoch 1', async () => {
      const result = await uut.backupIfNeeded(1, 1)

      assert.equal(result, true)
      assert.equal(adapters.dbCtrl.backupDb.callCount, 1)
      assert.deepEqual(adapters.dbCtrl.backupDb.firstCall.args, [1, 1])
    })

    it('should support a configurable epoch smaller than 1000', async () => {
      const result = await uut.backupIfNeeded(500, 500)

      assert.equal(result, true)
      assert.equal(adapters.dbCtrl.backupDb.callCount, 1)
      assert.deepEqual(adapters.dbCtrl.backupDb.firstCall.args, [500, 500])
    })

    it('should not request a backup just past a non-1000 epoch boundary', async () => {
      const result = await uut.backupIfNeeded(1001, 500)

      assert.equal(result, false)
      assert.equal(adapters.dbCtrl.backupDb.callCount, 0)
    })
  })
})
