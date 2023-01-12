import { BroadcastTcpClient } from "./broadcast.tcp.client";
import { BroadcastTcpServer } from "./broadcast.tcp.server";

const client = new BroadcastTcpClient('processor',{ port: 9000 });

client.onMessage('foo', async (msg) => {
    console.log('foo');
})

client.connect();
