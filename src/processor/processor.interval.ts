import { FeaturedContractContent } from '../common/featured';
import { ProcessorQueue } from '../common/processor-queue';
import { WorkerPool } from '../common/workers';

export class ProcessorInterval {
  private timer: NodeJS.Timer = null;

  constructor(
    private handler: (...args: unknown[]) => Promise<void>,
    private workerPool: WorkerPool,
    private queue: ProcessorQueue,
    private featuredContent: FeaturedContractContent
  ) {}

  public start(delay = 1000): void {
    if (!this.timer) {
      const { handler, workerPool, queue, featuredContent } = this;
      this.timer = setInterval(async () => {
        if (await queue.hasTask()) {
          handler(workerPool, queue, featuredContent);
        } else {
          this.stop();
        }
      }, delay);
    }
  }

  public stop(): void {
    clearInterval(this.timer);
    this.timer = null;
  }

  public isActive(): boolean {
    return this.timer !== null;
  }

  public isIdle(): boolean {
    return this.timer === null;
  }
}
