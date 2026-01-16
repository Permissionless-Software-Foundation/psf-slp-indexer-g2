/*
  This is a top-level library that encapsulates all the additional Adapters.
  The concept of Adapters comes from Clean Architecture:
  https://troutsblog.com/blog/clean-architecture
*/

// Local libraries
import StatusDb from './status-db.js'
import TxDb from './tx-db.js'
import PinClaimDb from './pin-claim-db.js'
import PTxDb from './ptx-db.js'
import UtxoDb from './utxo-db.js'
import TokenDb from './token-db.js'
import AddrDb from './addr-db.js'
import RPC from './rpc.js'
import Cache from './cache.js'
import Transaction from './transaction.js'
import Webhook from './webhook.js'
import Blacklist from './blacklist.js'
import DbCtrl from './backup-db.js'
import ZMQ from './zmq.js'
import TxIndexerAdapter from './tx-indexer.js'

class Adapters {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.statusDb = new StatusDb()
    this.txDb = new TxDb()
    this.pinClaimDb = new PinClaimDb()
    this.pTxDb = new PTxDb()
    this.utxoDb = new UtxoDb()
    this.tokenDb = new TokenDb()
    this.addrDb = new AddrDb()
    this.rpc = new RPC()
    this.cache = new Cache(localConfig)
    this.transaction = new Transaction(localConfig)
    this.webhook = new Webhook()
    this.blacklist = new Blacklist()
    this.dbCtrl = new DbCtrl()
    this.zmq = new ZMQ()
    this.txIndexerAdapter = new TxIndexerAdapter()

    // Bind 'this' object to all subfunctions
    this.initAdapters = this.initAdapters.bind(this)
  }

  async initAdapters () {
    console.log('Adapter libraries initialized.')
    return true
  }
}

export default Adapters
