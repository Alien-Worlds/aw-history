/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */

import { setupAbis } from '../../../common/abis';
import { ProcessorTaskModel } from '../../../common/processor-queue';
import { ActionTraceProcessor } from '../action-trace.processor';
import { SetAbiProcessorInput } from './set-abi-processor.input';
import { SetAbiSharedData } from './set-abi.types';

export default class SetAbiProcessor extends ActionTraceProcessor {
  public async deserialize(content: ProcessorTaskModel): Promise<SetAbiProcessorInput> {
    return SetAbiProcessorInput.create(content);
  }

  public async run(
    input: SetAbiProcessorInput,
    sharedData: SetAbiSharedData
  ): Promise<void> {
    const {
      data: { abi, account },
      blockNumber,
    } = input;

    const {
      config: { mongo },
    } = sharedData;
    const abis = await setupAbis(mongo);
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
  }
}
