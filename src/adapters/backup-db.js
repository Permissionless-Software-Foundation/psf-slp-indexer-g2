/*
  This is an adapter library for interacting with the REST API endpoints
  that govern database backup and restoration.
*/

// Global npm libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'

class DbCtrl {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.config = config

    // Bind 'this' object to all subfunctions
    this.backupDb = this.backupDb.bind(this)
    this.rollbackDb = this.rollbackDb.bind(this)
  }

  async backupDb (height, epoch) {
    try {
      await this.axios.post(`${this.config.psfSlpDbUrl}/level/backup`, { height, epoch })

      return true
    } catch (err) {
      console.error('Error in DbCtrl.backupDb(): ', err.message)
      throw err
    }
  }

  async rollbackDb (height) {
    try {
      await this.axios.post(`${this.config.psfSlpDbUrl}/level/restore`, { height })

      return true
    } catch (err) {
      console.error('Error in DbCtrl.rollbackDb(): ', err.message)
      throw err
    }
  }
}

export default DbCtrl
