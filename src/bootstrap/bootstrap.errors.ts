/**
 * Represents an error when the start block is undefined.
 *
 * @class
 * @extends {Error}
 */
export class UndefinedStartBlockError extends Error {
  constructor() {
    super(`Undefined start block. `);
  }
}

/**
 * Represents an error when the end block is out of range.
 *
 * @class
 * @extends {Error}
 */
export class EndBlockOutOfRangeError extends Error {
  /**
   * Constructs a new EndBlockOutOfRangeError.
   *
   * @param {bigint} endBlock - The end block that is out of range
   * @param {bigint} lib - The last irreversible block number
   */
  constructor(endBlock: bigint, lib: bigint) {
    super(
      `End block (${endBlock.toString()}) out of range. A value greater than last irreversible block number (${lib.toString()})`
    );
  }
}

/**
 * Represents an error when the start block is higher than the end block.
 *
 * @class
 * @extends {Error}
 */
export class StartBlockHigherThanEndBlockError extends Error {
  /**
   * Constructs a new StartBlockHigherThanEndBlockError
   * @param {bigint} startBlock - The start block that is higher than the end block
   * @param {bigint} endBlock - The end block
   */
  constructor(startBlock: bigint, endBlock: bigint) {
    super(
      `Error in the given range (${startBlock.toString()}-${endBlock.toString()}), the startBlock cannot be greater than the endBlock`
    );
  }
}

/**
 * Represents an error when there are no ABIs stored in the database.
 *
 * @class
 * @extends {Error}
 */
export class NoAbisError extends Error {
  constructor() {
    super(`There are no ABIs stored in the database`);
  }
}
