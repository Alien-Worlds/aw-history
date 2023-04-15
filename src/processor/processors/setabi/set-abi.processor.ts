import { ProcessorTaskModel } from '../../../common/processor-task-queue';
import { Processor } from '../processor';
import { SetAbiProcessorInput } from './set-abi-processor.input';
import { Abis } from '../../../common';

export default class SetAbiProcessor extends Processor {

  public async run(input: ProcessorTaskModel): Promise<void> {
    try {
      const {
        data: { abi, account },
        blockNumber,
      } = SetAbiProcessorInput.create(input);

      const abis = await Abis.create(this.mongoSource);
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
