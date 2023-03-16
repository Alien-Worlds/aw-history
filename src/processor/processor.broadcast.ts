import { Broadcast, BroadcastConfig } from '@alien-worlds/api-core';
import { InternalBroadcastClientName } from '../internal-broadcast';

export const startProcessorBroadcastClient = (config: BroadcastConfig) =>
  Broadcast.createClient({
    ...config,
    clientName: InternalBroadcastClientName.Processor,
  });
