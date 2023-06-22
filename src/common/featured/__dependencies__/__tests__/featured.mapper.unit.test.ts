import { MatcherNotFoundError, PatternMatchError } from '../../featured.errors';
import { FeaturedMapper } from '../../featured.mapper';
import {
  MatchCriteria,
  ProcessorMatchCriteria,
  ProcessorMatcher,
} from '../../featured.types';

describe('ContractProcessorMapper', () => {
  let contractProcessorMapper: FeaturedMapper;

  const mockCriteria: ProcessorMatchCriteria[] = [
    {
      contract: 'mockContract1',
      action: ['mockAction1', 'mockAction2'],
      processor: 'mockProcessor1',
    },
    {
      contract: ['mockContract2', 'mockContract3'],
      action: ['mockAction3'],
      processor: 'mockProcessor2',
    },
  ];
  const pattern: ProcessorMatchCriteria = {
    contract: '',
    action: '',
    processor: '',
  };

  const mockMatcher = async (criteria: MatchCriteria) => {
    return criteria.contract.includes('mockContract1');
  };

  const mockMatchers: ProcessorMatcher = new Map();
  mockMatchers.set('mockMatcher', mockMatcher);

  beforeEach(() => {
    contractProcessorMapper = new FeaturedMapper(mockCriteria, pattern, mockMatchers);
  });

  describe('constructor', () => {
    it('should throw error when matcher is not found', () => {
      const criteriaWithInvalidMatcher: ProcessorMatchCriteria[] = [
        {
          contract: 'mockContract',
          action: 'mockAction',
          processor: 'mockProcessor',
          matcher: 'invalidMatcher',
        },
      ];
      const pattern: ProcessorMatchCriteria = {
        contract: '',
        action: '',
        processor: '',
        matcher: '',
      };
      expect(
        () => new FeaturedMapper(criteriaWithInvalidMatcher, pattern, mockMatchers)
      ).toThrow(MatcherNotFoundError);
    });

    it('should add all contracts to the contracts set', () => {
      const contracts = (contractProcessorMapper as any).contracts;
      expect(contracts.size).toEqual(3);
      expect(contracts.has('mockContract1')).toBe(true);
      expect(contracts.has('mockContract2')).toBe(true);
      expect(contracts.has('mockContract3')).toBe(true);
    });
  });

  describe('validateCriteria', () => {
    it('should throw error when pattern does not match', () => {
      const invalidCriteria: MatchCriteria = {
        contract: ['mockContract', 'invalid*Contract'],
      };
      expect(() =>
        (contractProcessorMapper as any).validateCriteria(invalidCriteria)
      ).toThrow(PatternMatchError);
    });

    it('should not throw error when pattern matches', () => {
      const validCriteria: MatchCriteria = {
        contract: ['mockContract', 'anotherMockContract'],
      };
      expect(() =>
        (contractProcessorMapper as any).validateCriteria(validCriteria)
      ).not.toThrow();
    });
  });

  //...

  describe('isMatch', () => {
    it('should return true when candidate matches reference', () => {
      const ref: ProcessorMatchCriteria = {
        contract: ['mockContract1', 'mockContract2'],
        action: ['mockAction1', 'mockAction2'],
        processor: 'mockProcessor',
      };
      const candidate: MatchCriteria = {
        contract: 'mockContract1',
        action: 'mockAction1',
      };

      expect((contractProcessorMapper as any).isMatch(ref, candidate)).toBe(true);
    });

    it('should return false when candidate does not match reference', () => {
      const ref: ProcessorMatchCriteria = {
        contract: ['mockContract1', 'mockContract2'],
        action: ['mockAction1', 'mockAction2'],
        processor: 'mockProcessor',
      };
      const candidate: MatchCriteria = {
        contract: 'mockContract3',
        action: 'mockAction3',
      };

      expect((contractProcessorMapper as any).isMatch(ref, candidate)).toBe(false);
    });
  });

  describe('findProcessorMatchCriteria', () => {
    it('should return match criteria when a matcher matches', async () => {
      const criteria: MatchCriteria = {
        contract: 'mockContract1',
        action: 'mockAction1',
      };

      const result = await (contractProcessorMapper as any).findProcessorMatchCriteria(
        criteria
      );

      expect(result).toBeDefined();
      expect(result.processor).toEqual('mockProcessor1');
    });

    it('should return null when no matcher matches', async () => {
      const criteria: MatchCriteria = {
        contract: 'mockContract3',
        action: 'mockAction3',
      };

      const result = await (contractProcessorMapper as any).findProcessorMatchCriteria(
        criteria
      );

      expect(result).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true when the match criteria is found', async () => {
      const criteria: MatchCriteria = {
        contract: 'mockContract1',
        action: 'mockAction1',
      };

      expect(await contractProcessorMapper.has(criteria)).toBe(true);
    });

    it('should return false when the match criteria is not found', async () => {
      const criteria: MatchCriteria = {
        contract: 'mockContract3',
        action: 'mockAction3',
      };

      expect(await contractProcessorMapper.has(criteria)).toBe(false);
    });
  });

  describe('get', () => {
    it('should return all matched criteria', async () => {
      const criteria: MatchCriteria = {
        contract: 'mockContract1',
        action: 'mockAction1',
      };

      const results = await contractProcessorMapper.get(criteria);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].contract.includes('mockContract1')).toBe(true);
      expect(results[0].action.includes('mockAction1')).toBe(true);
    });

    it('should return an empty array when no criteria match', async () => {
      const criteria: MatchCriteria = {
        contract: 'mockContract3',
        action: 'mockAction3',
      };

      const results = await contractProcessorMapper.get(criteria);

      expect(results.length).toBe(0);
    });
  });

  describe('getProcessor', () => {
    it('should return the correct processor name', async () => {
      const label = 'contract:mockContract1,action:mockAction1';
      const criteria: MatchCriteria = {
        contract: 'mockContract1',
        action: 'mockAction1',
      };

      const processorName = await contractProcessorMapper.getProcessor(label, criteria);

      expect(processorName).toEqual('mockProcessor1');
    });

    it('should return an empty string when no processor matches', async () => {
      const label = 'contract:mockContract3,action:mockAction3';
      const criteria: MatchCriteria = {
        contract: 'mockContract3',
        action: 'mockAction3',
      };

      const processorName = await contractProcessorMapper.getProcessor(label, criteria);

      expect(processorName).toEqual('');
    });
  });

  describe('listContracts', () => {
    it('should return all unique contracts', () => {
      const contracts = contractProcessorMapper.listContracts();

      expect(contracts.length).toBeGreaterThan(0);
      expect(contracts.includes('mockContract1')).toBe(true);
      expect(contracts.includes('mockContract2')).toBe(true);
    });
  });
});
