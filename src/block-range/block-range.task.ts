/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { log } from '@alien-worlds/api-core';
import { setupBlockState } from '../common/block-state';
import { Delta, Trace } from '../common/blockchain/block-content';
import { ReceivedBlock, setupBlockReader } from '../common/blockchain/block-reader';
import { setupBroadcast } from '../common/broadcast';
import { TaskResolver } from '../common/workers/worker-task';
import {
  createProcessorBroadcastOptions,
  ProcessorBroadcast,
} from '../processor/processor.broadcast';
import { TraceProcessorTaskInput } from '../processor/tasks/trace-processor.task-input';
import { DeltaProcessorTaskInput } from '../processor/tasks/delta-processor.task-input';
import { BlockRangeTaskInput } from './block-range.task-input';
import { FeaturedTrace, FeaturedDelta } from './block-range.types';
import { extractAllocationFromDeltaRowData } from './block-range.utils';
import { BlockRangeConfig } from './block-range.config';

/**
 *
 * @param trace
 * @param broadcast
 * @param featuredTraces
 */
export const handleTrace = async (
  broadcast: ProcessorBroadcast<TraceProcessorTaskInput>,
  featuredTraces: FeaturedTrace[],
  trace: Trace,
  blockNumber: bigint,
  blockTimestamp: Date
) => {
  const { id, actionTraces, type } = trace;

  const isFeaturedType = featuredTraces.findIndex(trace => trace.type === type) > -1;

  if (isFeaturedType) {
    for (const actionTrace of actionTraces) {
      const {
        act: { account, name },
      } = actionTrace;
      const isFeaturedActionTrace =
        featuredTraces.findIndex(
          trace =>
            (trace.contracts.has(account) || trace.contracts.has('*')) &&
            (trace.actions.has(name) || trace.actions.has('*'))
        ) > -1;

      if (isFeaturedActionTrace) {
        await broadcast
          .sendMessage(
            TraceProcessorTaskInput.fromBlockchainData(
              id,
              actionTrace,
              blockNumber,
              blockTimestamp
            )
          )
          .catch((error: Error) =>
            log(`Could not send processor task due to: ${error.message}`)
          );
      }
    }
  }
};

/**
 *
 * @param delta
 * @param broadcast
 * @param featuredDeltas
 */
export const handleDelta = async (
  broadcast: ProcessorBroadcast<DeltaProcessorTaskInput>,
  featuredDeltas: FeaturedDelta[],
  delta: Delta,
  blockNumber: bigint,
  blockTimestamp: Date
) => {
  const featuredDelta = featuredDeltas.find(
    item => item.type === delta.type && item.name === delta.name
  );

  if (featuredDelta) {
    const { codes, scopes, tables } = featuredDelta;
    for (const row of delta.rows) {
      const { code, scope, table } = extractAllocationFromDeltaRowData(row.data);

      if (
        (codes.has('*') || codes.has(code)) &&
        (scopes.has('*') || scopes.has(scope)) &&
        (tables.has('*') || tables.has(table))
      ) {
        await broadcast
          .sendMessage(
            DeltaProcessorTaskInput.fromBlockchainData(
              delta.name,
              code,
              scope,
              table,
              blockNumber,
              blockTimestamp,
              row
            )
          )
          .catch((error: Error) =>
            log(`Could not send processor task due to: ${error.message}`)
          );
      }
    }
  }
};

type SharedData = { config: BlockRangeConfig };

export const run = async (input: BlockRangeTaskInput, sharedData: SharedData) => {
  const {
    startBlock,
    endBlock,
    featuredTraces,
    featuredDeltas,
    scanKey,
  } = input;
  const { config } = sharedData;
  const {
    reader,
    mongo,
    broadcast: { url },
  } = config;
  const { shouldFetchDeltas, shouldFetchTraces } = reader;
  const blockReader = await setupBlockReader(reader);
  const blockState = await setupBlockState(mongo);
  const broadcastOptions = createProcessorBroadcastOptions();
  const broadcast = await setupBroadcast<ProcessorBroadcast>(url, broadcastOptions);
  const traceBroadcast = broadcast as ProcessorBroadcast<TraceProcessorTaskInput>;
  const deltaBroadcast = broadcast as ProcessorBroadcast<DeltaProcessorTaskInput>;

  blockReader.onReceivedBlock((receivedBlock: ReceivedBlock) => {
    const {
      traces,
      deltas,
      block: { timestamp },
      thisBlock: { blockNumber },
    } = receivedBlock;

    blockState.updateCurrentBlockNumber(blockNumber).catch(error => log(error));
    traces.forEach(trace => {
      handleTrace(traceBroadcast, featuredTraces, trace, blockNumber, timestamp).catch(
        error => log(`Trace not handled`, error)
      );
    });
    deltas.forEach(delta => {
      handleDelta(deltaBroadcast, featuredDeltas, delta, blockNumber, timestamp).catch(
        error => log(`Delta not handled`, error)
      );
    });
  });

  blockReader.onError(error => {
    TaskResolver.reject(error);
  });

  blockReader.onComplete(() => {
    TaskResolver.resolve({ startBlock, endBlock, scanKey });
  });

  blockReader.readBlocks(startBlock, endBlock, { shouldFetchDeltas, shouldFetchTraces });
};
