import { CollectionMongoSource, Long, MongoSource } from '@alien-worlds/api-core';
import { FeaturedContractDocument } from './contract-reader.dtos';

export class FeaturedContractSource extends CollectionMongoSource<FeaturedContractDocument> {
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'history_tools.featured_contracts');
  }

  public async getInitialBlockNumber(account: string): Promise<Long> {
    const contract: FeaturedContractDocument = await this.findOne({
      filter: { account },
    });
    return contract ? contract.initial_block_number : Long.MIN_VALUE;
  }

  public async newState(account: string, initialBlockNumber: bigint): Promise<void> {
    await this.update(
      {
        initial_block_number: Long.fromBigInt(initialBlockNumber),
        account,
      },
      { options: { upsert: true } }
    );
  }
}
