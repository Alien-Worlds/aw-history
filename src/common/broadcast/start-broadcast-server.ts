import { BroadcastDriver } from './broadcast.enums';
import { BroadcastConfig } from './broadcast.types';
import { BroadcastTcpServer } from './tcp/broadcast.tcp.server';

export const startBroadcastServer = async (config: BroadcastConfig) => {
  if (config.driver === BroadcastDriver.Tcp) {
    const server = new BroadcastTcpServer(config);
    server.start();
  }
};
