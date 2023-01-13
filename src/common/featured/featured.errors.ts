export class PatternMatchError extends Error {
  constructor(value: string, pattern: string) {
    super(`The given value ${value} does not match the pattern ${pattern}`);
  }
}

export class MatcherNotFoundError extends Error {
  constructor(label: string) {
    super(`No match function assigned to the label: ${label}`);
  }
}

export class UnknownContentTypeError extends Error {
  constructor(type: string) {
    super(`Unknown type: ${type}`);
  }
}
