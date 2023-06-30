/**
 * Checks if a given contract and action represent the 'setabi' action of the 'eosio' contract.
 *
 * @param {string} contract The contract name.
 * @param {string} action The action name.
 * @returns {boolean} Returns `true` if the contract and action match the 'eosio' 'setabi' action; otherwise, returns `false`.
 */
export const isSetAbiAction = (contract: string, action: string) =>
  contract === 'eosio' && action === 'setabi';
