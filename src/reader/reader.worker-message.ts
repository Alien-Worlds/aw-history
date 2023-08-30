import {
  WorkerMessage,
  WorkerMessageName,
  WorkerMessageType,
} from '@alien-worlds/aw-workers';

export enum ReaderWorkerMessageName {
  BlockReaderConnected = 'block_reader_connected',
  BlockReaderDisconnected = 'block_reader_disconnected',
}

export class ReaderWorkerMessage extends WorkerMessage {
  public static createBlockReaderDisconnectWarning(workerId: number) {
    return WorkerMessage.create({
      workerId,
      type: WorkerMessageType.Info,
      name: ReaderWorkerMessageName.BlockReaderDisconnected,
    });
  }

  public static createBlockReaderConnectInfo(workerId: number) {
    return WorkerMessage.create({
      workerId,
      type: WorkerMessageType.Info,
      name: ReaderWorkerMessageName.BlockReaderConnected,
    });
  }

  public isBlockReaderDisconnectWarning(): boolean {
    return (
      this.type === WorkerMessageType.Warning &&
      this.name === ReaderWorkerMessageName.BlockReaderDisconnected
    );
  }

  public isBlockReaderConnectInfo(): boolean {
    return (
      this.type === WorkerMessageType.Info &&
      this.name === ReaderWorkerMessageName.BlockReaderDisconnected
    );
  }
}
