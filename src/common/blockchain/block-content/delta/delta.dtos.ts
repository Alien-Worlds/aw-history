export type DeltaRowDto = {
  present?: number;
  data?: Uint8Array;
};

export type DeltaDto = {
  name?: string;
  rows?: DeltaRowDto[];
};

export type DeltaByNameDto = [string, DeltaDto];

export type DeltaRowModel = {
  present?: number;
  data?: Uint8Array;
};

export type DeltaModel = {
  shipDeltaMessageName?: string;
  name?: string;
  rows?: DeltaRowModel[];
};
