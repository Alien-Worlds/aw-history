import { log } from '@alien-worlds/api-core';
import {
  FeaturedDelta,
  FeaturedDeltas,
  FeaturedTrace,
  FeaturedTraces,
} from '../common/featured';
import { Worker } from '../common/workers';
import { DeserializedBlock } from './deserialized-block';
import { Abis } from '../common/abis';
import { ContractReader } from '../common/blockchain';
import { isSetAbiAction } from '../common/common.utils';
import { ProcessorTask, ProcessorTaskQueue } from '../processor/processor-task-queue';
import { FilterSharedData } from './filter.types';
import { extractAllocationFromDeltaRow } from './filter.utils';
import { Block, BlockJson } from '../common/blockchain/block-reader/block';
import { ShipAbis } from '../common/ship/ship-abis';

export default class FilterWorker extends Worker<FilterSharedData> {
  protected shipAbis: ShipAbis;
  protected abis: Abis;
  protected contractReader: ContractReader;
  protected processorTaskQueue: ProcessorTaskQueue;
  protected featuredTraces: FeaturedTrace[];
  protected featuredDeltas: FeaturedDelta[];

  constructor(components: {
    shipAbis: ShipAbis;
    abis: Abis;
    contractReader: ContractReader;
    processorTaskQueue: ProcessorTaskQueue;
    featuredTraces: FeaturedTrace[];
    featuredDeltas: FeaturedDelta[];
  }) {
    super();
    const {
      abis,
      contractReader,
      featuredTraces,
      featuredDeltas,
      processorTaskQueue,
      shipAbis,
    } = components;
    this.shipAbis = shipAbis;
    this.abis = abis;
    this.contractReader = contractReader;
    this.processorTaskQueue = processorTaskQueue;
    this.featuredTraces = featuredTraces;
    this.featuredDeltas = featuredDeltas;
  }

  public async createActionProcessorTasks(
    deserializedBlock: DeserializedBlock
  ): Promise<ProcessorTask[]> {
    const {
      featuredTraces,
      abis,
      contractReader,
      sharedData: { config },
    } = this;
    const {
      traces,
      thisBlock,
      block: { timestamp },
      prevBlock,
    } = deserializedBlock;
    const featured = new FeaturedTraces(featuredTraces);
    const list: ProcessorTask[] = [];

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
            if (initBlockNumber === -1n || initBlockNumber > thisBlock.blockNumber) {
              continue;
            }

            // get ABI from the database and if it does not exist, try to fetch it
            const abi = await abis.getAbi(thisBlock.blockNumber, account, true);
            if (!abi && isSetAbiAction(account, name) === false) {
              log(
                `Action-trace {block_number: ${thisBlock.blockNumber}, account: ${account}, name: ${name}}: no ABI was found. This can be a problem in reading the content.`
              );
            }
            list.push(
              ProcessorTask.createActionProcessorTask(
                abi ? abi.hex : '',
                config.mode,
                shipTraceMessageName,
                id,
                actionTrace,
                thisBlock.blockNumber,
                timestamp,
                thisBlock.blockNumber <= prevBlock.blockNumber
              )
            );
          } catch (error) {
            log(`Action-trace not handled`, error);
          }
        }
      }
    }

    return list;
  }

  public async createDeltaProcessorTasks(
    deserializedBlock: DeserializedBlock
  ): Promise<ProcessorTask[]> {
    const {
      featuredDeltas,
      abis,
      contractReader,
      sharedData: { config },
    } = this;
    const {
      deltas,
      thisBlock,
      block: { timestamp },
      prevBlock,
    } = deserializedBlock;
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
            if (initBlockNumber === -1n || initBlockNumber > thisBlock.blockNumber) {
              continue;
            }

            // get ABI from the database and if it does not exist, try to fetch it
            const abi = await abis.getAbi(thisBlock.blockNumber, code, true);
            if (!abi) {
              log(
                `Delta {block_number: ${thisBlock.blockNumber}, code: ${code}, scope: ${scope}, table: ${table}}: no ABI was found. This can be a problem in reading the content.`
              );
            }
            list.push(
              ProcessorTask.createDeltaProcessorTask(
                abi ? abi.hex : '',
                config.mode,
                shipDeltaMessageName,
                name,
                code,
                scope,
                table,
                thisBlock.blockNumber,
                timestamp,
                row,
                thisBlock.blockNumber <= prevBlock.blockNumber
              )
            );
          } catch (error) {
            log(`Delta (table row) not handled`, error);
          }
        }
      }
    }

    return list;
  }

  public async run(json: BlockJson): Promise<void> {
    try {
      const { processorTaskQueue, shipAbis } = this;
      const { content: abi, failure } = await shipAbis.getAbi(json.abi_version);

      if (failure) {
        log('SHiP Abi not found.');
        this.reject(failure.error);
      }

      const deserializedBlock = DeserializedBlock.create(Block.fromJson(json), abi);
      const {
        thisBlock: { blockNumber },
      } = deserializedBlock;
      const [actionProcessorTasks, deltaProcessorTasks] = await Promise.all([
        this.createActionProcessorTasks(deserializedBlock),
        this.createDeltaProcessorTasks(deserializedBlock),
      ]);
      const tasks = [...actionProcessorTasks, ...deltaProcessorTasks];

      if (tasks.length > 0) {
        log(
          `Block #${blockNumber} contains ${actionProcessorTasks.length} actions and ${deltaProcessorTasks.length} deltas to process (${tasks.length} tasks in total).`
        );
        processorTaskQueue.addTasks(tasks);
      } else {
        log(
          `The block (${blockNumber}) does not contain actions and deltas that could be processed.`
        );
      }

      this.resolve();
    } catch (error) {
      this.reject(error);
    }
  }
}
