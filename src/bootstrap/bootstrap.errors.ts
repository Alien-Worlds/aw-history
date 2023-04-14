export class UndefinedStartBlockError extends Error {
  constructor() {
    super(`Undefined start block. `);
  }
}

export class EndBlockOutOfRangeError extends Error {
  constructor(endBlock: bigint, lib: bigint) {
    super(
      `End block (${endBlock.toString()}) out of range. A value greater than last irreversible block number (${lib.toString()})`
    );
  }
}

export class StartBlockHigherThanEndBlockError extends Error {
  constructor(startBlock: bigint, endBlock: bigint) {
    super(
      `Error in the given range (${startBlock.toString()}-${endBlock.toString()}), the startBlock cannot be greater than the endBlock`
    );
  }
}

export class NoAbisError extends Error {
  constructor() {
    super(`There are no ABIs stored in the database`);
  }
}
