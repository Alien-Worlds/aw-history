import { log } from '@alien-worlds/api-core';
import { startProcessor } from '../processor';

const config = {
  broadcast: {
    url: 'amqp://localhost',
  },
  threads: 2,
};

const processors = new Map<string, string>([
  [
    'contract_index64:atomicassets:atomicassets:offers......1',
    `${__dirname}/processors/eosdac-set-abi.processor`,
  ],
]);

startProcessor(config, processors).catch(log);
