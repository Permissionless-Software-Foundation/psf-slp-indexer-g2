/*
  Unit tests for the tx-rest-api.js library
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import TxRESTController from '../../../src/controllers/tx-rest-api.js'

describe('#tx-rest-api', () => {
  let uut, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should throw an error if adapters are not provided', () => {
      try {
        uut = new TxRESTController()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(
          err.message,
          'Adapters are required for the TX REST API.'
        )
      }
    })

    it('should throw an error if useCases are not provided', () => {
      try {
        uut = new TxRESTController({ adapters: {} })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(
          err.message,
          'Use cases are required for the TX REST API.'
        )
      }
    })

    it('should initialize with valid dependencies', () => {
      const mockAdapters = {}
      const mockUseCases = {}

      uut = new TxRESTController({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      assert.equal(uut.adapters, mockAdapters)
      assert.equal(uut.useCases, mockUseCases)
      assert.isOk(uut.app)
      assert.isFunction(uut.app.get)
      assert.isFunction(uut.app.listen)
      assert.equal(uut.runTxIndexing, false)
    })
  })

  describe('#start', () => {
    it('should register GET route /tx-start', () => {
      const mockAdapters = {}
      const mockUseCases = {}
      uut = new TxRESTController({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      // Mock Express app methods
      sandbox.stub(uut.app, 'get')
      sandbox.stub(uut.app, 'listen')

      uut.start()

      assert.equal(uut.app.get.called, true)
      assert.equal(uut.app.get.getCall(0).args[0], '/tx-start')
    })

    it('should set runTxIndexing to true when route is called', () => {
      const mockAdapters = {}
      const mockUseCases = {}
      uut = new TxRESTController({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      // Mock Express app methods
      let routeHandler
      sandbox.stub(uut.app, 'get').callsFake((path, handler) => {
        routeHandler = handler
      })
      sandbox.stub(uut.app, 'listen')

      uut.start()

      // Simulate route being called
      const mockReq = {}
      const mockRes = {
        send: sandbox.stub()
      }
      routeHandler(mockReq, mockRes)

      assert.equal(uut.runTxIndexing, true)
    })

    it('should return success response when route is called', () => {
      const mockAdapters = {}
      const mockUseCases = {}
      uut = new TxRESTController({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      // Mock Express app methods
      let routeHandler
      sandbox.stub(uut.app, 'get').callsFake((path, handler) => {
        routeHandler = handler
      })
      sandbox.stub(uut.app, 'listen')

      uut.start()

      // Simulate route being called
      const mockReq = {}
      const mockRes = {
        send: sandbox.stub()
      }
      routeHandler(mockReq, mockRes)

      assert.equal(mockRes.send.called, true)
      assert.deepEqual(mockRes.send.getCall(0).args[0], {
        report: {
          success: true
        }
      })
    })

    it('should call app.listen() with correct port', () => {
      const mockAdapters = {}
      const mockUseCases = {}
      uut = new TxRESTController({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      // Mock Express app methods
      sandbox.stub(uut.app, 'get')
      sandbox.stub(uut.app, 'listen')

      uut.start()

      assert.equal(uut.app.listen.called, true)
      // Port is read from config, but we verify listen was called
      assert.isFunction(uut.app.listen.getCall(0).args[1])
    })

    it('should handle route handler execution', () => {
      const mockAdapters = {}
      const mockUseCases = {}
      uut = new TxRESTController({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      // Mock Express app methods
      let routeHandler
      sandbox.stub(uut.app, 'get').callsFake((path, handler) => {
        routeHandler = handler
      })
      sandbox.stub(uut.app, 'listen')
      sandbox.stub(console, 'log')

      uut.start()

      // Simulate route being called
      const mockReq = {}
      const mockRes = {
        send: sandbox.stub()
      }
      routeHandler(mockReq, mockRes)

      assert.equal(console.log.called, true)
      assert.include(console.log.getCall(0).args[0], 'Staring TX Indexer')
    })
  })
})
