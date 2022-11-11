import { log } from '@alien-worlds/api-core';
import { startBlockRange } from '../block-range';

const config = {
  broadcast: {
    url: 'amqp://localhost',
  },
  scanner: {
    maxChunkSize: 50,
    scanKey: 'test',
  },
  reader: {
    endpoints: ['ws://ship.alienworlds.io:28080'],
    shouldFetchDeltas: true,
    shouldFetchTraces: true,
  },
  mongo: { url: 'mongodb://localhost:27017', dbName: 'alienworlds_dao_mainnet' },
  threads: 4,
};

startBlockRange(config).catch(log);
