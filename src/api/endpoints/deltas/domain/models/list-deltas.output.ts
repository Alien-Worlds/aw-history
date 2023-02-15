import { ContractDelta } from '@alien-worlds/api-core';

export class ListDeltasOutput {
  public static create(deltas: ContractDelta[]): ListDeltasOutput {
    return new ListDeltasOutput(deltas);
  }

  private constructor(public readonly deltas: ContractDelta[]) {}

  public toJson() {
    const { deltas } = this;

    return deltas.map(delta => ({ implement: 'it' }));
  }
}
