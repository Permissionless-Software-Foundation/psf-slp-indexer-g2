/*
  This library handles periodic backup and restoration of the database.

  Backup and restory rules:
  - Backup the database every 1000 blocks.
*/

class Backup {
  constructor (localConfig = {}) {
    // Dependency Injection
    if (!localConfig.adapters) {
      throw new Error('Must pass adapters when instantiating backup.js')
    }
    this.adapters = localConfig.adapters

    // Encapsulate dependencies

    // Bind 'this' object to all subfunctions
    this.backupIfNeeded = this.backupIfNeeded.bind(this)
  }

  async backupIfNeeded (inObj = {}) {

  }
}

export default Backup
