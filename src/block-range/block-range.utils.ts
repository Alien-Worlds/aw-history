import { Serialize } from 'eosjs';

type DeltaAllocation = {
  code: string;
  scope: string;
  table: string;
};

export const extractAllocationFromDeltaRow = (value: Uint8Array): DeltaAllocation => {
  const sb = new Serialize.SerialBuffer({
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
    array: value,
  });

  sb.get(); // ?
  const code = sb.getName();
  const scope = sb.getName();
  const table = sb.getName();

  return { code, scope, table };
};

export const extractValues = (value: string): Set<string> => {
  const result = new Set<string>();
  if (!value || value.includes('*')) {
    result.add('*');
  } else {
    value.split(',').forEach(entry => {
      if (/^(\*|[A-Za-z0-9_.]*)$/g.test(entry)) {
        result.add(entry);
      }
    });
  }
  return result;
};
