import { ContractAction, Result } from '@alien-worlds/aw-core';

export class ListActionsOutput {
  public static create(result: Result<ContractAction[]>): ListActionsOutput {
    return new ListActionsOutput(result);
  }

  private constructor(public readonly result: Result<ContractAction[]>) {}

  public toResponse() {
    const { result } = this;
    if (result.isFailure) {
      const {
        failure: { error },
      } = result;
      if (error) {
        return {
          status: 500,
          body: [],
        };
      }
    }
    
    return {
      status: 200,
      body: result.content
    };
  }
}
