
import { connectMongo, log, mongoConfig } from '@alien-worlds/api-core';
import cluster from 'cluster';
import { setupBlockRangeBroadcast } from '../block-range/block-range.broadcast';
import { BlockRangeMessageContent } from '../block-range/block-range.message-content';
import { setupBlockRangeScanner } from '../common/block-range-scanner';
import { setupBlockState } from '../common/block-state';
import { BlockReaderConfig, setupBlockReader } from '../common/blockchain/block-reader';
import { wait } from '../common/broadcast';
import { FillerConfig } from '../filler';
import { DeltaProcessorMessageContent } from '../processor/tasks/delta-processor.message-content';
import { TraceProcessorMessageContent } from '../processor/tasks/trace-processor.message-content';

export const testBroadcast = async (config: FillerConfig) => {
  if (cluster.isPrimary) {
    const broadcast = await setupBlockRangeBroadcast(config.broadcast);
    log('Waiting for message');
    broadcast.onMessage(async message => {
      const { id, content } = message;

      log(`Received Message: ${id}`, content);

      await wait(5000);
      message.ack();
      console.log('message acked');
    });

    cluster.fork();
  } else {
    await wait(1000);
    const broadcast = await setupBlockRangeBroadcast(config.broadcast);
    log('send message!');
    broadcast
      .sendMessage(
        BlockRangeMessageContent.create(
          0n,
          1n,
          'default',
          'test_scan',
          'transaction_trace_v0:action_trace_v0#contract:action&contract2:*',
          []
        )
      )
      .then(log)
      .catch(log);
  }
};

export const testBlockState = async (config: FillerConfig) => {
  const state = await setupBlockState(config.mongo);
  let currentBlockNumber: bigint;

  currentBlockNumber = await state.getCurrentBlockNumber();
  console.log(`Current block number ${currentBlockNumber.toString()}`);

  console.log('Set 10');
  await state.updateCurrentBlockNumber(10n);
  currentBlockNumber = await state.getCurrentBlockNumber();
  console.log(`Current block number ${currentBlockNumber.toString()}`);

  console.log('Set 5');
  await state.updateCurrentBlockNumber(10n);
  currentBlockNumber = await state.getCurrentBlockNumber();
  console.log(`Current block number ${currentBlockNumber.toString()}`);
};

export const testBlockReader = async (config: BlockReaderConfig) => {
  const reader = await setupBlockReader(config);

  reader.onReceivedBlock(data => {
    const {
      traces,
      deltas,
      thisBlock: { blockId, blockNumber },
      block: { timestamp },
    } = data;

    for (const trace of traces) {
      const { id, actionTraces } = trace;
      for (const actionTrace of actionTraces) {
        console.log(
          TraceProcessorMessageContent.create(id, actionTrace, blockNumber, timestamp)
        );
      }
    }

    for (const delta of deltas) {
      for (const row of delta.rows) {
        const { name, type } = delta;
        console.log(
          DeltaProcessorMessageContent.create(name, type, blockNumber, timestamp, row)
        );
      }
    }
  });

  reader.onComplete(() => {
    console.log('finished reading');
  });

  reader.readOneBlock(106887179n, {
    shouldFetchDeltas: config.shouldFetchDeltas,
    shouldFetchTraces: config.shouldFetchTraces,
  });
};

export const testBlockRangeScanner = async (config: FillerConfig) => {
  console.log('start scanner');
  const scanner = await setupBlockRangeScanner(config.mongo, config.scanner);

  console.log('create scan nodes');
  const { error } = await scanner.createScanNodes('test_scan', 0n, 100n);
  console.log('created!', error);

  let has = true;
    while(has) {
        has = await scanner.hasUnscannedBlocks('test_scan');
        if (has) {
            const scan = await scanner.getNextScanNode('test_scan');
            console.log('scanning', scan);
            await scanner.updateScanProgress('test_scan', scan.end - 1n);
            console.log('updated');
        }
    }

    console.log('done');
};

const fillerConfig = {
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
  startBlock: 1n,
  endBlock: 2n,
  mode: 'default',
  featuredTraces: 'transaction_trace_v0:action_trace_v0#contract:action&contract2:*',
  featuredDeltas:
    'table_delta_v0:contract_rows#code:scope:table&code:scope2:*|table_delta_v0:other_contract_rows#code:*',
};

const blockReaderConfig = {
  endpoints: ['ws://ship.alienworlds.io:28080'],
  shouldFetchDeltas: true,
  shouldFetchTraces: true,
};

// // testBroadcast(fillerConfig).catch(console.log);
// // testBlockState(fillerConfig).catch(console.log);
testBlockReader(blockReaderConfig).catch(console.log);
// // testBlockRangeScanner(fillerConfig).catch(console.log);

// // startFiller(fillerConfig).catch(log);
