/*
  Unit tests for the keyboard.js library
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import Keyboard from '../../../src/controllers/keyboard.js'

describe('#keyboard', () => {
  let uut, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should initialize with default state', () => {
      uut = new Keyboard()

      assert.equal(uut.stopIndexing, false)
      assert.equal(uut.process, process)
    })
  })

  describe('#stopStatus', () => {
    it('should return false by default', () => {
      uut = new Keyboard()

      const result = uut.stopStatus()

      assert.equal(result, false)
    })

    it('should return true when stopIndexing is true', () => {
      uut = new Keyboard()
      uut.stopIndexing = true

      const result = uut.stopStatus()

      assert.equal(result, true)
    })
  })

  describe('#initKeyboard', () => {
    it('should register keypress event handlers', () => {
      uut = new Keyboard()

      // Mock process.stdin - readline.emitKeypressEvents requires listenerCount
      const mockStdin = {
        isTTY: false,
        setRawMode: sandbox.stub(),
        on: sandbox.stub(),
        listenerCount: sandbox.stub().returns(0)
      }
      uut.process = {
        stdin: mockStdin
      }

      sandbox.stub(console, 'log')

      uut.initKeyboard()

      // Verify event handlers are registered (readline.emitKeypressEvents behavior)
      assert.equal(mockStdin.on.called, true)
    })

    it('should set raw mode if stdin is TTY', () => {
      uut = new Keyboard()

      // Mock process.stdin with isTTY = true - readline.emitKeypressEvents requires listenerCount
      const mockStdin = {
        isTTY: true,
        setRawMode: sandbox.stub(),
        on: sandbox.stub(),
        listenerCount: sandbox.stub().returns(0)
      }
      uut.process = {
        stdin: mockStdin
      }

      sandbox.stub(console, 'log')

      uut.initKeyboard()

      assert.equal(mockStdin.setRawMode.called, true)
      assert.equal(mockStdin.setRawMode.getCall(0).args[0], true)
    })

    it('should not set raw mode if stdin is not TTY', () => {
      uut = new Keyboard()

      // Mock process.stdin with isTTY = false - readline.emitKeypressEvents requires listenerCount
      const mockStdin = {
        isTTY: false,
        setRawMode: sandbox.stub(),
        on: sandbox.stub(),
        listenerCount: sandbox.stub().returns(0)
      }
      uut.process = {
        stdin: mockStdin
      }

      sandbox.stub(console, 'log')

      uut.initKeyboard()

      assert.equal(mockStdin.setRawMode.called, false)
    })

    it('should register keypress event handlers', () => {
      uut = new Keyboard()

      // Mock process.stdin - readline.emitKeypressEvents requires listenerCount
      const mockStdin = {
        isTTY: false,
        setRawMode: sandbox.stub(),
        on: sandbox.stub(),
        listenerCount: sandbox.stub().returns(0)
      }
      uut.process = {
        stdin: mockStdin
      }

      sandbox.stub(console, 'log')

      uut.initKeyboard()

      // readline.emitKeypressEvents registers one handler, then we register two more
      // So we should have at least 2 calls for our handlers
      assert.isAtLeast(mockStdin.on.callCount, 2)

      // Verify that our two handlers (qDetected and ctrlCDetected) were registered
      const keypressCalls = mockStdin.on.getCalls().filter(call => call.args[0] === 'keypress')
      assert.isAtLeast(keypressCalls.length, 2)

      // Verify the last two calls are our handlers
      const lastTwoCalls = mockStdin.on.getCalls().slice(-2)
      assert.equal(lastTwoCalls[0].args[0], 'keypress')
      assert.equal(lastTwoCalls[1].args[0], 'keypress')
      assert.equal(lastTwoCalls[0].args[1], uut.qDetected)
      assert.equal(lastTwoCalls[1].args[1], uut.ctrlCDetected)
    })
  })

  describe('#qDetected', () => {
    it('should set stopIndexing to true when q key is pressed', () => {
      uut = new Keyboard()

      const key = {
        name: 'q'
      }

      uut.qDetected('', key)

      assert.equal(uut.stopIndexing, true)
    })

    it('should not set flag for other keys', () => {
      uut = new Keyboard()

      const key = {
        name: 'a'
      }

      uut.qDetected('', key)

      assert.equal(uut.stopIndexing, false)
    })

    it('should log message when q key is detected', () => {
      uut = new Keyboard()
      sandbox.stub(console, 'log')

      const key = {
        name: 'q'
      }

      uut.qDetected('', key)

      assert.equal(console.log.called, true)
      assert.include(console.log.getCall(0).args[0], 'q key detected')
    })
  })

  describe('#ctrlCDetected', () => {
    it('should call process.exit(0) when Ctrl+C is pressed', () => {
      uut = new Keyboard()

      // Mock process.exit
      uut.process = {
        exit: sandbox.stub()
      }

      const key = {
        name: 'c',
        ctrl: true
      }

      uut.ctrlCDetected('', key)

      assert.equal(uut.process.exit.called, true)
      assert.equal(uut.process.exit.getCall(0).args[0], 0)
    })

    it('should not exit for other key combinations', () => {
      uut = new Keyboard()

      // Mock process.exit
      uut.process = {
        exit: sandbox.stub()
      }

      const key = {
        name: 'c',
        ctrl: false
      }

      uut.ctrlCDetected('', key)

      assert.equal(uut.process.exit.called, false)
    })

    it('should not exit when Ctrl is pressed with other keys', () => {
      uut = new Keyboard()

      // Mock process.exit
      uut.process = {
        exit: sandbox.stub()
      }

      const key = {
        name: 'a',
        ctrl: true
      }

      uut.ctrlCDetected('', key)

      assert.equal(uut.process.exit.called, false)
    })
  })
})
