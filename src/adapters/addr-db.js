/*
  Adapter library for the address database.
*/

// Global libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'

class AddrDb {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.config = config

    // Bind 'this' object to all subfunctions
    this.getAddr = this.getAddr.bind(this)
    this.createAddr = this.createAddr.bind(this)
    this.updateAddr = this.updateAddr.bind(this)
    this.deleteAddr = this.deleteAddr.bind(this)
  }

  async getAddr (addr) {
    try {
      const response = await this.axios.get(`${this.config.psfSlpDbUrl}/level/addr/${addr}`)
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in AddrDb.getAddr(): ', err.message)
      throw err
    }
  }

  async createAddr (addr, addrData) {
    try {
      const response = await this.axios.post(`${this.config.psfSlpDbUrl}/level/addr`, {
        addr,
        addrData
      })
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in AddrDb.createAddr(): ', err.message)
      throw err
    }
  }

  async updateAddr (addr, addrData) {
    try {
      const response = await this.axios.put(`${this.config.psfSlpDbUrl}/level/addr/${addr}`, {
        addrData
      })
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in AddrDb.updateAddr(): ', err.message)
      throw err
    }
  }

  async deleteAddr (addr) {
    try {
      const response = await this.axios.delete(`${this.config.psfSlpDbUrl}/level/addr/${addr}`)
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in AddrDb.deleteAddr(): ', err.message)
      throw err
    }
  }
}

export default AddrDb
