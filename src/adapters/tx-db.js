/*
  Adapter library for the transaction database.
*/

// Global libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'

class TxDb {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.config = config

    // Bind 'this' object to all subfunctions
    this.getTx = this.getTx.bind(this)
    this.createTx = this.createTx.bind(this)
    this.updateTx = this.updateTx.bind(this)
    this.deleteTx = this.deleteTx.bind(this)
  }

  async getTx (txid) {
    try {
      const response = await this.axios.get(`${this.config.psfSlpDbUrl}/level/tx/${txid}`)
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      // console.error('Error in TxDb.getTx(): ', err.message)
      console.log(`TXID ${txid} not found in TX database.`)
      throw err
    }
  }

  async createTx (txid, txData) {
    try {
      const response = await this.axios.post(`${this.config.psfSlpDbUrl}/level/tx`, {
        txid,
        txData
      })
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in TxDb.createTx(): ', err.message)
      throw err
    }
  }

  async updateTx (txid, txData) {
    try {
      const response = await this.axios.put(`${this.config.psfSlpDbUrl}/level/tx/${txid}`, {
        txData
      })
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in TxDb.updateTx(): ', err.message)
      throw err
    }
  }

  async deleteTx (txid) {
    try {
      const response = await this.axios.delete(`${this.config.psfSlpDbUrl}/level/tx/${txid}`)
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in TxDb.deleteTx(): ', err.message)
      throw err
    }
  }
}

export default TxDb
