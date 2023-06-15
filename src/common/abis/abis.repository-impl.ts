import { ContractEncodedAbi } from './contract-encoded-abi';
import {
  CountParams,
  FindParams,
  log,
  RepositoryImpl,
  Result,
  Where,
} from '@alien-worlds/api-core';
import { AbisCache } from './abis.cache';
import { AbisRepository } from './abis.repository';

/**
 * Implements the AbisRepository with caching functionality.
 * This class manages ContractEncodedAbi entities, providing CRUD operations and additional functionalities such as caching.
 * It extends the base RepositoryImpl and implements the AbisRepository interface.
 */
export class AbisRepositoryImpl
  extends RepositoryImpl<ContractEncodedAbi, unknown>
  implements AbisRepository
{
  /**
   * Cache instance for caching the ABI objects.
   * @private
   */
  private cache: AbisCache = new AbisCache();

  /**
   * Cache the ABIs.
   * @param {string[]} [contracts] - List of contracts.
   */
  public async cacheAbis(contracts?: string[]) {
    const abis = await this.getAbis({ contracts });
    if (Array.isArray(abis)) {
      this.cache.insertAbis(abis);
    }
  }

  /**
   * Retrieve the ABIs.
   * @param options - Filter options for retrieving ABIs.
   * @returns Promise that resolves with the Result of an array of ContractEncodedAbi.
   */
  public async getAbis(options: {
    startBlock?: bigint;
    endBlock?: bigint;
    contracts?: string[];
  }): Promise<Result<ContractEncodedAbi[]>> {
    try {
      const { startBlock, endBlock, contracts } = options || {};

      const cachedAbis = this.cache.getAbis(options);

      if (cachedAbis.length > 0) {
        return Result.withContent(cachedAbis);
      }
      const where = Where.bind<ContractEncodedAbi>();

      if (startBlock && endBlock) {
        where.props().blockNumber.isGte(startBlock).isLte(endBlock);
      }

      if (contracts) {
        where.props().contract.isIn(contracts);
      }

      return this.find(FindParams.create({ where }));
    } catch (error) {
      log(error);
      return Result.withContent([]);
    }
  }

  /**
   * Retrieve a specific ABI.
   * @param blockNumber - The block number.
   * @param contract - The contract name.
   * @returns Promise that resolves with the Result of ContractEncodedAbi.
   */
  public async getAbi(
    blockNumber: bigint,
    contract: string
  ): Promise<Result<ContractEncodedAbi>> {
    const cachedAbi = this.cache.getAbi(blockNumber, contract);

    if (cachedAbi) {
      return Result.withContent(cachedAbi);
    }

    const where = Where.bind<ContractEncodedAbi>();
    where.props().blockNumber.isLte(blockNumber).props().contract.isEq(contract);
    const { content, failure } = await this.find(
      FindParams.create({ where, limit: 1, sort: { block_number: -1 } })
    );

    if (content) {
      return Result.withContent(content[0]);
    }

    if (failure) {
      return Result.withFailure(failure);
    }
  }

  /**
   * Inserts an array of ABIs.
   * @param abis - The ABIs to be inserted.
   * @returns Promise that resolves with the Result of boolean indicating the success of the operation.
   */
  public async insertAbis(abis: ContractEncodedAbi[]): Promise<Result<boolean>> {
    this.cache.insertAbis(abis);
    const { content, failure } = await this.add(abis);

    if (failure) {
      log(failure.error);
      return Result.withContent(false);
    }

    return Result.withContent(content.length > 0);
  }

  /**
   * Counts the number of ABIs between the provided block numbers.
   * @param startBlock - The start block number.
   * @param endBlock - The end block number.
   * @returns Promise that resolves with the Result of number indicating the count of ABIs.
   */
  public async countAbis(
    startBlock?: bigint,
    endBlock?: bigint
  ): Promise<Result<number>> {
    const where = Where.bind<ContractEncodedAbi>();

    if (typeof startBlock === 'bigint') {
      where.props().blockNumber.isGte(startBlock);
    }

    if (typeof endBlock === 'bigint') {
      where.props().blockNumber.isLte(endBlock);
    }

    return this.count(CountParams.create({ where }));
  }
}
