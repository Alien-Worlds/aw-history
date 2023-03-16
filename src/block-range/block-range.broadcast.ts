import { Broadcast, BroadcastConfig } from '@alien-worlds/api-core';
import { InternalBroadcastClientName } from '../internal-broadcast';

export const startBlockRangeBroadcastClient = (config: BroadcastConfig) =>
  Broadcast.createClient({
    ...config,
    clientName: InternalBroadcastClientName.BlockRange,
  });

export const startBlockRangeTaskBroadcastClient = (config: BroadcastConfig) =>
  Broadcast.createClient({
    ...config,
    clientName: InternalBroadcastClientName.BlockRange,
  });
