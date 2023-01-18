import { log } from '@alien-worlds/api-core';
import { Abis } from '../../common/abis';
import { Delta, Trace } from '../../common/blockchain/block-content';
import { ContractReader } from '../../common/blockchain/contract-reader';
import { isSetAbiAction } from '../../common/common.utils';
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
  contractReader: ContractReader,
  abis: Abis,
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
          // If the block in which the contract was created cannot be found or
          // its index is higher than the current block number, skip it,
          // the contract did not exist at that time
          const initBlockNumber = await contractReader.getInitialBlockNumber(account);
          if (initBlockNumber === -1n || initBlockNumber > blockNumber) {
            continue;
          }

          // get ABI from the database and if it does not exist, try to fetch it
          const abi = await abis.getAbi(blockNumber, account, true);
          if (!abi && isSetAbiAction(account, name) === false) {
            log(
              `Action-trace {block_number: ${blockNumber}, account: ${account}, name: ${name}}: no ABI was found. This can be a problem in reading the content.`
            );
          }
          list.push(
            ProcessorTask.createActionProcessorTask(
              abi ? abi.hex : '',
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
  contractReader: ContractReader,
  abis: Abis,
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
          // If the block in which the contract was created cannot be found or
          // its index is higher than the current block number, skip it,
          // the contract did not exist at that time
          const initBlockNumber = await contractReader.getInitialBlockNumber(code);
          if (initBlockNumber === -1n || initBlockNumber > blockNumber) {
            continue;
          }

          // get ABI from the database and if it does not exist, try to fetch it
          const abi = await abis.getAbi(blockNumber, code, true);
          if (!abi) {
            log(
              `Delta {block_number: ${blockNumber}, code: ${code}, scope: ${scope}, table: ${table}}: no ABI was found. This can be a problem in reading the content.`
            );
          }
          list.push(
            ProcessorTask.createDeltaProcessorTask(
              abi ? abi.hex : '',
              mode,
              shipDeltaMessageName,
              name,
              code,
              scope,
              table,
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
