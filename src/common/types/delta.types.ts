export type DeltaRow = {
  present?: number;
  data?: Uint8Array;
};

export type Delta = {
  name?: string;
  rows?: DeltaRow[];
};

export type DeltaByName = [string, Delta];
