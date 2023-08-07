import { FilterConfig } from "./filter.config";

export type FilterSharedData = {
  config: FilterConfig;
  featuredCriteriaPath: string;
};

export type FilterCommandOptions = {
  threads: number;
  mode: string;
};

export type FilterAddons = {
  matchers?: unknown;
  [key: string]: unknown;
};
