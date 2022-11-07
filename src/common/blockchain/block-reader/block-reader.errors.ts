export class AbiNotFoundError extends Error {
  constructor() {
    super(`ABI data not found`);
  }
}

export class MissingHandlersError extends Error {
  constructor() {
    super('Set handlers before calling connect()');
  }
}

export class ServiceNotConnectedError extends Error {
  constructor() {
    super(`Client is not connected, requestBlocks cannot be called`);
  }
}

export class UnhandledBlockRequestError extends Error {
  constructor(start: bigint, end: bigint) {
    super(
      `Error sending the block_range request ${start.toString()}-${end.toString()}. The current request was not completed or canceled.`
    );
  }
}

export class UnhandledMessageTypeError extends Error {
  constructor(public readonly type: string) {
    super(`Unhandled message type: ${type}`);
  }
}

export class UnhandledMessageError extends Error {
  constructor(public readonly message, public readonly error) {
    super('Received a message while no block range is being processed');
  }
}
