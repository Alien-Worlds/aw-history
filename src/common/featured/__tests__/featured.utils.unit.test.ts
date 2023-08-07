import { FeaturedUtils } from '../featured.utils';

describe('FeaturedUtils', () => {
  describe('readFeaturedContracts', () => {
    it('should return an empty array for empty data', () => {
      const data = {};
      const result = FeaturedUtils.readFeaturedContracts(data);
      expect(result).toEqual([]);
    });

    it('should return an empty array for non-object data', () => {
      const data = null;
      const result = FeaturedUtils.readFeaturedContracts(data);
      expect(result).toEqual([]);
    });

    it('should return an array of unique contracts from the data object', () => {
      const data = {
        contract: ['ContractA', 'ContractB'],
        otherProp: 'some value',
      };
      const result = FeaturedUtils.readFeaturedContracts(data);
      expect(result).toEqual(['ContractA', 'ContractB']);
    });

    it('should return an array of unique contracts from nested data', () => {
      let data = {
        prop1: 'value1',
        prop2: {
          contract: 'ContractC',
          prop3: {
            contract: ['ContractD', 'ContractE'],
          },
        },
      };
      let result = FeaturedUtils.readFeaturedContracts(data);
      expect(result).toEqual(['ContractC', 'ContractD', 'ContractE']);

      const nested = {
        traces: [
          {
            prop1: 'value1',
            prop2: {
              contract: 'ContractC',
              prop3: {
                contract: ['ContractD', 'ContractE'],
              },
            },
          },
        ],
        deltas: [
          {
            prop1: 'value1',
            prop2: {
              contract: 'ContractF',
              prop3: {
                contract: ['ContractA', 'ContractB'],
              },
            },
          },
        ],
      };
      result = FeaturedUtils.readFeaturedContracts(nested);
      expect(result).toEqual([
        'ContractC',
        'ContractD',
        'ContractE',
        'ContractF',
        'ContractA',
        'ContractB',
      ]);
    });

    it('should ignore non-string values in the contract property', () => {
      const data = {
        contract: [123, 'ContractF', true, null],
      };
      const result = FeaturedUtils.readFeaturedContracts(data);
      expect(result).toEqual(['ContractF']);
    });
  });
});
