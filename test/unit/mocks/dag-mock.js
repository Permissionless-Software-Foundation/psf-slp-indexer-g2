/*
  Mock data for dag.use-case.unit.js tests
*/

const slpSendTxData01 = {
  txid: '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e',
  hash: '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e',
  version: 1,
  size: 480,
  locktime: 543408,
  vin: [
    {
      txid: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35',
      vout: 1,
      scriptSig: {
        asm: '30440220268dacee1117975d904dd0d45ef8de42b86030d825a9522bae196a38bbf6b271022001ae1ce2536ab300040e597bcfaa8ef9fb2beaf702d0842f3161aae8e9867f55[ALL|FORKID] 028ff9e32b0dbc82c1d5e0fc945b2537b00420513b10684726f312f1b717c0ae11',
        hex: '4730440220268dacee1117975d904dd0d45ef8de42b86030d825a9522bae196a38bbf6b271022001ae1ce2536ab300040e597bcfaa8ef9fb2beaf702d0842f3161aae8e9867f554121028ff9e32b0dbc82c1d5e0fc945b2537b00420513b10684726f312f1b717c0ae11'
      },
      sequence: 4294967294,
      address: 'bitcoincash:qp2jesd06k8ycj4wvkpl9lcwaemtr04f5yphjsa07v',
      value: 0.00000546,
      tokenQtyStr: '10000000',
      tokenQty: 10000000,
      tokenId: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'
    },
    {
      txid: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35',
      vout: 3,
      scriptSig: {
        asm: '3045022100fa241bb2de46f68688451bfcae3f165b724e3ccf13b219e7bf2d8d2df7712ad60220353017d6e581a06efce478adfcd2047cea2f92531e283845f3d0a345ef101519[ALL|FORKID] 02cc48ad10516f97e914b8836ff25448d07ad96ebb4704c6a828339880280831bc',
        hex: '483045022100fa241bb2de46f68688451bfcae3f165b724e3ccf13b219e7bf2d8d2df7712ad60220353017d6e581a06efce478adfcd2047cea2f92531e283845f3d0a345ef101519412102cc48ad10516f97e914b8836ff25448d07ad96ebb4704c6a828339880280831bc'
      },
      sequence: 4294967294,
      address: 'bitcoincash:qppj3euc36x5u6twr5cxrrea2rca53vsfu3dxwr86j',
      value: 0.00172192,
      tokenQtyStr: '0',
      tokenQty: 0,
      tokenId: null
    }
  ],
  vout: [
    {
      value: 0,
      n: 0,
      scriptPubKey: {
        asm: 'OP_RETURN 5262419 1 1145980243 323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35 00000000004c4b40 00000000004c4b40',
        hex: '6a04534c500001010453454e4420323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d350800000000004c4b400800000000004c4b40',
        type: 'nulldata'
      },
      tokenQty: null,
      tokenId: null
    },
    {
      value: 0.00000546,
      n: 1,
      scriptPubKey: {
        asm: 'OP_DUP OP_HASH160 3e31055173cf58d56edb075499daf29d7b488f09 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a9143e31055173cf58d56edb075499daf29d7b488f0988ac',
        addresses: ['bitcoincash:qp2jesd06k8ycj4wvkpl9lcwaemtr04f5yphjsa07v'],
        type: 'pubkeyhash',
        reqSigs: 1
      },
      tokenQty: 10000000,
      tokenId: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'
    },
    {
      value: 0.00172192,
      n: 2,
      scriptPubKey: {
        asm: 'OP_DUP OP_HASH160 203b64bfbaa9e58333295b621159ddebc591ecb1 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a914203b64bfbaa9e58333295b621159ddebc591ecb188ac',
        addresses: ['bitcoincash:qppj3euc36x5u6twr5cxrrea2rca53vsfu3dxwr86j'],
        type: 'pubkeyhash',
        reqSigs: 1
      },
      tokenQty: null,
      tokenId: null
    },
    {
      value: 0.00000546,
      n: 3,
      scriptPubKey: {
        asm: 'OP_DUP OP_HASH160 3e31055173cf58d56edb075499daf29d7b488f09 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a9143e31055173cf58d56edb075499daf29d7b488f0988ac',
        addresses: ['bitcoincash:qp2jesd06k8ycj4wvkpl9lcwaemtr04f5yphjsa07v'],
        type: 'pubkeyhash',
        reqSigs: 1
      },
      tokenQty: 10000000,
      tokenId: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'
    }
  ],
  blockhash: '000000000000000001ff8f25f5158b4da1cf55edcbeeb5b65b1a9cc2aa7abc15',
  blockheight: 543408,
  confirmations: 4,
  time: 1542731005,
  blocktime: 1542731005,
  tokenType: 1,
  txType: 'SEND',
  tokenId: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35',
  isSlpTx: true
}

