import { UnknownObject } from '@alien-worlds/api-core';

export class FeaturedUtils {
  public static readFeaturedContracts(data: UnknownObject | unknown[]): string[] {
    const contracts = new Set<string>();
    if (!data) {
      return [];
    }
    Object.keys(data).forEach(key => {
      const value = data[key];

      if (key === 'contract' && Array.isArray(value)) {
        value.forEach(contract => {
          if (typeof contract === 'string') {
            contracts.add(contract);
          }
        });
      } else if (key === 'contract' && typeof value === 'string') {
        if (typeof value === 'string') {
          contracts.add(value);
        }
      } else if (Array.isArray(value) || typeof value === 'object') {
        const result = this.readFeaturedContracts(value);
        result.forEach(contract => {
          contracts.add(contract);
        });
      }
    });
    return Array.from(contracts);
  }
}
