/*
  Unit tests for the controllers-index.js library
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import Controllers from '../../../src/controllers/controllers-index.js'

describe('#controllers-index', () => {
  let uut, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should throw an error if useCases are not provided', () => {
      try {
        uut = new Controllers()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(
          err.message,
          'Use cases are required for the controllers.'
        )
      }
    })

    it('should throw an error if adapters are not provided', () => {
      try {
        uut = new Controllers({ useCases: {} })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(
          err.message,
          'Adapters are required for the controllers.'
        )
      }
    })

    it('should initialize Keyboard and TxRESTController instances', () => {
      const mockAdapters = {}
      const mockUseCases = {}

      uut = new Controllers({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      assert.equal(uut.adapters, mockAdapters)
      assert.equal(uut.useCases, mockUseCases)
      assert.isObject(uut.keyboard)
      assert.isObject(uut.txRESTController)
    })
  })

  describe('#initControllers', () => {
    it('should call keyboard.initKeyboard()', async () => {
      const mockAdapters = {}
      const mockUseCases = {}
      uut = new Controllers({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      sandbox.stub(uut.keyboard, 'initKeyboard')

      await uut.initControllers()

      assert.equal(uut.keyboard.initKeyboard.called, true)
    })
  })

  describe('#startTxRESTController', () => {
    it('should call txRESTController.start()', async () => {
      const mockAdapters = {}
      const mockUseCases = {}
      uut = new Controllers({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      sandbox.stub(uut.txRESTController, 'start')

      await uut.startTxRESTController()

      assert.equal(uut.txRESTController.start.called, true)
    })
  })
})
