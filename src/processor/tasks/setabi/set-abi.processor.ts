/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */

import { setupAbis } from '../../../common/abis';
import { TraceProcessorMessageContent } from '../../broadcast/trace-processor.message-content';
import { ActionTraceProcessorTask } from '../action-trace-processor.task';
import { SetAbiProcessorTaskInput } from './set-abi-processor.task-input';
import { SetAbiSharedData } from './set-abi.types';

export default class SetAbiProcessor extends ActionTraceProcessorTask {
  public deserialize(content: TraceProcessorMessageContent): SetAbiProcessorTaskInput {
    return SetAbiProcessorTaskInput.create(content);
  }

  public async run(
    input: SetAbiProcessorTaskInput,
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
