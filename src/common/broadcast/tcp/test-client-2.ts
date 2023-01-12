import { BroadcastTcpClient } from "./broadcast.tcp.client";


const start = async () => {
    const client = new BroadcastTcpClient('block-range',{ port: 9000 });

    await client.connect();
    client.sendMessage({channel: 'foo', data: { hello: 'world' }})
}

start();