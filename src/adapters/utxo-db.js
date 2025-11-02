/*
  Adapter library for the UTXO database.
*/

// Global libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'

class UtxoDb {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.config = config

    // Bind 'this' object to all subfunctions
    this.getUtxo = this.getUtxo.bind(this)
    this.createUtxo = this.createUtxo.bind(this)
    this.updateUtxo = this.updateUtxo.bind(this)
    this.deleteUtxo = this.deleteUtxo.bind(this)
  }

  async getUtxo (utxoKey) {
    try {
      const response = await this.axios.get(`${this.config.psfSlpDbUrl}/level/utxo/${utxoKey}`)
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in UtxoDb.getUtxo(): ', err.message)
      throw err
    }
  }

  async createUtxo (utxoKey, utxoData) {
    try {
      const response = await this.axios.post(`${this.config.psfSlpDbUrl}/level/utxo`, {
        utxoKey,
        utxoData
      })
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in UtxoDb.createUtxo(): ', err.message)
      throw err
    }
  }

  async updateUtxo (utxoKey, utxoData) {
    try {
      const response = await this.axios.put(`${this.config.psfSlpDbUrl}/level/utxo/${utxoKey}`, {
        utxoData
      })
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in UtxoDb.updateUtxo(): ', err.message)
      throw err
    }
  }

  async deleteUtxo (utxoKey) {
    try {
      console.log('deleteUtxo() utxoKey: ', utxoKey)
      const response = await this.axios.delete(`${this.config.psfSlpDbUrl}/level/utxo/${utxoKey}`)
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in UtxoDb.deleteUtxo(): ', err.message)
      throw err
    }
  }
}

export default UtxoDb
