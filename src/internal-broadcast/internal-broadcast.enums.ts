export enum InternalBroadcastChannel {
  Filler = 'filler',
  BlockRange = 'block-range',
  Processor = 'processor',
  ProcessorTasksQueue = 'processor-tasks-queue',
}

export enum InternalBroadcastClientName {
  Filler = 'filler',
  BlockRange = 'block-range',
  BlockRangeDefaultModeTask = 'block-range-default-mode-task',
  BlockRangeReplayModeTask = 'block-range-replay-mode-task',
  Processor = 'processor',
  ProcessorTask = 'processor-task',
  ProcessorTasksQueue = 'processor-tasks-queue',
}

export enum InternalBroadcastMessageName {
  BlockRangeReady = 'block-range-ready',
  BlockRangeTask = 'block-range-task',
  Processor = 'processor',
  ProcessorReady = 'processor-ready',
  ProcessorTasksQueueUpdate = 'processor-tasks-queue-update',
}
