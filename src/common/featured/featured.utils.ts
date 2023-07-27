import fetch from 'node-fetch';
import { UnknownObject } from '@alien-worlds/aw-core';
import { FeaturedContractDataCriteria } from './featured.types';
import { existsSync, readFileSync } from 'fs';

export class FeaturedUtils {
  public static readFeaturedContracts(data: UnknownObject | unknown[]): string[] {
    const contracts = new Set<string>();
    if (!data) {
      return [];
    }
    Object.keys(data).forEach(key => {
      const value = data[key];

      if ((key === 'contract' || key === 'code') && Array.isArray(value)) {
        value.forEach(contract => {
          if (typeof contract === 'string') {
            contracts.add(contract);
          }
        });
      } else if ((key === 'contract' || key === 'code') && typeof value === 'string') {
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

  public static async fetchCriteria<CriteriaType = FeaturedContractDataCriteria>(
    filePath: string
  ): Promise<CriteriaType> {
    const urlRegex =
      /^((ftp|http|https):\/\/)?(www\.)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(#[-a-z\d_]*)?$/i;
    const isHttpPath = urlRegex.test(filePath);

    if (isHttpPath) {
      const response = await fetch(filePath);
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } else {
      if (existsSync(filePath)) {
        const fileContent = readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
      }

      return null;
    }
  }
}
