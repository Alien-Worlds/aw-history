/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AllocationType,
  FeaturedAllocationType,
  FeaturedConfig,
  FeaturedDelta,
  FeaturedDeltaAllocation,
  FeaturedTrace,
  FeaturedTraceAllocation,
  FeaturedType,
} from './featured.types';

export abstract class Featured<T = FeaturedType> {
  public abstract getProcessor(label: string): string;

  protected list: T[] = [];

  protected validateAllocation(allocation: FeaturedAllocationType): void {
    const keys = Object.keys(allocation);

    for (const key of keys) {
      const values = allocation[key];
      for (const value of values) {
        if (/^(\*|[A-Za-z0-9_.]*)$/g.test(value) === false) {
          throw new Error('');
        }
      }
    }
  }

  protected isMatch<T = FeaturedType, K = FeaturedAllocationType | AllocationType>(
    ref: T,
    candidate: K
  ): boolean {
    let matchFound = false;
    const keys = Object.keys(candidate);

    for (const key of keys) {
      const candidateValues: string | string[] = candidate[key];
      const refValues: string[] = ref[key];
      const values: string[] = Array.isArray(candidateValues)
        ? candidateValues
        : [candidateValues];
      const contains = values.some(value => refValues.includes(value));

      if (refValues.includes('*') || contains) {
        matchFound = true;
      } else {
        return false;
      }
    }

    return matchFound;
  }

  public has(allocation: FeaturedAllocationType | AllocationType): boolean {
    const { list } = this;

    for (const item of list) {
      if (this.isMatch(item, allocation)) {
        return true;
      }
    }

    return false;
  }

  public get(allocation: FeaturedAllocationType | AllocationType): T[] {
    const { list } = this;
    const result: T[] = [];

    for (const item of list) {
      if (this.isMatch(item, allocation)) {
        result.push(item);
      }
    }

    return result;
  }

  public toJson(): T[] {
    return this.list;
  }

  protected getProcessorBySchema<SchemaType = FeaturedDeltaAllocation>(
    label: string,
    allocationSchema: SchemaType
  ): string {
    const { list } = this;
    const keys = Object.keys(allocationSchema);
    const parts = label.split(':').map(part => part.split(','));
    const allocation = parts.reduce((result, part, i) => {
      result[keys[i]] = part;
      return result;
    }, allocationSchema);

    for (const featured of list) {
      if (this.isMatch(featured, allocation)) {
        return (<FeaturedType>featured).processor;
      }
    }

    return '';
  }
}

export class FeaturedTraces extends Featured<FeaturedTrace> {
  constructor(traces: FeaturedTrace[]) {
    super();

    traces.forEach(trace => {
      const { processor, ...rest } = trace;
      this.validateAllocation(rest);

      if (this.list.indexOf(trace) === -1) {
        this.list.push(trace);
      }
    });
  }

  public getProcessor(label: string): string {
    return super.getProcessorBySchema<FeaturedTraceAllocation>(label, {
      shipTraceMessageName: [],
      shipActionTraceMessageName: [],
      contract: [],
      action: [],
    });
  }
}

export class FeaturedDeltas extends Featured<FeaturedDelta> {
  constructor(deltas: FeaturedDelta[]) {
    super();

    deltas.forEach(delta => {
      const { processor, ...rest } = delta;
      this.validateAllocation(rest);

      if (this.list.indexOf(delta) === -1) {
        this.list.push(delta);
      }
    });
  }

  public getProcessor(label: string): string {
    return super.getProcessorBySchema<FeaturedDeltaAllocation>(label, {
      shipDeltaMessageName: [],
      name: [],
      code: [],
      scope: [],
      table: [],
    });
  }
}

export class FeaturedContent {
  private fTraces: FeaturedTraces;
  private fDeltas: FeaturedDeltas;

  constructor(config: FeaturedConfig) {
    this.fTraces = new FeaturedTraces(config.traces);
    this.fDeltas = new FeaturedDeltas(config.deltas);
  }

  public get traces(): FeaturedTraces {
    return this.fTraces;
  }

  public get deltas(): FeaturedDeltas {
    return this.fDeltas;
  }

  public toJson() {
    const { fDeltas, fTraces } = this;
    return {
      traces: fTraces.toJson(),
      deltas: fDeltas.toJson(),
    };
  }
}
