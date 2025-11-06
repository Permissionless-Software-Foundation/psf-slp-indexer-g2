/*
  Mock data for index-blocks.use-case.unit.js tests
*/

const block01 = {
  tx: [
    'txid01',
    'txid02',
    'txid03'
  ]
}

const block02 = {
  tx: []
}

const slpTx01 = {
  slpData: {
    tokenType: 1,
    txType: 'GENESIS',
    tokenId: 'token-id-01'
  },
  blockHeight: 100,
  txData: {
    txid: 'txid01',
    isValidSlp: undefined
  }
}

const slpTx02 = {
  slpData: {
    tokenType: 1,
    txType: 'MINT',
    tokenId: 'token-id-01'
  },
  blockHeight: 101,
  txData: {
    txid: 'txid02',
    isValidSlp: undefined
  }
}

const slpTx03 = {
  slpData: {
    tokenType: 1,
    txType: 'SEND',
    tokenId: 'token-id-01'
  },
  blockHeight: 102,
  txData: {
    txid: 'txid03',
    isValidSlp: undefined
  }
}

const slpTxNftGenesis = {
  slpData: {
    tokenType: 65,
    txType: 'GENESIS',
    tokenId: 'nft-token-id-01'
  },
  blockHeight: 103,
  txData: {
    txid: 'nft-txid01',
    isValidSlp: undefined
  }
}

const slpTxUnsupportedType = {
  slpData: {
    tokenType: 999,
    txType: 'GENESIS',
    tokenId: 'unsupported-token'
  },
  blockHeight: 104,
  txData: {
    txid: 'unsupported-txid',
    isValidSlp: undefined
  }
}

const pinClaim01 = {
  about: 'ipfs-hash-123',
  type: 'claim',
  data: { test: 'data' }
}

export default {
  block01,
  block02,
  slpTx01,
  slpTx02,
  slpTx03,
  slpTxNftGenesis,
  slpTxUnsupportedType,
  pinClaim01
}
