import { BroadcastAmqClient } from './amq/broadcast.amq.client';
import { BroadcastDriver } from './broadcast.enums';
import { Broadcast, BroadcastConfig, QueueOptions } from './broadcast.types';
import { BroadcastTcpClient } from './tcp/broadcast.tcp.client';

export const startBroadcastClient = async (name: string, config: BroadcastConfig) => {
  let client: Broadcast;
  if (config.driver === BroadcastDriver.Tcp) {
    client = new BroadcastTcpClient(name, config);
    await (<BroadcastTcpClient>client).connect();
  } else if (config.driver === BroadcastDriver.Amq) {
    const { url } = config;

    const queues = Object.values(config.queues).map(queue => {
      const { name, fireAndForget, mapper, options } = queue;
      return <QueueOptions>{
        name,
        fireAndForget,
        mapper,
        options: options || { durable: true },
      };
    });

    client = new BroadcastAmqClient(
      url,
      {
        prefetch: 1,
        queues,
      },
      console
    );
    await (<BroadcastAmqClient>client).init();
  }

  return client;
};
