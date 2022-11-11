import { log } from '@alien-worlds/api-core';
import { startFiller } from '../filler';

const config = {
  broadcast: {
    url: 'amqp://localhost',
    channel: 'block_range',
  },
  blockchain: {
    endpoint: 'https://wax.api.eosnation.io',
    chainId: '8be32650b763690b95b7d7e32d7637757a0a7392ad04f1c393872e525a2ce82b',
  },
  scanner: {
    maxChunkSize: 50,
    scanKey: 'test',
  },
  mongo: { url: 'mongodb://localhost:27017', dbName: 'alienworlds_dao_mainnet' },
  startBlock: 106887179n,
  // endBlock: 106887179n,
  mode: 'test',
  featuredTraces: 'transaction_trace_v0:action_trace_v0#contract:action&contract2:*',
  featuredDeltas:
    'table_delta_v0:contract_index64#atomicassets:atomicassets:offers......1&code:scope2:*|table_delta_v0:resource_limits_state#ggx.q1myz.5k:*',
};

startFiller(config).catch(log);
