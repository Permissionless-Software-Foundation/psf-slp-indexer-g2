/*
  Configuration for the psf-slp-block-indexer.

  The default values in this file are tuned for local development. The production Docker
  containers have their own .env-local file that needs to be copied to .env and customized.
*/

import 'dotenv/config'

export default {
  psfSlpDbUrl: process.env.PSF_SLP_DB_URL ? process.env.PSF_SLP_DB_URL : 'http://localhost:5020',

  // RPC connection information, used by the SLP indexer to communicate with the
  // full node.
  rpcIp: process.env.RPC_IP ? process.env.RPC_IP : '172.17.0.1',
  rpcPort: process.env.RPC_PORT ? process.env.RPC_PORT : '8332',
  zmqPort: process.env.ZMQ_PORT ? process.env.ZMQ_PORT : '28332',
  rpcUser: process.env.RPC_USER ? process.env.RPC_USER : 'bitcoin',
  rpcPass: process.env.RPC_PASS ? process.env.RPC_PASS : 'password',

  // This blacklist is used to ignore problematic tokens.
  blacklist: process.env.DISABLE_BLACKLIST
    ? []
    : [
        // FlexUSD
        'dd21be4532d93661e8ffe16db6535af0fb8ee1344d1fef81a193e2b4cfa9fbc9',
        // TribeOS
        '0df768b5485c72645de069b68f66d02205c26f827c608ef5ffa976266d753d50',
        // TribeOS Ghost Token
        'aa1cdd36ab9f4aa6284e5ff370421305887f845f076c38689bd912e372058c11',
        // Honk
        '7f8889682d57369ed0e32336f8b7e0ffec625a35cca183f4e81fde4e71a538a1',
        // SOUR
        '6448381f9649ecacd8c30189cfbfee71a91b6b9738ea494fe33f8b8b51cbfca0'
      ],

  txRestApiPort: process.env.TX_REST_API_PORT ? parseInt(process.env.TX_REST_API_PORT) : 5454
}
