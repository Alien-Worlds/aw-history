export class UnknownModeError extends Error {
  constructor(mode: string) {
    super(`Unknown mode "${mode}"`);
  }
}
