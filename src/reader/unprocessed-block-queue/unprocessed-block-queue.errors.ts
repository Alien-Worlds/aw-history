export class BlockNotFoundError extends Error {}
export class DuplicateBlocksError extends Error {
  constructor() {
    super(`Blocks in the specified range are already in the database.`);
    this.name = 'DuplicateBlocksError';
  }
}
