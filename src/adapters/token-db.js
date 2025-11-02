/*
  Adapter library for the token database.
*/

// Global libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'

class TokenDb {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.config = config

    // Bind 'this' object to all subfunctions
    this.getToken = this.getToken.bind(this)
    this.createToken = this.createToken.bind(this)
    this.updateToken = this.updateToken.bind(this)
    this.deleteToken = this.deleteToken.bind(this)
  }

  async getToken (tokenId) {
    try {
      const response = await this.axios.get(`${this.config.psfSlpDbUrl}/level/token/${tokenId}`)
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in TokenDb.getToken(): ', err.message)
      throw err
    }
  }

  async createToken (tokenId, tokenData) {
    try {
      const response = await this.axios.post(`${this.config.psfSlpDbUrl}/level/token`, {
        tokenId,
        tokenData
      })
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in TokenDb.createToken(): ', err.message)
      throw err
    }
  }

  async updateToken (tokenId, tokenData) {
    try {
      const response = await this.axios.put(`${this.config.psfSlpDbUrl}/level/token/${tokenId}`, {
        tokenData
      })
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in TokenDb.updateToken(): ', err.message)
      throw err
    }
  }

  async deleteToken (tokenId) {
    try {
      const response = await this.axios.delete(`${this.config.psfSlpDbUrl}/level/token/${tokenId}`)
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in TokenDb.deleteToken(): ', err.message)
      throw err
    }
  }
}

export default TokenDb
