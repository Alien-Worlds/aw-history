export type DeltaRowDto = {
  present?: number;
  data?: Uint8Array;
};

export type DeltaJson = {
  name?: string;
  rows?: DeltaRowDto[];
};

export type DeltaByNameDto = [string, DeltaJson];

export type DeltaRowModel = {
  present?: number;
  data?: Uint8Array;
};

export type DeltaModel = {
  shipDeltaMessageName?: string;
  name?: string;
  rows?: DeltaRowModel[];
};
