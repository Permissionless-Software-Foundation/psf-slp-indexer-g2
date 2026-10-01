/*
  Decide when the indexer should ask psf-slp-db to back up its LevelDB.

  Backup rules:
  - Backup the database every epoch blocks (default 1000).
*/

class Backup {
  constructor (localConfig = {}) {
    // Dependency Injection
    if (!localConfig.adapters) {
      throw new Error('Must pass adapters when instantiating backup.js')
    }
    this.adapters = localConfig.adapters

    // Bind 'this' object to all subfunctions
    this.backupIfNeeded = this.backupIfNeeded.bind(this)
  }

  // Request a zip backup when height is a positive multiple of epoch.
  // Returns true when a backup was requested, false otherwise.
  async backupIfNeeded (blockHeight, epoch) {
    const height = parseInt(blockHeight, 10)
    const backupEpoch = parseInt(epoch, 10)

    if (height > 0 && height % backupEpoch === 0) {
      await this.adapters.dbCtrl.backupDb(height, backupEpoch)
      return true
    }

    return false
  }
}

export default Backup
