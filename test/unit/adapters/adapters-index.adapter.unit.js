/*
  Unit tests for the adapters index.js library
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import Adapters from '../../../src/adapters/adapters-index.js'

describe('#adapters', () => {
  let uut, sandbox

  beforeEach(() => {
    uut = new Adapters()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#initAdapters', () => {
    it('should initialize the adapters', async () => {
      const result = await uut.initAdapters()

      assert.equal(result, true)
    })
  })
})
