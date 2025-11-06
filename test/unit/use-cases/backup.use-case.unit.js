/*
  Unit tests for the backup.js library
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import Backup from '../../../src/use-cases/backup.js'

describe('#backup.js', () => {
  let uut, sandbox

  beforeEach(() => {
    // Restore the sandbox before each test.
    sandbox = sinon.createSandbox()

    // Create mock adapters
    const adapters = {
      backupDb: {}
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
    it('should handle empty stub method', async () => {
      const result = await uut.backupIfNeeded()

      assert.isUndefined(result)
    })

    it('should accept input object without errors', async () => {
      const result = await uut.backupIfNeeded({ blockHeight: 1000 })

      assert.isUndefined(result)
    })
  })
})

