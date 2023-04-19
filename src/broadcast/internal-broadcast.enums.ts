export enum InternalBroadcastChannel {
  Bootstrap = 'bootstrap',
  DefaultModeReader = 'default-mode-reader',
  ReplayModeReader = 'replay-mode-reader',
  Filter = 'filter',
  Processor = 'processor',
  ExternalBroadcast = 'external-broadcast',
}

export enum InternalBroadcastClientName {
  Bootstrap = 'bootstrap',
  Filter = 'filter',
  Reader = 'reader',
  Processor = 'processor',
  ExternalBroadcast = 'external-broadcast',
}

export enum InternalBroadcastMessageName {
  FilterReady = 'filter-ready',
  FilterRefresh = 'filter-refresh',
  DefaultModeReaderReady = 'default-mode-reader-ready',
  ReplayModeReaderReady = 'replay-mode-reader-ready',
  ReaderTask = 'reader-task',
  ProcessorReady = 'processor-ready',
  ProcessorRefresh = 'processor-refresh',
}
