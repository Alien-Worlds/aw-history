/**
 * Represents an abstract class for deserializing ABIs (Application Binary Interfaces) related to actions and tables.
 * @template T
 */
export abstract class AbisSerializer<T = unknown> {
  /**
   * Deserializes the action data for a specific account and action.
   *
   * @param {string} account - The account associated with the action.
   * @param {string} action - The action name.
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string} hex - The hexadecimal representation of the data.
   * @returns {T} The deserialized action data.
   */
  public abstract deserializeAction(
    account: string,
    action: string,
    data: Uint8Array,
    hex: string
  ): T;

  /**
   * Deserializes the table data for a specific account and table.
   *
   * @param {string} account - The account associated with the table.
   * @param {string} table - The table name.
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string} hex - The hexadecimal representation of the data.
   * @returns {T} The deserialized table data.
   */
  public abstract deserializeTable(
    account: string,
    table: string,
    data: Uint8Array,
    hex: string
  ): T;
}
