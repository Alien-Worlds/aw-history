export class AbisServiceNotSetError extends Error {
  constructor() {
    super(
      `AbisService not found. run "setupAbis" with the service config and featured values.`
    );
  }
}
