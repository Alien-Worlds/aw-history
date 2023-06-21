import { Result } from '@alien-worlds/api-core';

/**
 * An abstract class representing a Process dependencies.
 *
 * @abstract
 * @class Dependencies
 */
export abstract class Dependencies {
  /**
   * Initializes and configures the Dependencies instance.
   * @abstract
   * @returns {Promise<Result>} A promise that resolves when the initialization is complete.
   */
  public abstract initialize(...args: unknown[]): Promise<Result>;
}
