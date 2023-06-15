/* eslint-disable @typescript-eslint/no-empty-function */

import { ActionTrace } from '../action-trace/action-trace';
import { PartialJson, TraceJson } from './trace.dtos';

/**
 * Represents a partial transaction.
 * @class
 */
export class Partial {
  /**
   * Creates a Partial instance.
   *
   * @param {string} type - The type of the partial transaction.
   * @param {PartialJson} json - The json containing the partial transaction information.
   * @returns {Partial} The created Partial instance.
   */
  public static create(type: string, json: PartialJson): Partial {
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
    } = json;
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

  /**
   * Creates an instance of Partial.
   *
   * @param {string} name - The name of the partial transaction.
   * @param {string} expiration - The expiration time of the partial transaction.
   * @param {number} refBlockNumber - The reference block number of the partial transaction.
   * @param {number} refBlockPrefix - The reference block prefix of the partial transaction.
   * @param {number} maxNetUsageWords - The maximum net usage words of the partial transaction.
   * @param {number} maxCpuUsageMs - The maximum CPU usage in milliseconds of the partial transaction.
   * @param {number} delayInSeconds - The delay in seconds of the partial transaction.
   * @param {unknown[]} transactionExtensions - The transaction extensions of the partial transaction.
   * @param {unknown[]} signatures - The signatures of the partial transaction.
   * @param {unknown[]} contextFreeData - The context-free data of the partial transaction.
   */
  constructor(
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

/**
 * Represents a trace of a transaction.
 * @class
 */
export class Trace {
  /**
   * Creates a Trace instance.
   *
   * @param {string} shipMessageName - The name of the ship message associated with the trace.
   * @param {TraceJson} json - The json containing the trace information.
   * @returns {Trace} The created Trace instance.
   */
  public static create(shipMessageName: string, json: TraceJson): Trace {
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
    } = json;

    const actionTraces = action_traces.map(item => {
      const [actionTraceType, actionTraceDto] = item;
      return ActionTrace.create(actionTraceType, actionTraceDto);
    });
    let partial: Partial;
    if (json.partial) {
      const [partialType, partialContent] = json.partial;
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

  /**
   * Creates an instance of Trace.
   *
   * @param {string} shipTraceMessageName - The name of the ship trace message.
   * @param {string} id - The ID of the trace.
   * @param {number} status - The status of the trace.
   * @param {number} cpuUsageUs - The CPU usage in microseconds of the trace.
   * @param {number} netUsageWords - The net usage words of the trace.
   * @param {string} elapsed - The elapsed time of the trace.
   * @param {string} netUsage - The net usage of the trace.
   * @param {boolean} scheduled - Indicates if the trace is scheduled.
   * @param {ActionTrace[]} actionTraces - The action traces of the trace.
   * @param {unknown} accountRamDelta - The account RAM delta of the trace.
   * @param {unknown} except - The exception information of the trace.
   * @param {number} errorCode - The error code of the trace.
   * @param {unknown} failedDtrxTrace - The failed deferred transaction trace.
   * @param {Partial | null} partial - The partial transaction associated with the trace.
   */
  constructor(
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
