/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { log } from '@alien-worlds/api-core';
import { setupBlockState } from '../../common/block-state';
import { Delta, Trace } from '../../common/blockchain/block-content';
import { ReceivedBlock, setupBlockReader } from '../../common/blockchain/block-reader';
import { WorkerTask } from '../../common/workers/worker-task';
import {
  ProcessorBroadcast,
  setupProcessorBroadcast,
} from '../../processor/processor.broadcast';
import { TraceProcessorMessageContent } from '../../processor/tasks/trace-processor.message-content';
import { DeltaProcessorMessageContent } from '../../processor/tasks/delta-processor.message-content';
import { BlockRangeMessageContent } from '../block-range.message-content';
import { FeaturedTrace, FeaturedDelta } from '../block-range.types';
import { extractAllocationFromDeltaRow } from '../block-range.utils';
import { BlockRangeConfig } from '../block-range.config';

/**
 *
 * @param trace
 * @param broadcast
 * @param featuredTraces
 */
export const handleTrace = async (
  broadcast: ProcessorBroadcast,
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
          .sendTraceMessage(
            TraceProcessorMessageContent.create(
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
  broadcast: ProcessorBroadcast,
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
    const { name, type } = delta;
    for (const row of delta.rows) {
      const { code, scope, table } = extractAllocationFromDeltaRow(row.data);

      if (
        (codes.has('*') || codes.has(code)) &&
        (scopes.has('*') || scopes.has(scope)) &&
        (tables.has('*') || tables.has(table))
      ) {
        await broadcast
          .sendDeltaMessage(
            DeltaProcessorMessageContent.create(
              name,
              type,
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

export default class BlockRangeTask extends WorkerTask {
  public async run(
    data: BlockRangeMessageContent,
    sharedData: SharedData
  ): Promise<void> {
    const { startBlock, endBlock, featuredTraces, featuredDeltas, scanKey } = data;
    const { config } = sharedData;
    const { reader, mongo } = config;
    const { shouldFetchDeltas, shouldFetchTraces } = reader;
    const blockReader = await setupBlockReader(reader);
    const blockState = await setupBlockState(mongo);
    const broadcast = await setupProcessorBroadcast(config.broadcast);

    blockReader.onReceivedBlock((receivedBlock: ReceivedBlock) => {
      const {
        traces,
        deltas,
        block: { timestamp },
        thisBlock: { blockNumber },
      } = receivedBlock;

      blockState.updateCurrentBlockNumber(blockNumber).catch(error => log(error));
      traces.forEach(trace => {
        handleTrace(broadcast, featuredTraces, trace, blockNumber, timestamp).catch(
          error => log(`Trace not handled`, error)
        );
      });
      deltas.forEach(delta => {
        handleDelta(broadcast, featuredDeltas, delta, blockNumber, timestamp).catch(
          error => log(`Delta not handled`, error)
        );
      });
    });

    blockReader.onError(error => {
      this.reject(error);
    });

    blockReader.onComplete(() => {
      this.resolve({ startBlock, endBlock, scanKey });
    });

    blockReader.readBlocks(startBlock, endBlock, {
      shouldFetchDeltas,
      shouldFetchTraces,
    });
  }
}
