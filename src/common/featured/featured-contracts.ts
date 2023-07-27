import {
  FindParams,
  Repository,
  Result,
  SmartContractService,
  UnknownObject,
  Where,
} from '@alien-worlds/aw-core';
import { FeaturedContract } from './featured-contract';
import { FeaturedUtils } from './featured.utils';

export class FeaturedContracts {
  protected cache: Map<string, FeaturedContract> = new Map();
  protected featuredContracts: string[];

  constructor(
    private repository: Repository<FeaturedContract>,
    private smartContractService: SmartContractService,
    criteria: UnknownObject
  ) {
    this.featuredContracts = FeaturedUtils.readFeaturedContracts(criteria);
  }

  /**
   * Reads multiple contracts and returns the results as an array of FeaturedContract objects.
   *
   * @abstract
   * @param {string[]} contracts - An array of contract addresses or identifiers.
   * @returns {Promise<Result<FeaturedContract[]>>} A Promise that resolves to an array of FeaturedContract objects.
   */
  public async readContracts(
    data: string[] | UnknownObject
  ): Promise<Result<FeaturedContract[]>> {
    const list: FeaturedContract[] = [];

    const contracts = Array.isArray(data)
      ? data
      : FeaturedUtils.readFeaturedContracts(data);

    for (const contract of contracts) {
      if (this.cache.has(contract)) {
        list.push(this.cache.get(contract));
      } else {
        const { content: contracts, failure } = await this.repository.find(
          FindParams.create({ where: new Where().valueOf('account').isEq(contract) })
        );

        if (failure) {
          return Result.withFailure(failure);
        }

        if (contracts.length > 0) {
          const featuredContract = contracts[0];
          this.cache.set(featuredContract.account, featuredContract);
          list.push(featuredContract);
        } else {
          const fetchResult = await this.smartContractService.getStats(contract);

          if (fetchResult.isFailure) {
            return Result.withFailure(fetchResult.failure);
          }
          if (fetchResult.content) {
            const featuredContract = FeaturedContract.create(
              fetchResult.content.account_name,
              fetchResult.content.first_block_num
            );
            this.cache.set(featuredContract.account, featuredContract);
            this.repository.add([featuredContract]);
            list.push(featuredContract);
          }
        }
      }
    }

    return Result.withContent(list);
  }

  public isFeatured(contract: string): boolean {
    return this.featuredContracts.includes(contract);
  }
}