const slpGenesisTxData01 = {
  txid: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35',
  hash: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35',
  version: 1,
  size: 350,
  locktime: 0,
  vin: [
    {
      txid: 'a7e1bb8d4ab4f9ab47f6fad6ee5afbf0db3f1d8e3e1d47dfa7c09e7e3a5a3d2',
      vout: 0,
      scriptSig: {
        asm: '304402207...',
        hex: '47304402207...'
      },
      sequence: 4294967295,
      address: 'bitcoincash:qp2jesd06k8ycj4wvkpl9lcwaemtr04f5yphjsa07v',
      value: 0.00000546
    }
  ],
  vout: [
    {
      value: 0,
      n: 0,
      scriptPubKey: {
        asm: 'OP_RETURN 5262419 1 1145980243 323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35 5465737420546f6b656e 00000000004c4b40',
        hex: '6a04534c500001010447454e4553495320323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d350800000000004c4b40',
        type: 'nulldata'
      },
      tokenQty: null,
      tokenId: null
    },
    {
      value: 0.00000546,
      n: 1,
      scriptPubKey: {
        asm: 'OP_DUP OP_HASH160 3e31055173cf58d56edb075499daf29d7b488f09 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a9143e31055173cf58d56edb075499daf29d7b488f0988ac',
        addresses: ['bitcoincash:qp2jesd06k8ycj4wvkpl9lcwaemtr04f5yphjsa07v'],
        type: 'pubkeyhash',
        reqSigs: 1
      },
      tokenQty: 10000000,
      tokenId: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'
    },
    {
      value: 0.00172192,
      n: 2,
      scriptPubKey: {
        asm: 'OP_DUP OP_HASH160 203b64bfbaa9e58333295b621159ddebc591ecb1 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a914203b64bfbaa9e58333295b621159ddebc591ecb188ac',
        addresses: ['bitcoincash:qppj3euc36x5u6twr5cxrrea2rca53vsfu3dxwr86j'],
        type: 'pubkeyhash',
        reqSigs: 1
      },
      tokenQty: null,
      tokenId: null
    },
    {
      value: 0.00000546,
      n: 3,
      scriptPubKey: {
        asm: 'OP_DUP OP_HASH160 3e31055173cf58d56edb075499daf29d7b488f09 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a9143e31055173cf58d56edb075499daf29d7b488f0988ac',
        addresses: ['bitcoincash:qp2jesd06k8ycj4wvkpl9lcwaemtr04f5yphjsa07v'],
        type: 'pubkeyhash',
        reqSigs: 1
      },
      tokenQty: 10000000,
      tokenId: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'
    }
  ],
  blockhash: '000000000000000001ff8f25f5158b4da1cf55edcbeeb5b65b1a9cc2aa7abc15',
  blockheight: 543407,
  confirmations: 5,
  time: 1542730900,
  blocktime: 1542730900,
  tokenType: 1,
  txType: 'GENESIS',
  tokenId: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35',
  isSlpTx: true
}

const threeTxTestData01 = {
  txid: '4e52e0ec21d26feb8bdcafdbe48d0f15662f1ba2b3bea8200bcf0a90d7c209ee',
  hash: '4e52e0ec21d26feb8bdcafdbe48d0f15662f1ba2b3bea8200bcf0a90d7c209ee',
  version: 1,
  vin: [
    {
      txid: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      vout: 1,
      tokenQty: 100,
      tokenId: 'd9aa162704578945543f5856400546310392a3e68a7922fbc3490e2f21cc7501'
    }
  ],
  vout: [],
  tokenType: 1,
  txType: 'SEND',
  tokenId: 'd9aa162704578945543f5856400546310392a3e68a7922fbc3490e2f21cc7501',
  isSlpTx: true
}

