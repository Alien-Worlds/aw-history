export enum InternalBroadcastChannel {
  Bootstrap = 'bootstrap',
  DefaultModeReader = 'default-mode-reader',
  ReplayModeReader = 'replay-mode-reader',
  Filter = 'filter',
  Processor = 'processor',
  ProcessorTasksQueue = 'processor-tasks-queue',
  ExternalBroadcast = 'external-broadcast',
}

export enum InternalBroadcastClientName {
  Bootstrap = 'bootstrap',
  Filter = 'filter',
  Reader = 'reader',
  Processor = 'processor',
  ProcessorTask = 'processor-task',
  ProcessorTasksQueue = 'processor-tasks-queue',
  ExternalBroadcast = 'external-broadcast',
}

export enum InternalBroadcastMessageName {
  FilterReady = 'filter-ready',
  FilterUpdate = 'filter-update',
  DefaultModeReaderReady = 'default-mode-reader-ready',
  ReplayModeReaderReady = 'replay-mode-reader-ready',
  ReaderTask = 'reader-task',
  Processor = 'processor',
  ProcessorReady = 'processor-ready',
  ProcessorTasksQueueUpdate = 'processor-tasks-queue-update',
}
