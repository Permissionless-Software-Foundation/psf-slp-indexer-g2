/*
  Adapter library for the pin claim database.
*/

// Global libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'

class PinClaimDb {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.config = config

    // Bind 'this' object to all subfunctions
    this.getPinClaim = this.getPinClaim.bind(this)
    this.createPinClaim = this.createPinClaim.bind(this)
    this.updatePinClaim = this.updatePinClaim.bind(this)
    this.deletePinClaim = this.deletePinClaim.bind(this)
  }

  async getPinClaim (claimId) {
    try {
      const response = await this.axios.get(`${this.config.psfSlpDbUrl}/level/pinclaim/${claimId}`)
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in PinClaimDb.getPinClaim(): ', err.message)
      throw err
    }
  }

  async createPinClaim (claimId, claimData) {
    try {
      const response = await this.axios.post(`${this.config.psfSlpDbUrl}/level/pinclaim`, {
        claimId,
        claimData
      })
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in PinClaimDb.createPinClaim(): ', err.message)
      throw err
    }
  }

  async updatePinClaim (claimId, claimData) {
    try {
      const response = await this.axios.put(`${this.config.psfSlpDbUrl}/level/pinclaim/${claimId}`, {
        claimData
      })
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in PinClaimDb.updatePinClaim(): ', err.message)
      throw err
    }
  }

  async deletePinClaim (claimId) {
    try {
      const response = await this.axios.delete(`${this.config.psfSlpDbUrl}/level/pinclaim/${claimId}`)
      // console.log('Response: ', response.data)

      return response.data
    } catch (err) {
      console.error('Error in PinClaimDb.deletePinClaim(): ', err.message)
      throw err
    }
  }
}

export default PinClaimDb
