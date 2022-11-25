import { ProcessorConfig } from "../../processor.config";

export type SetAbiData = {
  account: string;
  abi: string;
};

export type SetAbiSharedData = {
  config: ProcessorConfig;
};
