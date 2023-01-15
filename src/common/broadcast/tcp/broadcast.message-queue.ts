import { Socket } from 'net';
import { BroadcastTcpMessage } from './broadcast.tcp.message';

export class BroadcastMessageQueue {
  private queue: BroadcastTcpMessage[] = [];
  private active = false;
  private connected = false;

  constructor(private client: Socket) {}

  public add(message: BroadcastTcpMessage) {
    this.queue.push(message);

    if (message.content.type === 'SYSTEM') {
      this.queue.unshift(message);
    } else {
      this.queue.push(message);
    }

    if (this.connected === true && this.active === false) {
      this.loop();
      this.active = true;
    }
  }

  public start() {
    this.connected = true;
    this.active = true;
    this.loop();
  }

  public stop() {
    this.connected = false;
    this.active = false;
  }

  private loop() {
    while (this.queue.length > 0) {
      const buffer = this.queue.shift().toBuffer();
      const size = Buffer.alloc(2);
      size[0] = buffer.length & 255;
      size[1] = buffer.length >> 8;
      this.client.write(Buffer.concat([size, buffer]));
    }
    this.active = false;
  }
}
