export class UndefinedPointerError extends Error {
  constructor() {
    super(
      `Undefined pointer. The worker loader does not know which Worker class to initialize. If you use only one class, override your worker loader's "load" method so that it returns instance of your worker instead of calling super.load()`
    );
  }
}
