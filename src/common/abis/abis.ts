import { AbiService, ContractEncodedAbi, Failure, Result, log } from '@alien-worlds/api-core';
import { AbisServiceNotSetError } from './abis.errors';
import { AbisRepository } from './abis.repository';
import { AbiNotFoundError } from '@alien-worlds/block-reader';

/**
 * Represents a collection of ABIs (Application Binary Interfaces) for smart contracts.
 */
export class Abis {
  private contracts: Set<string> = new Set();

  /**
   * Constructs a new instance of the Abis class.
   *
   * @param {AbisRepository} repository - The repository for accessing ABIs.
   * @param {AbisService} [service] - The service for fetching ABIs.
   * @param {FeaturedConfig} [featuredConfig] - The featured configuration containing contract traces and deltas.
   * @private
   */
  constructor(
    private repository: AbisRepository,
    private service?: AbiService,
    contracts?: string[]
  ) {
    if (contracts) {
      contracts.forEach(contract => {
        this.contracts.add(contract);
      });
    }
  }

  /**
   * Retrieves the ABIs (Application Binary Interfaces) for the specified options.
   *
   * @param {Object} [options] - The options for retrieving the ABIs.
   * @param {bigint} [options.startBlock] - The starting block number.
   * @param {bigint} [options.endBlock] - The ending block number.
   * @param {string[]} [options.contracts] - The contract addresses to filter the ABIs.
   * @param {boolean} [options.fetch] - Indicates whether to fetch ABIs if not found in the database.
   * @returns {Promise<Result<ContractEncodedAbi[]>>} A promise that resolves to a Result object containing the retrieved ABIs.
   */
  public async getAbis(options?: {
    startBlock?: bigint;
    endBlock?: bigint;
    contracts?: string[];
    fetch?: boolean;
  }): Promise<Result<ContractEncodedAbi[]>> {
    const { startBlock, endBlock, contracts, fetch } = options || {};

    const { content: abis } = await this.repository.getAbis(options);

    if (abis.length === 0 && fetch) {
      log(
        `No contract ABIs (${startBlock}-${endBlock}) were found in the database. Trying to fetch ABIs...`
      );
      return this.fetchAbis(contracts);
    }

    return Result.withContent(abis || []);
  }

  /**
   * Retrieves the ABI (Application Binary Interface) for the specified block number and contract address.
   *
   * @param {bigint} blockNumber - The block number.
   * @param {string} contract - The contract address.
   * @param {boolean} [fetch=false] - Indicates whether to fetch the ABI if not found in the database.
   * @returns {Promise<Result<ContractEncodedAbi>>} A promise that resolves to a Result object containing the retrieved ABI.
   */
  public async getAbi(
    blockNumber: bigint,
    contract: string,
    fetch = false
  ): Promise<Result<ContractEncodedAbi>> {
    const getAbiResult = await this.repository.getAbi(blockNumber, contract);

    if (fetch && getAbiResult.isFailure) {
      const { content: abis, failure } = await this.fetchAbis([contract]);

      if (failure) {
        return Result.withFailure(failure);
      }

      const abi = abis.reduce((result, abi) => {
        if (abi.blockNumber <= blockNumber) {
          if (!result || result.blockNumber < abi.blockNumber) {
            result = abi;
          }
        }
        return result;
      }, null);

      if (abi) {
        return Result.withContent(abi);
      }

      return Result.withFailure(Failure.fromError(new AbiNotFoundError()));
    }

    return getAbiResult;
  }

  /**
   * Stores the ABI (Application Binary Interface) with the specified block number, contract address, and hex code.
   *
   * @param {unknown} blockNumber - The block number.
   * @param {string} contract - The contract address.
   * @param {string} hex - The hex code representing the ABI.
   * @returns {Promise<Result<boolean>>} A promise that resolves to a Result object indicating the success or failure of the operation.
   */
  public async storeAbi(
    blockNumber: unknown,
    contract: string,
    hex: string
  ): Promise<Result<boolean>> {
    return this.repository.insertAbis([
      ContractEncodedAbi.create(blockNumber, contract, hex),
    ]);
  }

  /**
   * Fetches the ABIs (Application Binary Interfaces) for the specified contracts.
   *
   * @param {string[]} [contracts] - The contract addresses to fetch ABIs for.
   * @returns {Promise<Result<ContractEncodedAbi[]>>} A promise that resolves to a Result object containing the fetched ABIs.
   * @throws {AbisServiceNotSetError} Thrown if the AbisService is not set.
   * @private
   */
  public async fetchAbis(contracts?: string[]): Promise<Result<ContractEncodedAbi[]>> {
    if (!this.service) {
      throw new AbisServiceNotSetError();
    }

    const abis: ContractEncodedAbi[] = [];
    try {
      const contractsToFetch = contracts || this.contracts;
      for (const contract of contractsToFetch) {
        const contractAbis = await this.service.fetchAbis(contract);
        abis.push(...contractAbis);
      }

      if (abis.length > 0) {
        await this.repository.insertAbis(abis);
      }
    } catch (error) {
      log(error.message);
    }
    return Result.withContent(abis);
  }

  /**
   * Caches the ABIs (Application Binary Interfaces) for the specified contracts.
   *
   * @param {string[]} [contracts] - The contract addresses to cache ABIs for.
   * @returns {Promise<Result<void>>} A promise that resolves to a Result object indicating the success or failure of the operation.
   * @private
   */
  public async cacheAbis(contracts?: string[]): Promise<Result<void>> {
    try {
      await this.repository.cacheAbis(contracts);
      return Result.withoutContent();
    } catch (error) {
      log(error.message);
      return Result.withFailure(Failure.fromError(error));
    }
  }
}
