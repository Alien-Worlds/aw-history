export enum InternalBroadcastChannel {
  Filler = 'filler',
  BlockRange = 'block-range',
  Processor = 'processor',
  ProcessorTasksQueue = 'processor-tasks-queue',
}

export enum InternalBroadcastClientName {
  Filler = 'filler',
  BlockRange = 'block-range',
  Processor = 'processor',
  ProcessorTasksQueue = 'processor-tasks-queue',
}

export enum InternalBroadcastMessageName {
  BlockRangeReady = 'block-range-ready',
  BlockRangeTask = 'block-range-task',
  Processor = 'processor',
  ProcessorTasksQueueUpdate = 'processor-tasks-queue-update',
}
