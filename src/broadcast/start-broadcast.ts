import { ConfigVars } from '@alien-worlds/aw-core';
import { BroadcastTcpServer, buildBroadcastConfig } from '@alien-worlds/aw-broadcast';

export const startBroadcast = async () => {
  const vars = new ConfigVars();
  const config = buildBroadcastConfig(vars);
  const server = new BroadcastTcpServer(config);

  await server.start();
};
