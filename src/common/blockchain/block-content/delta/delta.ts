/* eslint-disable @typescript-eslint/no-empty-function */

import { DeltaDto, DeltaRowDto } from './delta.dtos';

export class DeltaRow {
  public static create(dto: DeltaRowDto): DeltaRow {
    const { present, data } = dto;
    return new DeltaRow(present, data);
  }

  private constructor(
    public readonly present: number,
    public readonly data: Uint8Array
  ) {}
}

export class Delta {
  public static create(type: string, dto: DeltaDto): Delta {
    const { name, rows } = dto;

    return new Delta(
      type,
      name,
      rows.map(dto => DeltaRow.create(dto))
    );
  }

  private constructor(
    public readonly type: string,
    public readonly name: string,
    public readonly rows: DeltaRow[]
  ) {}
}
