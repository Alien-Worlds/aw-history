import { ProcessorBroadcast } from './../../processor/broadcast/processor.broadcast';
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { log } from '@alien-worlds/api-core';
import { BlockState, setupBlockState } from '../../common/block-state';
import {
  BlockReader,
  ReceivedBlock,
  setupBlockReader,
} from '../../common/blockchain/block-reader';
import { WorkerTask } from '../../common/workers/worker-task';
import { setupProcessorBroadcast } from '../../processor/broadcast/processor.broadcast';
import { BlockRangeTaskMessageContent } from '../broadcast/block-range-task.message-content';
import {
  FeaturedDelta,
  FeaturedDeltas,
  FeaturedTrace,
  FeaturedTraces,
} from '../../common/featured';
import { BlockRangeConfig } from '../block-range.config';
import { Mode } from '../../common/common.enums';
import {
  DeltaProcessorTaskMessageContent,
  TraceProcessorTaskMessageContent,
} from '../../processor';
import { extractAllocationFromDeltaRow } from '../block-range.utils';
import { Delta, Trace } from '../../common/blockchain/block-content';

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

  for (const actionTrace of actionTraces) {
    const {
      act: { account, name },
    } = actionTrace;

    const matchedTraces = await featured.get({
      shipTraceMessageName,
      action: name,
      contract: account,
    });

    if (matchedTraces.length > 0) {
      broadcast
        .sendTraceMessage(
          TraceProcessorTaskMessageContent.create(
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
  const allocations = delta.rows.map(row => extractAllocationFromDeltaRow(row.data));

  for (let i = 0; i < delta.rows.length; i++) {
    const row = delta.rows[i];
    const allocation = allocations[i];

    if (!allocation) {
      // contract allocation cannot be extracted
      // The contract may not contain tables or may be corrupted
      continue;
    }

    const { code, scope, table } = allocation;
    const matchedDeltas = await featured.get({
      shipDeltaMessageName,
      name,
      code,
      scope,
      table,
    });

    if (matchedDeltas.length > 0) {
      broadcast
        .sendDeltaMessage(
          DeltaProcessorTaskMessageContent.create(
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
};

type SharedData = {
  config: BlockRangeConfig;
  featured: { traces: FeaturedTrace[]; deltas: FeaturedDelta[] };
};

export default class BlockRangeTask extends WorkerTask {
  public use(): void {
    throw new Error('Method not implemented.');
  }

  private onReceivedBlock(
    receivedBlock: ReceivedBlock,
    blockState: BlockState,
    processorBroadcast: ProcessorBroadcast,
    featured: {
      traces: FeaturedTrace[];
      deltas: FeaturedDelta[];
    }
  ) {
    const {
      traces,
      deltas,
      block: { timestamp },
      thisBlock: { blockNumber },
    } = receivedBlock;

    blockState.updateCurrentBlockNumber(blockNumber).catch(error => log(error));

    traces.forEach(trace => {
      handleTrace(
        processorBroadcast,
        new FeaturedTraces(featured.traces),
        trace,
        blockNumber,
        timestamp
      ).catch(error => log(`Trace not handled`, error));
    });
    deltas.forEach(delta => {
      handleDelta(
        processorBroadcast,
        new FeaturedDeltas(featured.deltas),
        delta,
        blockNumber,
        timestamp
      ).catch(error => log(`Delta not handled`, error));
    });
  }

  private async runReplayMode(
    data: BlockRangeTaskMessageContent,
    sharedData: SharedData,
    blockReader: BlockReader,
    blockState: BlockState,
    processorBroadcast: ProcessorBroadcast
  ): Promise<void> {
    const { startBlock, endBlock, scanKey } = data;
    const { config, featured } = sharedData;
    const { reader } = config;
    const { shouldFetchDeltas, shouldFetchTraces } = reader;

    blockReader.onReceivedBlock(async (receivedBlock: ReceivedBlock) =>
      this.onReceivedBlock(receivedBlock, blockState, processorBroadcast, featured)
    );
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

  private async runDefaultMode(
    data: BlockRangeTaskMessageContent,
    sharedData: SharedData,
    blockReader: BlockReader,
    blockState: BlockState,
    processorBroadcast: ProcessorBroadcast
  ): Promise<void> {
    const { startBlock, endBlock } = data;
    const { config, featured } = sharedData;
    const {
      reader: { shouldFetchDeltas, shouldFetchTraces },
    } = config;

    let currentBlock = startBlock;

    processorBroadcast.onReadyMessage(async () => {
      if (blockReader.hasFinished()) {
        currentBlock += 1n;
        blockReader.readOneBlock(currentBlock, {
          shouldFetchDeltas,
          shouldFetchTraces,
        });
      }
    });

    blockReader.onReceivedBlock(async (receivedBlock: ReceivedBlock) =>
      this.onReceivedBlock(receivedBlock, blockState, processorBroadcast, featured)
    );

    blockReader.onError(error => {
      this.reject(error);
    });

    blockReader.onComplete(() => {
      if (currentBlock < endBlock) {
        processorBroadcast.sendIsProcessorReadyMessage();
      } else {
        this.resolve({ startBlock, endBlock });
      }
    });

    blockReader.readOneBlock(currentBlock, {
      shouldFetchDeltas,
      shouldFetchTraces,
    });
  }

  public async run(
    data: BlockRangeTaskMessageContent,
    sharedData: SharedData
  ): Promise<void> {
    const { mode } = data;
    const { config } = sharedData;
    const { reader, mongo } = config;
    const blockReader = await setupBlockReader(reader);
    const blockState = await setupBlockState(mongo);
    const processorBroadcast = await setupProcessorBroadcast(config.broadcast);

    if (mode === Mode.Replay) {
      this.runReplayMode(data, sharedData, blockReader, blockState, processorBroadcast);
    } else {
      this.runDefaultMode(data, sharedData, blockReader, blockState, processorBroadcast);
    }
  }
}
