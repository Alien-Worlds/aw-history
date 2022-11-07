export type DeltaRowDto = {
  present: number;
  data: Uint8Array;
};

export type DeltaDto = {
  name: string;
  rows: DeltaRowDto[];
};

export type DeltaByNameDto = [string, DeltaDto];
