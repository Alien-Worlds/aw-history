import { inject, injectable, Result } from '@alien-worlds/api-core';
import { ListDeltasInput } from './models/list-deltas.input';
import { ListDeltasOutput } from './models/list-deltas.output';
import { ListDeltasUseCase } from './use-cases/list-deltas.use-case';

/*imports*/

/**
 * @class
 *
 *
 */
@injectable()
export class DeltasController {
  public static Token = 'ACTIONS_CONTROLLER';
  constructor(
    @inject(ListDeltasUseCase.Token)
    private listDeltasUseCase: ListDeltasUseCase
  ) {}

  /*methods*/

  /**
   *
   * @returns {Promise<Result<ListDeltasOutput, Error>>}
   */
  public async list(input: ListDeltasInput): Promise<Result<ListDeltasOutput, Error>> {
    const { content: deltas, failure } = await this.listDeltasUseCase.execute(input);

    if (failure) {
      return Result.withFailure(failure);
    }

    return Result.withContent(ListDeltasOutput.create(deltas));
  }
}
