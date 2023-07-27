import { ContractEncodedAbi, Result } from '@alien-worlds/aw-core';

/**
 * This class manages ContractEncodedAbi entities, providing CRUD operations and additional functionalities such as caching.
 * It extends the base RepositoryImpl and implements the AbisRepository interface.
 */
export abstract class AbisRepository {
  /**
   * Cache the ABIs.
   * @param {string[]} [contracts] - List of contracts.
   */
  public abstract cacheAbis(contracts?: string[]);

  /**
   * Retrieve the ABIs.
   * @param options - Filter options for retrieving ABIs.
   * @returns Promise that resolves with the Result of an array of ContractEncodedAbi.
   */
  public abstract getAbis(options: {
    startBlock?: bigint;
    endBlock?: bigint;
    contracts?: string[];
  }): Promise<Result<ContractEncodedAbi[]>>;

  /**
   * Retrieve a specific ABI.
   * @param blockNumber - The block number.
   * @param contract - The contract name.
   * @returns Promise that resolves with the Result of ContractEncodedAbi.
   */
  public abstract getAbi(
    blockNumber: bigint,
    contract: string
  ): Promise<Result<ContractEncodedAbi>>;

  /**
   * Inserts an array of ABIs.
   * @param abis - The ABIs to be inserted.
   * @returns Promise that resolves with the Result of boolean indicating the success of the operation.
   */
  public abstract insertAbis(abis: ContractEncodedAbi[]): Promise<Result<boolean>>;

  /**
   * Counts the number of ABIs between the provided block numbers.
   * @param startBlock - The start block number.
   * @param endBlock - The end block number.
   * @returns Promise that resolves with the Result of number indicating the count of ABIs.
   */
  public abstract countAbis(
    startBlock?: bigint,
    endBlock?: bigint
  ): Promise<Result<number>>;
}
