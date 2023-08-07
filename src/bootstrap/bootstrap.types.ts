import { Mode } from "../common";

export type BootstrapCommandOptions = {
  scanKey: string;
  startBlock: string;
  endBlock: string;
  mode: Mode;
};

export type BlockRangeData = {
  startBlock?: bigint;
  endBlock?: bigint;
  mode: string;
  scanKey?: string;
};
