export enum ConnectionState {
  Online = 'online',
  Offline = 'offline',
  Connecting = 'connecting',
  Closing = 'closing',
}

export type QueueOptions = {
  name: string;
  options: { durable: boolean };
  mapper: BroadcastMessageContentMapper;
  noAck: boolean;
};

export type BroadcastOptions = {
  prefetch: number;
  queues: QueueOptions[];
};

export type MessageHandler<BroadcastMessageType> = (
  message: BroadcastMessageType
) => void;
export type ConnectionStateHandler = (...args: unknown[]) => Promise<void>;

export abstract class BroadcastMessage<ContentType = unknown> {
  public id: string;
  public content: ContentType;
  public abstract ack(): void;
  public abstract reject(): void;
  public abstract postpone(): void;
}

export abstract class BroadcastMessageContentMapper<
  ContentType = unknown,
  SourceType = unknown
> {
  public abstract toContent(source: SourceType): ContentType;
  public abstract toSource(content: ContentType): SourceType;
}

/**
 * @abstract
 * @class
 */
export abstract class Broadcast {
  public abstract sendMessage(channel: string, data: unknown): Promise<void>;
  public abstract onMessage(
    channel: string,
    handler: (message: BroadcastMessage) => void
  ): void;
}
