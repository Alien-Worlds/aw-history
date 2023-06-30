import { AbisCache } from '../abis.cache';

describe('AbisCache', () => {
  let abisCache: AbisCache;

  beforeEach(() => {
    abisCache = new AbisCache();
  });

  describe('getAbis', () => {
    it('should return an empty array when cache is empty', () => {
      const result = abisCache.getAbis({ contracts: ['eosio'] });
      expect(result).toEqual([]);
    });

    it('should return an empty array when contracts array is empty', () => {
      abisCache.insertAbis([
        { contract: 'eosio', blockNumber: 1n } as any,
        { contract: 'eosio', blockNumber: 2n } as any,
        { contract: 'eosio', blockNumber: 3n } as any,
      ]);

      const result = abisCache.getAbis({ contracts: [] });
      expect(result).toEqual([]);
    });

    it('should return all ABIs when no startBlock or endBlock is provided', () => {
      abisCache.insertAbis([
        { contract: 'eosio', blockNumber: 1n } as any,
        { contract: 'eosio', blockNumber: 2n } as any,
        { contract: 'eosio', blockNumber: 3n } as any,
      ]);

      const result = abisCache.getAbis({ contracts: ['eosio'] });
      expect(result).toEqual([
        { contract: 'eosio', blockNumber: 1n } as any,
        { contract: 'eosio', blockNumber: 2n } as any,
        { contract: 'eosio', blockNumber: 3n } as any,
      ]);
    });

    it('should return matching ABIs within the specified range', () => {
      abisCache.insertAbis([
        { contract: 'eosio', blockNumber: 1n } as any,
        { contract: 'eosio', blockNumber: 2n } as any,
        { contract: 'eosio', blockNumber: 3n } as any,
      ]);

      const result = abisCache.getAbis({
        contracts: ['eosio'],
        startBlock: 2n,
        endBlock: 3n,
      });
      expect(result).toEqual([
        { contract: 'eosio', blockNumber: 2n } as any,
        { contract: 'eosio', blockNumber: 3n } as any,
      ]);
    });
  });

  describe('getAbi', () => {
    it('should return null when cache is empty', () => {
      const result = abisCache.getAbi(1n, 'eosio');
      expect(result).toBeNull();
    });

    it('should return the latest ABI that matches the block number', () => {
      abisCache.insertAbis([
        { contract: 'eosio', blockNumber: 1n } as any,
        { contract: 'eosio', blockNumber: 2n } as any,
        { contract: 'eosio', blockNumber: 3n } as any,
      ]);

      const result = abisCache.getAbi(2n, 'eosio');
      expect(result).toEqual({ contract: 'eosio', blockNumber: 2n } as any);
    });

    it('should return null when no matching ABI is found', () => {
      abisCache.insertAbis([
        { contract: 'eosio', blockNumber: 1n } as any,
        { contract: 'eosio', blockNumber: 2n } as any,
        { contract: 'eosio', blockNumber: 3n } as any,
      ]);

      const result = abisCache.getAbi(4n, 'undefined');
      expect(result).toBeNull();
    });
  });

  describe('insertAbis', () => {
    it('should insert ABIs into the cache', () => {
      const abis = [
        { contract: 'eosio', blockNumber: 1n } as any,
        { contract: 'eosio', blockNumber: 2n } as any,
        { contract: 'eosio', blockNumber: 3n } as any,
      ];

      abisCache.insertAbis(abis);

      const result = abisCache.getAbis({ contracts: ['eosio'] });
      expect(result).toEqual(abis);
    });
  });
});
