export type ProcessorTaskQueueConfig = {
  useSession?: boolean;
  interval?: number;
  readConcern?: string;
  writeConcern?: string;
  readPreference?: string;
};
