import { CollectionMongoSource, MongoDB, MongoSource } from '@alien-worlds/api-core';
import { FeaturedContractDocument } from './contract-reader.dtos';

export class FeaturedContractSource extends CollectionMongoSource<FeaturedContractDocument> {
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'history_tools.featured_contracts', {
      indexes: [
        { key: { account: 1 }, background: true },
        { key: { initial_block_number: 1, account: 1 }, unique: true, background: true },
      ],
    });
  }

  public async getInitialBlockNumber(account: string): Promise<MongoDB.Long> {
    const contract: FeaturedContractDocument = await this.findOne({
      filter: { account },
    });
    return contract ? contract.initial_block_number : MongoDB.Long.MIN_VALUE;
  }

  public async newState(account: string, initialBlockNumber: bigint): Promise<void> {
    await this.update(
      {
        initial_block_number: MongoDB.Long.fromBigInt(initialBlockNumber),
        account,
      },
      { options: { upsert: true } }
    );
  }
}
