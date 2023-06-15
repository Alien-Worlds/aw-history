import { DeltaJson, DeltaRowDto } from './delta.dtos';

/**
 * Represents a row in a delta.
 * @class
 */
export class DeltaRow {
  /**
   * Creates a DeltaRow instance based on the provided json.
   *
   * @param {DeltaRowDto} json - The json containing the delta row information.
   * @returns {DeltaRow} The created DeltaRow instance.
   */
  public static create(json: DeltaRowDto): DeltaRow {
    const { present, data } = json;
    return new DeltaRow(present, data);
  }

  /**
   * Creates an instance of DeltaRow.
   *
   * @param {number} present - The present state of the delta row.
   * @param {Uint8Array} data - The data associated with the delta row.
   */
  private constructor(
    public readonly present: number,
    public readonly data: Uint8Array
  ) {}
}

/**
 * Represents a delta.
 * @class
 */
export class Delta {
  /**
   * Creates a Delta instance based on the provided json.
   *
   * @param {string} shipMessageName - The name of the ship message.
   * @param {DeltaJson} json - The json containing the delta information.
   * @returns {Delta} The created Delta instance.
   */
  public static create(shipMessageName: string, json: DeltaJson): Delta {
    const { name, rows } = json;

    return new Delta(
      shipMessageName,
      name,
      rows.map(dto => DeltaRow.create(dto))
    );
  }

  /**
   * Creates an instance of Delta.
   *
   * @param {string} shipDeltaMessageName - The name of the ship delta message.
   * @param {string} name - The name of the delta.
   * @param {DeltaRow[]} rows - The rows of the delta.
   */
  constructor(
    public readonly shipDeltaMessageName: string,
    public readonly name: string,
    public readonly rows: DeltaRow[]
  ) {}
}
