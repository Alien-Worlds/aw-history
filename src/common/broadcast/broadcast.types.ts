export type BroadcastConnectionConfig = {
  url?: string;
  port?: number;
  host?: string;
};

export type BroadcastConfig = BroadcastConnectionConfig & {
  driver: string;
  queues?: { [key: string]: OptionalQueueOptions };
};

export type OptionalQueueOptions = {
  name?: string;
  options?: { durable?: boolean };
  mapper?: BroadcastMessageContentMapper;
  fireAndForget?: boolean;
};

export type QueueOptions = {
  name: string;
  options: { durable: boolean };
  mapper?: BroadcastMessageContentMapper;
  fireAndForget: boolean;
};

export type BroadcastOptions = {
  prefetch: number;
  queues: QueueOptions[];
};

export type MessageHandler<BroadcastMessageType> = (
  message: BroadcastMessageType
) => Promise<void>;
export type ConnectionStateHandler = (...args: unknown[]) => Promise<void>;

/**
 * @abstract
 * @class
 */
export abstract class BroadcastMessage<ContentType = unknown, SourceType = unknown> {
  public id: string;
  public content: ContentType;
  public source: SourceType;
}

/**
 * @abstract
 * @class
 */
export abstract class BroadcastMessageContentMapper<ContentType = unknown> {
  public abstract toContent(buffer: Buffer): Promise<ContentType>;
  public abstract toBuffer(content: ContentType): Buffer;
}

/**
 * @abstract
 * @class
 */
export abstract class BroadcastMessageContent {
  public abstract toBuffer(): Buffer;
}

/**
 * @abstract
 * @class
 */
export abstract class Broadcast {
  public abstract sendMessage<DataType = unknown>(message: {
    channel: string;
    name: string;
    data?: DataType;
  }): void;
  public abstract onMessage(
    channel: string,
    handler: MessageHandler<BroadcastMessage>
  ): void;
}
