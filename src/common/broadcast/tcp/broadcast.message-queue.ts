import { Socket } from 'net';
import { BroadcastTcpMessage } from './broadcast.tcp.message';
import { writeSocketBuffer } from './broadcast.tcp.utils';

export class BroadcastMessageQueue {
  private queue: BroadcastTcpMessage[] = [];
  private active = false;
  private connected = false;

  constructor(private client: Socket) {}

  public add(message: BroadcastTcpMessage) {
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
      const message = this.queue.shift();
      const buffer = writeSocketBuffer(message);
      this.client.write(buffer);
    }
    this.active = false;
  }
}
