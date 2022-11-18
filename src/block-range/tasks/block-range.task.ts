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
import { extractAllocationFromDeltaRow } from '../block-range.utils';
import { BlockRangeConfig } from '../block-range.config';
import { FeaturedContent, FeaturedDeltas, FeaturedTraces } from '../../common/featured';

/**
 *
 * @param trace
 * @param broadcast
 * @param featured
 */
export const handleTrace = async (
  broadcast: ProcessorBroadcast,
  featured: FeaturedTraces,
  trace: Trace,
  blockNumber: bigint,
  blockTimestamp: Date
) => {
  const { id, actionTraces, shipTraceMessageName } = trace;
  const matchedGeneralTraces = featured.get({ shipTraceMessageName });

  for (const generalTrace of matchedGeneralTraces) {
    for (const actionTrace of actionTraces) {
      const {
        act: { account, name },
      } = actionTrace;

      const matchedTraces = featured.get({ shipTraceMessageName, name, account });

      if (matchedTraces.length > 0) {
        await broadcast
          .sendTraceMessage(
            TraceProcessorMessageContent.create(
              shipTraceMessageName,
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
  featured: FeaturedDeltas,
  delta: Delta,
  blockNumber: bigint,
  blockTimestamp: Date
) => {
  const { name, shipDeltaMessageName } = delta;
  const matchedGeneralDeltas = featured.get({ shipDeltaMessageName, name });
  const allocations = delta.rows.map(row => extractAllocationFromDeltaRow(row.data));

  for (const generalDelta of matchedGeneralDeltas) {
    for (let i = 0; i < delta.rows.length; i++) {
      const row = delta.rows[i];
      const { code, scope, table } = allocations[i];
      const matchedDeltas = featured.get({
        shipDeltaMessageName,
        name,
        code,
        scope,
        table,
      });

      if (matchedDeltas.length > 0) {
        await broadcast
          .sendDeltaMessage(
            DeltaProcessorMessageContent.create(
              shipDeltaMessageName,
              name,
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

type SharedData = { config: BlockRangeConfig; featured: FeaturedContent };

export default class BlockRangeTask extends WorkerTask {
  public async run(
    data: BlockRangeMessageContent,
    sharedData: SharedData
  ): Promise<void> {
    const { startBlock, endBlock, scanKey } = data;
    const { config, featured } = sharedData;
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
        handleTrace(broadcast, featured.traces, trace, blockNumber, timestamp).catch(
          error => log(`Trace not handled`, error)
        );
      });
      deltas.forEach(delta => {
        handleDelta(broadcast, featured.deltas, delta, blockNumber, timestamp).catch(
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
