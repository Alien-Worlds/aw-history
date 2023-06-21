import { FeaturedMapper } from './featured.mapper';
import { ContractDeltaMatchCriteria, ProcessorMatchCriteria } from './featured.types';

export class FeaturedDeltas {
  private mapper: FeaturedMapper;

  constructor(criteria: ProcessorMatchCriteria<ContractDeltaMatchCriteria>[]) {
    this.mapper = new FeaturedMapper(criteria);
  }

  public getProcessor(contract: string) {
    return this.mapper.getProcessor(contract, {
      shipDeltaMessageName: [],
      contract: [],
      name: [],
      code: [],
      scope: [],
      table: [],
    });
  }

  public listContracts(): string[] {
    return this.listContracts();
  }
}
