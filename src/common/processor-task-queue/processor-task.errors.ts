export class UnknownProcessorTypeError extends Error {
  constructor(type: string) {
    super(`Unknown processor type: ${type}`);
  }
}
