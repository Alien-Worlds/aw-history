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

export class UndefinedPatternError extends Error {
  constructor() {
    super(`No pattern assigned to the criteria`);
  }
}

export class PatternMismatchError extends Error {
  constructor() {
    super(
      `The length of the keys on the label does not match the number of keys in the pattern`
    );
  }
}

export class UnknownContentTypeError extends Error {
  constructor(type: string) {
    super(`Unknown type: ${type}`);
  }
}

export class MissingCriteriaError extends Error {
  constructor(path: string) {
    super(`No criteria found at: ${path}`);
  }
}

export class DefaultsMismatchError extends Error {
  constructor() {
    super(`Defaults keys do not match pattern keys.`);
  }
}
