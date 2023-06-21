import { FeaturedMapper } from './featured.mapper';
import { ContractActionMatchCriteria, ProcessorMatchCriteria } from './featured.types';

export class FeaturedActions {
  private mapper: FeaturedMapper;

  constructor(criteria: ProcessorMatchCriteria<ContractActionMatchCriteria>[]) {
    this.mapper = new FeaturedMapper(criteria);
  }

  public getProcessor(criteria: ContractActionMatchCriteria) {
    return this.mapper.getProcessor(contract, {
      shipTraceMessageName: [],
      shipActionTraceMessageName: [],
      contract: [],
      action: [],
    });
  }

  public listContracts(): string[] {
    return this.listContracts();
  }
}
