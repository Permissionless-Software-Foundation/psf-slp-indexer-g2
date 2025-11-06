/*
  Unit tests for the use-cases-index.js file that aggregates all use-cases.
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Unit under test (uut)
import UseCases from '../../../src/use-cases/use-cases-index.js'

describe('#use-cases', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    // Create a minimal mock adapters object
    const adapters = {}

    uut = new UseCases({ adapters })
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new UseCases()

        assert.fail('Unexpected code path')

        // This is here to prevent the linter from complaining.
        assert.isOk(uut)
      } catch (err) {
        assert.include(
          err.message,
          'Adapters are required for the use cases.'
        )
      }
    })
  })

  describe('#initUseCases', () => {
    it('should initialize async use cases', async () => {
      const result = await uut.initUseCases()

      assert.equal(result, true)
    })
  })
})
