/*
  This is a top-level library that encapsulates all the additional Controllers.
  The concept of Controllers comes from Clean Architecture:
  https://troutsblog.com/blog/clean-architecture
*/

// Public npm libraries.

// Local libraries
import Keyboard from './keyboard.js'
import TxRESTController from './tx-rest-api.js'

class Controllers {
  constructor (localConfig = {}) {
    // Dependency Injection
    if (!localConfig.useCases) {
      throw new Error('Use cases are required for the controllers.')
    }
    this.useCases = localConfig.useCases
    if (!localConfig.adapters) {
      throw new Error('Adapters are required for the controllers.')
    }
    this.adapters = localConfig.adapters

    // Encapsulate dependencies
    this.keyboard = new Keyboard(localConfig)
    this.txRESTController = new TxRESTController(localConfig)

    // Bind 'this' object to all subfunctions.
    this.initControllers = this.initControllers.bind(this)
    this.startTxRESTController = this.startTxRESTController.bind(this)
  }

  // Initialize the controllers at startup.
  async initControllers () {
    this.keyboard.initKeyboard()
  }

  // This is consumed by psf-slp-tx-indexer.js to start the TX REST controller.
  async startTxRESTController () {
    this.txRESTController.start()
  }
}

export default Controllers
