export class BlockNotFoundError extends Error {}
export class DuplicateBlocksError extends Error {
  constructor() {
    super(`Some blocks in the specified range are already in the database.`);
    this.name = 'DuplicateBlocksError';
  }
}

export class UnprocessedBlocksOverloadError extends Error {
  constructor(min: bigint, max: bigint) {
    super(`Blocks ${min}-${max} were read before the overload occurred.`);
    this.name = 'UnprocessedBlocksOverloadError';
  }
}
