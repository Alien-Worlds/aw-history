/**
 * Register (in memory) of currently processed tasks by workers
 */
export class BlockRangeScanRegistry {
  private scanByWorkerId: Map<number, string> = new Map();

  public add(workerId: number, scanHash: string): boolean {
    if (this.scanByWorkerId.has(workerId)) {
      return false;
    }

    this.scanByWorkerId.set(workerId, scanHash);

    return true;
  }

  public has(scanHash: string) {
    let result = false;
    this.scanByWorkerId.forEach(hash => {
      if (hash === scanHash) {
        result = true;
      }
    });

    return result;
  }

  public removeByWorkerId(workerId: number) {
    if (this.scanByWorkerId.has(workerId)) {
      this.scanByWorkerId.delete(workerId);
    }
  }

  public removeByHash(scanHash: string) {
    let workerId;
    this.scanByWorkerId.forEach((hash, id) => {
      if (hash === scanHash) {
        workerId = id;
      }
    });

    if (workerId) {
      this.scanByWorkerId.delete(workerId);
    }
  }
}
