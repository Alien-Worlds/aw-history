import { Worker } from '@alien-worlds/workers';
import { AbiNotFoundError, ShipAbis } from '@alien-worlds/block-reader';
import { FilterSharedData } from './filter.types';
import {
  Abis,
  BlockModel,
  DeltaByName,
  FeaturedContracts,
  ProcessorTask,
  ProcessorTaskQueue,
  SignedBlock,
  TraceByName,
  isSetAbiAction,
} from '../common';
import { Serializer, log, parseToBigInt } from '@alien-worlds/api-core';

export default class FilterWorker extends Worker<FilterSharedData> {
  constructor(
    protected dependencies: {
      shipAbis: ShipAbis;
      abis: Abis;
      featuredContracts: FeaturedContracts;
      processorTaskQueue: ProcessorTaskQueue;
      serializer: Serializer;
    },
    protected sharedData: FilterSharedData
  ) {
    super();
  }

  public async createActionProcessorTasks(
    deserializedBlock: BlockModel<SignedBlock, [TraceByName], [DeltaByName]>
  ): Promise<ProcessorTask[]> {
    const {
      dependencies: { abis, featuredContracts },
      sharedData: { config },
    } = this;
    const {
      traces,
      this_block,
      block: { timestamp },
      prev_block,
    } = deserializedBlock;
    const list: ProcessorTask[] = [];

    for (const [traceType, trace] of traces) {
      const { id, action_traces } = trace;

      for (const [actionType, actionTrace] of action_traces) {
        const {
          act: { account, name },
        } = actionTrace;

        if (featuredContracts.isFeatured(account)) {
          try {
            // If the block in which the contract was created cannot be found or
            // its index is higher than the current block number, skip it,
            // the contract did not exist at that time
            const { content: contracts, failure } = await featuredContracts.readContracts(
              [account]
            );

            if (failure) {
              log(failure.error);
              continue;
            }
            const contract = contracts[0];
            if (
              contract.initialBlockNumber === -1n ||
              contract.initialBlockNumber > parseToBigInt(this_block.block_num)
            ) {
              continue;
            }

            // get ABI from the database and if it does not exist, try to fetch it
            const { content: abi, failure: getAbiFailure } = await abis.getAbi(
              parseToBigInt(this_block.block_num),
              account,
              true
            );

            if (getAbiFailure) {
              if (
                getAbiFailure.error instanceof AbiNotFoundError &&
                isSetAbiAction(account, name) === false
              ) {
                log(
                  `Action-trace {block_number: ${this_block.block_num}, account: ${account}, name: ${name}}: no ABI was found. This can be a problem in reading the content.`
                );
              }
            }

            list.push(
              ProcessorTask.createActionProcessorTask(
                abi ? abi.hex : '',
                config.mode,
                traceType,
                actionType,
                id,
                actionTrace,
                parseToBigInt(this_block.block_num),
                new Date(timestamp),
                parseToBigInt(this_block.block_num) <= parseToBigInt(prev_block.block_num)
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
    deserializedBlock: BlockModel<SignedBlock, [TraceByName], [DeltaByName]>
  ): Promise<ProcessorTask[]> {
    const {
      dependencies: { abis, featuredContracts, serializer },
      sharedData: { config },
    } = this;
    const {
      deltas,
      this_block,
      block: { timestamp },
      prev_block,
    } = deserializedBlock;
    const list: ProcessorTask[] = [];

    for (const [type, delta] of deltas) {
      const { name, rows } = delta;
      
      for (const row of rows) {
        const info = serializer.deserializeTableRow(row);

        if (!info) {
          // The contract may not contain tables or may be corrupted
          continue;
        }
        const { table, code, scope } = info;
        if (featuredContracts.isFeatured(code)) {
          try {
            // If the block in which the contract was created cannot be found or
            // its index is higher than the current block number, skip it,
            // the contract did not exist at that time
            const { content: contracts, failure } = await featuredContracts.readContracts(
              [code]
            );

            if (failure) {
              log(failure.error);
              continue;
            }
            const contract = contracts[0];
            if (
              contract.initialBlockNumber === -1n ||
              contract.initialBlockNumber > parseToBigInt(this_block.block_num)
            ) {
              continue;
            }

            // get ABI from the database and if it does not exist, try to fetch it
            const { content: abi, failure: getAbiFailure } = await abis.getAbi(
              parseToBigInt(this_block.block_num),
              code,
              true
            );

            if (getAbiFailure) {
              if (getAbiFailure.error instanceof AbiNotFoundError) {
                log(
                  `Delta {block_number: ${this_block.block_num}, code: ${code}, scope: ${scope}, table: ${table}}: no ABI was found. This can be a problem in reading the content.`
                );
              }
            }

            list.push(
              ProcessorTask.createDeltaProcessorTask(
                abi ? abi.hex : '',
                config.mode,
                type,
                name,
                code,
                scope,
                table,
                parseToBigInt(this_block.block_num),
                new Date(timestamp),
                row,
                parseToBigInt(this_block.block_num) <= parseToBigInt(prev_block.block_num)
              )
            );
          } catch (error) {
            log(error);
          }
        }
      }
    }

    return list;
  }

  public async run(json: BlockModel): Promise<void> {
    try {
      const {
        dependencies: { serializer, shipAbis, processorTaskQueue },
      } = this;
      const { content: abi, failure } = await shipAbis.getAbi(json.abi_version);

      if (failure) {
        log('SHiP Abi not found.');
        this.reject(failure.error);
      }

      const deserializedBlock = serializer.deserializeBlock<
        BlockModel<SignedBlock, [TraceByName], [DeltaByName]>,
        BlockModel
      >(json, abi);
      const {
        this_block: { block_num },
      } = deserializedBlock;

      const [actionProcessorTasks, deltaProcessorTasks] = await Promise.all([
        this.createActionProcessorTasks(deserializedBlock),
        this.createDeltaProcessorTasks(deserializedBlock),
      ]);

      const tasks = [...actionProcessorTasks, ...deltaProcessorTasks];

      if (tasks.length > 0) {
        log(
          `Block #${block_num} contains ${actionProcessorTasks.length} actions and ${deltaProcessorTasks.length} deltas to process (${tasks.length} tasks in total).`
        );
        processorTaskQueue.addTasks(tasks);
      } else {
        log(
          `The block (${block_num}) does not contain actions and deltas that could be processed.`
        );
      }

      this.resolve();
    } catch (error) {
      this.reject(error);
    }
  }
}
