export class AbisServiceNotSetError extends Error {
  constructor() {
    super(
      `AbisService not found. run "setupAbis" with the service config and featured values.`
    );
  }
}

export class AbiNotFoundError extends Error {
  constructor() {
    super(`ABI data not found`);
  }
}
