/* eslint-disable @typescript-eslint/no-empty-function */

import { ActionTrace } from '../action-trace/action-trace';
import { PartialDto, TraceJson } from './trace.dtos';

export class Partial {
  public static create(type: string, dto: PartialDto): Partial {
    const {
      expiration,
      ref_block_num,
      ref_block_prefix,
      max_net_usage_words,
      max_cpu_usage_ms,
      delay_sec,
      transaction_extensions,
      signatures,
      context_free_data,
    } = dto;
    return new Partial(
      type,
      expiration,
      ref_block_num,
      ref_block_prefix,
      max_net_usage_words,
      max_cpu_usage_ms,
      delay_sec,
      transaction_extensions,
      signatures,
      context_free_data
    );
  }
  private constructor(
    public readonly name: string,
    public readonly expiration: string,
    public readonly refBlockNumber: number,
    public readonly refBlockPrefix: number,
    public readonly maxNetUsageWords: number,
    public readonly maxCpuUsageMs: number,
    public readonly delayInSeconds: number,
    public readonly transactionExtensions: unknown[],
    public readonly signatures: unknown[],
    public readonly contextFreeData: unknown[]
  ) {}
}

export class Trace {
  public static create(shipMessageName: string, traceDto: TraceJson): Trace {
    const {
      id,
      status,
      cpu_usage_us,
      net_usage_words,
      elapsed,
      net_usage,
      scheduled,
      action_traces,
      account_ram_delta,
      except,
      error_code,
      failed_dtrx_trace,
    } = traceDto;

    const actionTraces = action_traces.map(item => {
      const [actionTraceType, actionTraceDto] = item;
      return ActionTrace.create(actionTraceType, actionTraceDto);
    });
    let partial: Partial;
    if (traceDto.partial) {
      const [partialType, partialContent] = traceDto.partial;
      partial = Partial.create(partialType, partialContent);
    }

    return new Trace(
      shipMessageName,
      id,
      status,
      cpu_usage_us,
      net_usage_words,
      elapsed,
      net_usage,
      scheduled,
      actionTraces,
      account_ram_delta,
      except,
      Number(error_code),
      failed_dtrx_trace,
      partial
    );
  }

  private constructor(
    public readonly shipTraceMessageName: string,
    public readonly id: string,
    public readonly status: number,
    public readonly cpuUsageUs: number,
    public readonly netUsageWords: number,
    public readonly elapsed: string,
    public readonly netUsage: string,
    public readonly scheduled: boolean,
    public readonly actionTraces: ActionTrace[],
    public readonly accountRamDelta: unknown,
    public readonly except: unknown,
    public readonly errorCode: number,
    public readonly failedDtrxTrace: unknown,
    public readonly partial: Partial | null
  ) {}
}
