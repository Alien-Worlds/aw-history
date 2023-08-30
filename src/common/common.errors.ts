export class UnknownModeError extends Error {
  constructor(mode: string, modes: string[]) {
    super(`Unknown mode "${mode}". Use: ${modes.join(', ')}`);
  }
}
