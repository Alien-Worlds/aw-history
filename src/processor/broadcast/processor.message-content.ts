import { deserialize, serialize } from 'v8';
import { BroadcastMessageContent } from '../../common/broadcast';

export enum ProcessorMessageName {
  IsProcessorReady = 'IS_PROCESSOR_READY',
  ProcessorReady = 'PROCESSOR_READY',
  ProcessorBusy = 'PROCESSOR_BUSY',
}

export class ProcessorMessageContent implements BroadcastMessageContent {
  public static create(name: ProcessorMessageName, data?: unknown) {
    return new ProcessorMessageContent(name, data);
  }

  public static fromMessageBuffer(buffer: Buffer) {
    const { name, data } = deserialize(buffer);

    return new ProcessorMessageContent(name, data);
  }

  protected constructor(public readonly name: string, public readonly data?: unknown) {}

  public toBuffer(): Buffer {
    const { name, data } = this;

    return serialize({
      name,
      data,
    });
  }
}
