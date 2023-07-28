import { ContractAction, IO, Result, UnknownObject } from '@alien-worlds/aw-core';

export class ListActionsOutput implements IO {
  public static create(result: Result<ContractAction[]>): ListActionsOutput {
    return new ListActionsOutput(result);
  }

  constructor(public readonly result: Result<ContractAction[]>) {}

  toJSON(): UnknownObject {
    const { result } = this;

    if (result.isFailure) {
      return {};
    }

    return {
      result: result.content.map(r => r.toJSON()),
    };
  }
}
