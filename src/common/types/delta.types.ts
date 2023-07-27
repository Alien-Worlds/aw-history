import { Row } from '@alien-worlds/aw-core';

export type Delta = {
  name?: string;
  rows?: Row[];
};

export type DeltaByName = [string, Delta];
