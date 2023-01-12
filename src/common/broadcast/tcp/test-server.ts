import { BroadcastTcpServer } from "./broadcast.tcp.server";

const server = new BroadcastTcpServer({ port:9000 });

server.start();