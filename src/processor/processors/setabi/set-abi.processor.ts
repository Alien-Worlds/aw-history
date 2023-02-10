import { MongoSource } from '@alien-worlds/api-core';
import { setupAbis } from '../../../common/abis';
import { ProcessorTaskModel } from '../../../common/processor-task-queue';
import { Processor } from '../processor';
import { SetAbiProcessorInput } from './set-abi-processor.input';

export default class SetAbiProcessor extends Processor {
  constructor(protected mongoSource: MongoSource) {
    super();
  }

  public async run(input: ProcessorTaskModel): Promise<void> {
    try {
      const {
        data: { abi, account },
        blockNumber,
      } = SetAbiProcessorInput.create(input);

      const abis = await setupAbis(this.mongoSource);
      const isAdded = await abis.storeAbi(blockNumber, account, abi);

      if (isAdded) {
        this.resolve(true);
      } else {
        this.reject(
          new Error(
            `ABI defined ${blockNumber.toString()} for account ${account} has not been stored in the database.`
          )
        );
      }
    } catch (error) {
      this.reject(error);
    }
  }
}
