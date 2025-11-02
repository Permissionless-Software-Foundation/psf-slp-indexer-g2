/*
  Adapter library for the processed transaction database.
*/

// Global libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'

class PTxDb {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.config = config

    // Bind 'this' object to all subfunctions
    this.getPTx = this.getPTx.bind(this)
    this.createPTx = this.createPTx.bind(this)
    this.updatePTx = this.updatePTx.bind(this)
    this.deletePTx = this.deletePTx.bind(this)
  }

  async getPTx (ptxKey) {
    // try {
    const response = await this.axios.get(`${this.config.psfSlpDbUrl}/level/ptx/${ptxKey}`)
    // console.log('Response: ', response.data)

    return response.data
    // } catch (err) {
    //   // console.error('Error in PTxDb.getPTx(): ', err.message)
    //   throw err
    // }
  }

  async createPTx (ptxKey, ptxData) {
    try {
      const response = await this.axios.post(`${this.config.psfSlpDbUrl}/level/ptx`, {
        ptxKey,
        ptxData
      })
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in PTxDb.createPTx(): ', err.message)
      throw err
    }
  }

  async updatePTx (ptxKey, ptxData) {
    try {
      const response = await this.axios.put(`${this.config.psfSlpDbUrl}/level/ptx/${ptxKey}`, {
        ptxData
      })
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in PTxDb.updatePTx(): ', err.message)
      throw err
    }
  }

  async deletePTx (ptxKey) {
    try {
      const response = await this.axios.delete(`${this.config.psfSlpDbUrl}/level/ptx/${ptxKey}`)
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in PTxDb.deletePTx(): ', err.message)
      throw err
    }
  }
}

export default PTxDb
