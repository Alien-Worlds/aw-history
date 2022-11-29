import { AllocationType, FeaturedAllocationType } from './featured.types';

export const contentOrAll = (content: string[]) =>
  content?.length > 0 ? content : ['*'];

export const buildFeaturedAllocation = (
  allocation: FeaturedAllocationType | AllocationType
): FeaturedAllocationType => {
  const keys = Object.keys(allocation);
  const result = {};

  for (const key of keys) {
    const value = allocation[key];

    result[key] = Array.isArray(value) ? value : [value];
  }

  return result;
};
