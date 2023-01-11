import { log } from '@alien-worlds/api-core';
import { Delta, Trace } from '../../common/blockchain/block-content';
import {
  FeaturedDelta,
  FeaturedDeltas,
  FeaturedTrace,
  FeaturedTraces,
} from '../../common/featured';
import { ProcessorTask } from '../../common/processor-queue';
import { extractAllocationFromDeltaRow } from '../block-range.utils';

/**
 *
 * @param trace
 * @param broadcast
 * @param featured
 */
export const createActionProcessorTasks = async (
  mode: string,
  traces: Trace[],
  featuredTraces: FeaturedTrace[],
  blockNumber: bigint,
  blockTimestamp: Date
): Promise<ProcessorTask[]> => {
  const list: ProcessorTask[] = [];
  const featured = new FeaturedTraces(featuredTraces);

  for (const trace of traces) {
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
        try {
          list.push(
            ProcessorTask.createActionProcessorTask(
              mode,
              shipTraceMessageName,
              id,
              actionTrace,
              blockNumber,
              blockTimestamp
            )
          );
        } catch (error) {
          log(`Action-trace not handled`, error);
        }
      }
    }
  }
  return list;
};

/**
 *
 * @param delta
 * @param broadcast
 * @param featuredDeltas
 */
export const createDeltaProcessorTasks = async (
  mode: string,
  deltas: Delta[],
  featuredDeltas: FeaturedDelta[],
  blockNumber: bigint,
  blockTimestamp: Date
): Promise<ProcessorTask[]> => {
  const list: ProcessorTask[] = [];
  const featured = new FeaturedDeltas(featuredDeltas);

  for (const delta of deltas) {
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
        try {
          list.push(
            ProcessorTask.createDeltaProcessorTask(
              mode,
              shipDeltaMessageName,
              name,
              blockNumber,
              blockTimestamp,
              row
            )
          );
        } catch (error) {
          log(`Delta (table row) not handled`, error);
        }
      }
    }
  }

  return list;
};
