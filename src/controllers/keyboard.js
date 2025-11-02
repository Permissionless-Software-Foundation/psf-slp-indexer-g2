/*
  Controller library for keyboard input.
*/

// Public npm libraries
import readline from 'readline'

class Keyboard {
  constructor () {
    // Encapsulate dependencies
    this.process = process

    // State variables
    this.stopIndexing = false

    // Bind 'this' object to all subfunctions.
    this.stopStatus = this.stopStatus.bind(this)
    this.initKeyboard = this.initKeyboard.bind(this)
    this.qDetected = this.qDetected.bind(this)
    this.ctrlCDetected = this.ctrlCDetected.bind(this)
  }

  // Returns the value of the stopIndexing state variable.
  // The main app polls this function to determine if it should shut down.
  stopStatus () {
    return this.stopIndexing
  }

  initKeyboard () {
    // Detect 'q' key to stop indexing.
    console.log("Press the 'q' key to stop indexing.\n")

    readline.emitKeypressEvents(this.process.stdin)

    if (this.process.stdin.isTTY) {
      this.process.stdin.setRawMode(true)
    }

    this.process.stdin.on('keypress', this.qDetected)
    this.process.stdin.on('keypress', this.ctrlCDetected)
  }

  qDetected (str, key) {
    // console.log('qDetected key: ', key)
    if (key.name === 'q') {
      console.log('q key detected. Will stop indexing after processing current block.')
      this.stopIndexing = true
    }
  }

  ctrlCDetected (str, key) {
    if (key.ctrl && key.name === 'c') {
      this.process.exit(0)
    }
  }
}

export default Keyboard
