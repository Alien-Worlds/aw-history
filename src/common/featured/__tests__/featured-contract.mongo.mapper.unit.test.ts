import { FeaturedContractMongoMapper } from '../featured-contract.mongo.mapper';
import { MongoDB } from '@alien-worlds/storage-mongodb';
import { FeaturedContract } from '../featured-contract';
import { FeaturedContractMongoModel } from '../featured.types';

describe('FeaturedContractMongoMapper', () => {
  const fromBigIntMock = jest.fn();
  const parseToBigIntMock = jest.fn();

  beforeAll(() => {
    MongoDB.Long.fromBigInt = fromBigIntMock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const mapper = new FeaturedContractMongoMapper();

  it('should convert from entity to model correctly', () => {
    const entity = new FeaturedContract('1', 100n, 'account1');
    fromBigIntMock.mockReturnValue('100');

    const model = mapper.fromEntity(entity);
    expect(model).toEqual({
      _id: new MongoDB.ObjectId('1'),
      initial_block_number: '100',
      account: 'account1',
    });
    expect(fromBigIntMock).toHaveBeenCalledWith(100n);
  });

  it('should convert from model to entity correctly', () => {
    const model: FeaturedContractMongoModel = {
      _id: new MongoDB.ObjectId('1'),
      initial_block_number: MongoDB.Long.fromBigInt(100n),
      account: 'account1',
    };
    parseToBigIntMock.mockReturnValue(100n);

    const entity = mapper.toEntity(model);
    expect(entity).toEqual(new FeaturedContract('1', 100n, 'account1'));
    expect(parseToBigIntMock).toHaveBeenCalledWith(100n);
  });
});
