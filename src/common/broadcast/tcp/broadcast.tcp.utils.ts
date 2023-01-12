import { BroadcastConnectionConfig } from "../broadcast.types";

export const getTcpConnectionOptions = (config: BroadcastConnectionConfig) => {
    const { url, host, port } = config;

    if (url) {
        return { path: url }
    } else if(host || port) {
        return { host, port };
    } else {
        throw new Error('Wrong TCP connection options');
    }
}