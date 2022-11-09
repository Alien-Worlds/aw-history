export class BlockNumberOutOfRangeError extends Error {
  constructor(public readonly blockNumber: bigint, public readonly scanKey: string) {
    super(
      `Block number ${blockNumber} is out of range or is assigned to a different key than "${scanKey}"`
    );
  }
}

export class NoBlockRangeFoundError extends Error {
  public static Token = 'NO_BLOCK_RANGE_FOUND_ERROR';
  constructor(public readonly scanKey: string) {
    super(`No block range was found for the key "${scanKey}"`);
    this.name = NoBlockRangeFoundError.Token;
  }
}

export class DuplicateBlockRangeScanError extends Error {
  public static Token = 'DUPLICATE_BLOCK_RANGE_SCAN_ERROR';

  constructor(scanKey: string, start: bigint, end: bigint) {
    super(
      `Canceling a scan. There is already a block range (${start}-${end}) scan entry in the database with the selected key "${scanKey}". Please select a new unique key.`
    );
    this.name = DuplicateBlockRangeScanError.Token;
  }
}