const threeTxTestData02 = {
  txid: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  version: 1,
  vin: [
    {
      txid: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      vout: 1,
      tokenQty: 100,
      tokenId: 'd9aa162704578945543f5856400546310392a3e68a7922fbc3490e2f21cc7501'
    }
  ],
  vout: [],
  tokenType: 1,
  txType: 'SEND',
  tokenId: 'd9aa162704578945543f5856400546310392a3e68a7922fbc3490e2f21cc7501',
  isSlpTx: true
}

const threeTxTestData03 = {
  txid: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  hash: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  version: 1,
  vin: [
    {
      txid: '0000000000000000000000000000000000000000000000000000000000000000',
      vout: 0,
      tokenQty: 0,
      tokenId: null
    }
  ],
  vout: [],
  tokenType: 1,
  txType: 'GENESIS',
  tokenId: 'd9aa162704578945543f5856400546310392a3e68a7922fbc3490e2f21cc7501',
  isSlpTx: true
}

const cachedTx01 = {
  txid: '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e',
  hash: '874306bda204d3a5dd15e03ea5732cccdca4c33a52df35162cdd64e30ea7f04e',
  version: 1,
  vin: [
    {
      txid: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35',
      vout: 1,
      tokenQty: 10000000,
      tokenId: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35'
    }
  ],
  vout: [],
  tokenType: 1,
  txType: 'SEND',
  tokenId: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35',
  isSlpTx: true,
  isValidSlp: true
}

const cachedTxParent01 = {
  txid: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35',
  hash: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35',
  version: 1,
  vin: [
    {
      txid: '0000000000000000000000000000000000000000000000000000000000000000',
      vout: 0,
      tokenQty: 0,
      tokenId: null
    }
  ],
  vout: [],
  tokenType: 1,
  txType: 'GENESIS',
  tokenId: '323a1e35ae0b356316093d20f2d9fbc995d19314b5c0148b78dc8d9c0dab9d35',
  isSlpTx: true,
  isValidSlp: true
}

const invalidNftTx01 = {
  txid: '6d68a7ffbb63ef851c43025f801a1d365cddda50b00741bca022c743d74cd61a',
  hash: '6d68a7ffbb63ef851c43025f801a1d365cddda50b00741bca022c743d74cd61a',
  version: 1,
  vin: [
    {
      txid: '9b6db26b64aedcedc0bd9a3037b29b3598573ec5cea99eec03faa838616cd683',
      vout: 1,
      tokenQty: 1,
      tokenId: '9b6db26b64aedcedc0bd9a3037b29b3598573ec5cea99eec03faa838616cd683'
    }
  ],
  vout: [],
  tokenType: 129,
  txType: 'NFT_GENESIS',
  tokenId: '9b6db26b64aedcedc0bd9a3037b29b3598573ec5cea99eec03faa838616cd683',
  isSlpTx: true
}

const invlidNftParentTx01 = {
  txid: '9b6db26b64aedcedc0bd9a3037b29b3598573ec5cea99eec03faa838616cd683',
  hash: '9b6db26b64aedcedc0bd9a3037b29b3598573ec5cea99eec03faa838616cd683',
  version: 1,
  vin: [
    {
      txid: '0000000000000000000000000000000000000000000000000000000000000000',
      vout: 0,
      tokenQty: 0,
      tokenId: null
    }
  ],
  vout: [],
  tokenType: 1,
  txType: 'GENESIS',
  tokenId: '9b6db26b64aedcedc0bd9a3037b29b3598573ec5cea99eec03faa838616cd683',
  isSlpTx: true
}

export default {
  slpSendTxData01,
  slpGenesisTxData01,
  threeTxTestData01,
  threeTxTestData02,
  threeTxTestData03,
  cachedTx01,
  cachedTxParent01,
  invalidNftTx01,
  invlidNftParentTx01
}
