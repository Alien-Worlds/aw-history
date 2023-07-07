import { Row } from "@alien-worlds/api-core";

export type Delta = {
  name?: string;
  rows?: Row[];
};

export type DeltaByName = [string, Delta];
