export type BroadcastConfig = {
  url: string;
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
export abstract class BroadcastMessage<ContentType = unknown> {
  public id: string;
  public content: ContentType;
  public abstract ack(): void;
  public abstract reject(): void;
  public abstract postpone(): void;
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
  public abstract sendMessage(channel: string, data: unknown): Promise<void>;
  public abstract onMessage(
    channel: string,
    handler: MessageHandler<BroadcastMessage>
  ): void;
}
