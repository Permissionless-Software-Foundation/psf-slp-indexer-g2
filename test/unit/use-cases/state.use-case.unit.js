/*
  Unit tests for the state.js library
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import State from '../../../src/use-cases/state.js'

describe('#state.js', () => {
  let uut, sandbox

  beforeEach(() => {
    // Restore the sandbox before each test.
    sandbox = sinon.createSandbox()

    // Create mock adapters
    const mockStatusDb = {
      getStatus: sandbox.stub(),
      updateStatus: sandbox.stub().resolves()
    }

    const adapters = {
      statusDb: mockStatusDb
    }

    uut = new State({ adapters })
  })

  afterEach(() => sandbox.restore())

  describe('#constructor()', () => {
    it('should throw an error if adapters instance is not provided', () => {
      try {
        uut = new State()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(
          err.message,
          'Adapters are required for the state.js use case library.'
        )
      }
    })

    it('should initialize retryQueue', () => {
      const adapters = {
        statusDb: {}
      }

      uut = new State({ adapters })

      assert.isOk(uut.retryQueue)
    })
  })

  describe('#getStatus()', () => {
    it('should return status from statusDb', async () => {
      const mockStatus = {
        lastIndexedBlockHeight: 1000,
        syncedBlockHeight: 999
      }

      uut.adapters.statusDb.getStatus.resolves(mockStatus)

      const result = await uut.getStatus()

      assert.deepEqual(result, mockStatus)
      assert.equal(uut.adapters.statusDb.getStatus.called, true)
    })

    it('should propagate errors from statusDb', async () => {
      uut.adapters.statusDb.getStatus.rejects(new Error('database error'))

      try {
        await uut.getStatus()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'database error')
      }
    })
  })

  describe('#updateIndexedBlockHeight()', () => {
    it('should update indexed block height correctly', async () => {
      const lastIndexedBlockHeight = 1000
      const mockStatus = {
        lastIndexedBlockHeight: 999,
        syncedBlockHeight: 999 // Should match lastIndexedBlockHeight - 1
      }

      uut.adapters.statusDb.getStatus.resolves(mockStatus)

      const result = await uut.updateIndexedBlockHeight({ lastIndexedBlockHeight })

      assert.equal(result, 1001) // Returns lastIndexedBlockHeight + 1
      assert.equal(uut.adapters.statusDb.updateStatus.called, true)

      const updatedStatus = uut.adapters.statusDb.updateStatus.firstCall.args[0]
      assert.equal(updatedStatus.lastIndexedBlockHeight, 1000)
      assert.equal(updatedStatus.syncedBlockHeight, 1000)
    })

    it('should update syncedBlockHeight to match lastIndexedBlockHeight', async () => {
      const lastIndexedBlockHeight = 2000
      const mockStatus = {
        lastIndexedBlockHeight: 1999,
        syncedBlockHeight: 1999 // Should match lastIndexedBlockHeight - 1
      }

      uut.adapters.statusDb.getStatus.resolves(mockStatus)

      await uut.updateIndexedBlockHeight({ lastIndexedBlockHeight })

      const updatedStatus = uut.adapters.statusDb.updateStatus.firstCall.args[0]
      assert.equal(updatedStatus.syncedBlockHeight, 2000)
    })

    it('should throw if syncedBlockHeight mismatch', async () => {
      const lastIndexedBlockHeight = 1000
      const mockStatus = {
        lastIndexedBlockHeight: 999,
        syncedBlockHeight: 997 // Wrong! Expected to be 999
      }

      uut.adapters.statusDb.getStatus.resolves(mockStatus)

      try {
        await uut.updateIndexedBlockHeight({ lastIndexedBlockHeight })
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Expected synced block height to be')
      }
    })

    it('should propagate errors from statusDb.getStatus', async () => {
      uut.adapters.statusDb.getStatus.rejects(new Error('database error'))

      try {
        await uut.updateIndexedBlockHeight({ lastIndexedBlockHeight: 1000 })
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'database error')
      }
    })

    it('should propagate errors from statusDb.updateStatus', async () => {
      const lastIndexedBlockHeight = 1000
      const mockStatus = {
        lastIndexedBlockHeight: 999,
        syncedBlockHeight: 999 // Should match lastIndexedBlockHeight - 1
      }

      uut.adapters.statusDb.getStatus.resolves(mockStatus)
      uut.adapters.statusDb.updateStatus.rejects(new Error('update error'))

      try {
        await uut.updateIndexedBlockHeight({ lastIndexedBlockHeight })
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'update error')
      }
    })
  })
})

