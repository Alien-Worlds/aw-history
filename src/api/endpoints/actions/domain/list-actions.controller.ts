import { inject, injectable, Result } from '@alien-worlds/api-core';
import { ListActionsInput } from './models/list-actions.input';
import { ListActionsOutput } from './models/list-actions.output';
import { ListActionsUseCase } from './use-cases/list-actions.use-case';

/*imports*/

/**
 * @class
 *
 *
 */
@injectable()
export class ActionsController {
  public static Token = 'ACTIONS_CONTROLLER';
  constructor(
    @inject(ListActionsUseCase.Token)
    private listActionsUseCase: ListActionsUseCase
  ) {}

  /*methods*/

  /**
   *
   * @returns {Promise<Result<ListActionsOutput, Error>>}
   */
  public async list(input: ListActionsInput): Promise<Result<ListActionsOutput, Error>> {
    const result = await this.listActionsUseCase.execute(input);

    return Result.withContent(ListActionsOutput.create(result));
  }
}
