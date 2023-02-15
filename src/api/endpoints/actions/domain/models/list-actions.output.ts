import { ContractAction } from '@alien-worlds/api-core';

export class ListActionsOutput {
  public static create(actions: ContractAction[]): ListActionsOutput {
    return new ListActionsOutput(actions);
  }

  private constructor(public readonly actions: ContractAction[]) {}

  public toJson() {
    const { actions } = this;

    return actions.map(action => ({ implement: 'it'}));
  }
}
