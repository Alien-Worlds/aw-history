import { Socket } from 'net';
import { BroadcastTcpMessage } from './broadcast.tcp.message';

export class BroadcastMessageQueue {
  private queue: BroadcastTcpMessage[] = [];
  private active = false;

  constructor(private client: Socket) {}

  public add(message: BroadcastTcpMessage) {
    this.queue.push(message);

    if (this.active === false) {
      this.loop();
      this.active = true;
    }
  }

  private async write(message: BroadcastTcpMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.write(message.toBuffer(), error => (error ? reject(error) : resolve()));
    });
  }

  private async loop() {
    while (this.queue.length > 0) {
      const message = this.queue.shift();
      await this.write(message);
    }
    this.active = false;
  }
}
