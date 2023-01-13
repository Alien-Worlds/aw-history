/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unused-vars */
import { FeaturedContentType } from './featured.enums';
import {
  MatcherNotFoundError,
  PatternMatchError,
  UnknownContentTypeError,
} from './featured.errors';
import {
  AllocationType,
  FeaturedAllocationType,
  FeaturedConfig,
  FeaturedDelta,
  FeaturedDeltaAllocation,
  FeaturedMatcher,
  FeaturedMatchers,
  FeaturedTrace,
  FeaturedTraceAllocation,
  FeaturedType,
} from './featured.types';
import { buildFeaturedAllocation } from './featured.utils';

export abstract class FeaturedContent<T = FeaturedType> {
  public abstract getProcessor(label: string): Promise<string>;

  protected processorsByMatchers: FeaturedMatcher = new Map();
  protected allocations: T[] = [];

  constructor(allocations: T[], matchers?: FeaturedMatcher) {
    allocations.forEach(allocation => {
      const { processor, matcher, ...rest } = allocation as FeaturedType;

      if (matcher && !matchers?.has(matcher)) {
        throw new MatcherNotFoundError(matcher);
      }

      if (matcher && matchers.has(matcher)) {
        this.processorsByMatchers.set(processor, matchers.get(matcher));
      } else {
        this.validateAllocation(rest);
        //
        if (this.allocations.indexOf(allocation) === -1) {
          this.allocations.push(allocation);
        }
      }
    });
  }

  protected validateAllocation(allocation: FeaturedAllocationType): void {
    const keys = Object.keys(allocation);

    for (const key of keys) {
      const values = allocation[key];
      for (const value of values) {
        if (/^(\*|[A-Za-z0-9_.]*)$/g.test(value) === false) {
          throw new PatternMatchError(value, '^(*|[A-Za-z0-9_.]*)$');
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
      if (Array.isArray(refValues)) {
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
    }

    return matchFound;
  }

  protected async testMatchers(
    allocation: FeaturedAllocationType | AllocationType
  ): Promise<T> {
    const { processorsByMatchers } = this;
    const entries = Array.from(processorsByMatchers.entries());

    for (const entry of entries) {
      const [processor, matcher] = entry;
      if (await matcher(allocation)) {
        return {
          ...buildFeaturedAllocation(allocation),
          processor,
        } as T;
      }
    }

    return null;
  }

  public async has(
    allocation: FeaturedAllocationType | AllocationType
  ): Promise<boolean> {
    const { allocations, processorsByMatchers } = this;

    for (const item of allocations) {
      if (this.isMatch(item, allocation)) {
        return true;
      }
    }

    if (processorsByMatchers.size > 0) {
      const featured = await this.testMatchers(allocation);
      if (featured) {
        if (allocations.indexOf(featured) === -1) {
          allocations.push(featured);
        }
        return true;
      }
    }

    return false;
  }

  public async get(allocation: FeaturedAllocationType | AllocationType): Promise<T[]> {
    const { allocations, processorsByMatchers } = this;
    const result: T[] = [];

    for (const item of allocations) {
      if (this.isMatch(item, allocation)) {
        result.push(item);
      }
    }

    if (result.length === 0 && processorsByMatchers.size > 0) {
      const featured = await this.testMatchers(allocation);

      if (featured) {
        if (allocations.indexOf(featured) === -1) {
          allocations.push(featured);
        }
        result.push(featured);
      }
    }

    return result;
  }

  public toJson(): T[] {
    return this.allocations;
  }

  protected async getProcessorBySchema<SchemaType>(
    label: string,
    allocationSchema: SchemaType
  ): Promise<string> {
    const { allocations } = this;
    const keys = Object.keys(allocationSchema);
    const parts = label.split(':').map(part => part.split(','));
    const allocation = parts.reduce((result, part, i) => {
      result[keys[i]] = part;
      return result;
    }, allocationSchema);

    for (const featured of allocations) {
      if (this.isMatch(featured, allocation)) {
        return (<FeaturedType>featured).processor;
      }
    }

    const featured = await this.testMatchers(allocation as FeaturedAllocationType);

    if (featured) {
      if (allocations.indexOf(featured) === -1) {
        allocations.push(featured);
      }
      return (<FeaturedType>featured).processor;
    }

    return '';
  }
}

export class FeaturedTraces extends FeaturedContent<FeaturedTrace> {
  constructor(traces: FeaturedTrace[], matchers?: FeaturedMatcher) {
    super(traces, matchers);
  }

  public async getProcessor(label: string): Promise<string> {
    return this.getProcessorBySchema<FeaturedTraceAllocation>(label, {
      shipTraceMessageName: [],
      shipActionTraceMessageName: [],
      contract: [],
      action: [],
    });
  }
}

export class FeaturedDeltas extends FeaturedContent<FeaturedDelta> {
  constructor(deltas: FeaturedDelta[], matchers?: FeaturedMatcher) {
    super(deltas, matchers);
  }

  public async getProcessor(label: string): Promise<string> {
    return this.getProcessorBySchema<FeaturedDeltaAllocation>(label, {
      shipDeltaMessageName: [],
      name: [],
      code: [],
      scope: [],
      table: [],
    });
  }
}

export class FeaturedContractContent {
  private traces: FeaturedTraces;
  private deltas: FeaturedDeltas;

  constructor(config: FeaturedConfig, matchers?: FeaturedMatchers) {
    const { traces, deltas } = matchers || {};
    this.traces = new FeaturedTraces(config.traces, traces);
    this.deltas = new FeaturedDeltas(config.deltas, deltas);
  }

  public getProcessor(type: FeaturedContentType, label: string) {
    if (type === FeaturedContentType.Action) {
      return this.traces.getProcessor(label);
    } else if (type === FeaturedContentType.Delta) {
      return this.deltas.getProcessor(label);
    } else {
      throw new UnknownContentTypeError(type);
    }
  }

  public toJson() {
    const { deltas, traces } = this;
    return {
      traces: traces.toJson(),
      deltas: deltas.toJson(),
    };
  }
}
