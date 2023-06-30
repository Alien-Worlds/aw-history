import { ConfigVars } from '@alien-worlds/api-core';
import { BroadcastTcpServer, buildBroadcastConfig } from '@alien-worlds/broadcast';

export const startBroadcast = async () => {
  const vars = new ConfigVars();
  const config = buildBroadcastConfig(vars);
  const server = new BroadcastTcpServer(config);

  await server.start();
};
