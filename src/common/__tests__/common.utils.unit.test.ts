import { isSetAbiAction } from '../common.utils';

describe('isSetAbiAction', () => {
  it('should return true for eosio setabi action', () => {
    const result = isSetAbiAction('eosio', 'setabi');
    expect(result).toBe(true);
  });

  it('should return false for other contract or action', () => {
    const result = isSetAbiAction('eosio', 'otherAction');
    expect(result).toBe(false);
  });

  it('should return false for other contract and setabi action', () => {
    const result = isSetAbiAction('otherContract', 'setabi');
    expect(result).toBe(false);
  });

  it('should return false for other contract and action', () => {
    const result = isSetAbiAction('otherContract', 'otherAction');
    expect(result).toBe(false);
  });
});
