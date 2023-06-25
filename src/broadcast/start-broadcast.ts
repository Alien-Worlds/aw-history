import {
  BroadcastTcpServer,
  ConfigVars,
  buildBroadcastConfig,
} from '@alien-worlds/history-tools-common';

export const startBroadcast = async () => {
  const vars = new ConfigVars();
  const config = buildBroadcastConfig(vars);
  const server = new BroadcastTcpServer(config);

  await server.start();
};
