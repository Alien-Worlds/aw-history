import { FilterConfig, UnknownObject } from '@alien-worlds/history-tools-common';

export type FilterSharedData = {
  config: FilterConfig;
  featuredJson: UnknownObject;
};

export type FilterCommandOptions = {
  threads: number;
  mode: string;
};

export type FilterAddons = {
  matchers?: unknown;
  [key: string]: unknown;
};
