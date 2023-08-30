export class BlockReaderNotConnected extends Error {
  constructor() {
    super(`The block reader is not connected.`);
  }
}
