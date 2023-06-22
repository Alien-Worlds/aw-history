import {
  MatcherNotFoundError,
  PatternMatchError,
  PatternMismatchError,
  UndefinedPatternError,
} from './featured.errors';
import {
  MatchCriteria,
  ProcessorMatchCriteria,
  ProcessorMatcher,
} from './featured.types';

/**
 * A mapper class for processing and matching contracts based on given criteria.
 * This class can be extended by other processors that require specific match criteria.
 */
export class FeaturedMapper<MatchCriteriaType = MatchCriteria> {
  /**
   * Map of processors matched by a matching function.
   */
  protected processorByMatchers: ProcessorMatcher<MatchCriteriaType> = new Map();
  /**
   * Array of match criteria.
   */
  protected matchCriteria: ProcessorMatchCriteria<MatchCriteriaType>[] = [];
  /**
   * Set of contracts.
   */
  protected contracts: Set<string> = new Set();

  /**
   * Creates a new instance of the contract processor mapper.
   * @param {ProcessorMatchCriteria<MatchCriteriaType>[]} criteria - An array of match criteria for the processor.
   * @param {MatchCriteriaType} pattern - The criteria pattern.
   * @param {ProcessorMatcher<MatchCriteriaType>} matchers - Optional map of matchers.
   */
  constructor(
    criteria: ProcessorMatchCriteria<MatchCriteriaType>[],
    protected pattern?: MatchCriteriaType,
    matchers?: ProcessorMatcher<MatchCriteriaType>
  ) {
    criteria.forEach(current => {
      const { processor, matcher, ...rest } = current;
      const { contract } = rest as unknown as MatchCriteria;

      if (Array.isArray(contract)) {
        contract.forEach(contract => this.contracts.add(contract));
      } else if (typeof contract === 'string') {
        this.contracts.add(contract);
      }

      if (matcher && !matchers?.has(matcher)) {
        throw new MatcherNotFoundError(matcher);
      }

      if (matcher && matchers.has(matcher)) {
        this.processorByMatchers.set(processor, matchers.get(matcher));
      } else {
        this.validateCriteria(rest as MatchCriteriaType);

        if (this.matchCriteria.indexOf(current) === -1) {
          this.matchCriteria.push(current);
        }
      }
    });
  }

  /**
   * Validates the given match criteria.
   * @param criteria - The criteria to validate.
   */
  protected validateCriteria(criteria: MatchCriteriaType): void {
    const keys = Object.keys(criteria);

    for (const key of keys) {
      const values = criteria[key];
      for (const value of values) {
        if (/^(\*|[A-Za-z0-9_.]*)$/g.test(value) === false) {
          throw new PatternMatchError(value, '^(*|[A-Za-z0-9_.]*)$');
        }
      }
    }
  }

  /**
   * Determines if a candidate match criteria meets a reference match criteria.
   * @param ref - The reference match criteria.
   * @param candidate - The candidate match criteria.
   * @returns True if a match is found, false otherwise.
   */
  protected isMatch(
    ref: ProcessorMatchCriteria<MatchCriteriaType>,
    candidate: MatchCriteriaType
  ): boolean {
    let matchFound = false;
    const keys = Object.keys(candidate);

    for (const key of keys) {
      const candidateValues = candidate[key];
      const refValues = ref[key];
      if (Array.isArray(refValues)) {
        const values: string[] = Array.isArray(candidateValues)
          ? candidateValues
          : [candidateValues];
        const contains = values.some(value => refValues.includes(value));

        if (refValues.includes('*') || contains) {
          matchFound = true;
        } else {
          return false;
        }
      }
    }

    return matchFound;
  }

  /**
   * Finds a processor match criteria for a given match criteria.
   * @param criteria - The criteria to find a match for.
   * @returns The matching processor match criteria if found, null otherwise.
   */
  protected async findProcessorMatchCriteria(
    criteria: MatchCriteriaType
  ): Promise<ProcessorMatchCriteria<MatchCriteriaType>> {
    const { processorByMatchers } = this;
    const entries = Array.from(processorByMatchers.entries());

    for (const entry of entries) {
      const [processor, matcher] = entry;
      if (await matcher(criteria)) {
        const keys = Object.keys(criteria);
        const matchCriteria = {} as MatchCriteriaType;

        for (const key of keys) {
          matchCriteria[key] = ['*'];
        }

        return {
          ...matchCriteria,
          processor,
        };
      }
    }

    return null;
  }

  /**
   * Checks if the criteria already exist in the array
   *
   * @param {ProcessorMatchCriteria<MatchCriteriaType>} criteria
   * @param {ProcessorMatchCriteria<MatchCriteriaType>[]} array
   * @returns
   */
  protected criteriaExistsInArray(
    criteria: ProcessorMatchCriteria<MatchCriteriaType>,
    array: ProcessorMatchCriteria<MatchCriteriaType>[]
  ): boolean {
    return array.some(item =>
      Object.keys(item).every(key => item[key] === criteria[key])
    );
  }

  /**
   * Determines if the given match criteria exists in the processor.
   * @param criteria - The criteria to check.
   * @returns True if the criteria exists, false otherwise.
   */
  public async has(criteria: MatchCriteriaType): Promise<boolean> {
    const { matchCriteria, processorByMatchers } = this;

    for (const item of matchCriteria) {
      if (this.isMatch(item, criteria)) {
        return true;
      }
    }

    if (processorByMatchers.size > 0) {
      const featured = await this.findProcessorMatchCriteria(criteria);
      if (featured) {
        if (this.criteriaExistsInArray(featured, matchCriteria) === false) {
          matchCriteria.push(featured);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Gets all match criteria in the processor that match the given criteria.
   * @param criteria - The criteria to match.
   * @returns An array of matching criteria.
   */
  public async get(criteria: MatchCriteriaType): Promise<MatchCriteriaType[]> {
    const { matchCriteria, processorByMatchers } = this;
    const result: MatchCriteriaType[] = [];

    for (const item of matchCriteria) {
      if (this.isMatch(item, criteria)) {
        result.push(item);
      }
    }

    if (result.length === 0 && processorByMatchers.size > 0) {
      const featured = await this.findProcessorMatchCriteria(criteria);
      if (featured) {
        if (this.criteriaExistsInArray(featured, matchCriteria) === false) {
          matchCriteria.push(featured);
        }
        result.push(featured);
      }
    }

    return result;
  }

  /**
   * Gets the processor for the given label and criteria.
   * @param label - The label to find a processor for.
   * @param pattern - The match criteria pattern.
   * @returns The processor if found, empty string otherwise.
   */
  public async getProcessor(label: string, pattern?: MatchCriteriaType): Promise<string> {
    const { matchCriteria } = this;
    const p = pattern || this.pattern;

    if (!p) {
      throw new UndefinedPatternError();
    }

    const keys = Object.keys(p);
    const parts = label.split(':').map(part => part.split(','));

    if (parts.length !== keys.length) {
      throw new PatternMismatchError();
    }

    const candidate = parts.reduce((result, part, i) => {
      result[keys[i]] = part;
      return result;
    }, p);

    for (const criteriaRef of matchCriteria) {
      if (this.isMatch(criteriaRef, candidate)) {
        return criteriaRef.processor;
      }
    }

    const featured = await this.findProcessorMatchCriteria(candidate);

    if (featured) {
      if (matchCriteria.indexOf(featured) === -1) {
        matchCriteria.push(featured);
      }
      return featured.processor;
    }

    return '';
  }

  /**
   * Lists all contracts in the processor.
   * @returns An array of contracts.
   */
  public listContracts(): string[] {
    return Array.from(this.contracts);
  }
}
