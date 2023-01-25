/**
 * Suspends execution of the current process for a given number of milliseconds
 * @async
 * @param {number} ms
 * @returns {Promise}
 */
export const wait = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isSetAbiAction = (contract: string, action: string) =>
  contract === 'eosio' && action === 'setabi';

export const isDuplicated = () => 'E11000 duplicate key error collection'