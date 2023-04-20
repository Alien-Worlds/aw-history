export class BlockNotFoundError extends Error {}
export class DuplicateBlocksError extends Error {
  constructor() {
    super(`Some blocks in the specified range are already in the database.`);
    this.name = 'DuplicateBlocksError';
  }
}
