import { BroadcastConfig, startBroadcastClient } from '../common/broadcast';
import { InternalBroadcastClientName } from '../internal-broadcast';

export const startProcessorBroadcastClient = (config: BroadcastConfig) =>
  startBroadcastClient(InternalBroadcastClientName.Processor, config);
