import { BroadcastConfig, startBroadcastClient } from '../common/broadcast';
import { InternalBroadcastClientName } from '../internal-broadcast';

export const startBlockRangeBroadcastClient = (config: BroadcastConfig) =>
  startBroadcastClient(InternalBroadcastClientName.BlockRange, config);