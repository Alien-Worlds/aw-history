import { BroadcastConnectionConfig } from '../broadcast.types';
import { BroadcastTcpMessage } from './broadcast.tcp.message';

export const getTcpConnectionOptions = (config: BroadcastConnectionConfig) => {
  const { url, host, port } = config;

  if (url) {
    return { path: url };
  } else if (host || port) {
    return { host, port };
  } else {
    throw new Error('Wrong TCP connection options');
  }
};

export const writeSocketBuffer = (message: BroadcastTcpMessage): Buffer => {
  const buffer = message.toBuffer();
  const size = Buffer.alloc(2);
  size[0] = buffer.length & 255;
  size[1] = buffer.length >> 8;
  return Buffer.concat([size, buffer]);
};

export const splitToMessageBuffers = (buffer: Buffer): Buffer[] => {
  const buffers: Buffer[] = [];
  if (buffer.length > 2) {
    let offset = 0;
    while (offset < buffer.length) {
      const head = buffer.subarray(offset, offset + 2);
      const buffSize = head[0];
      const buffStart = offset + 2;
      const buffEnd = buffStart + buffSize;
      buffers.push(buffer.subarray(buffStart, buffEnd));
      offset = buffEnd;
    }
  }

  return buffers;
};
