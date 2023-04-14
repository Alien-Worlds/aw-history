import { log } from '@alien-worlds/api-core';
import { Serialize } from 'eosjs';
import { Mode } from '../common/common.enums';
import { BlockRangeTaskData } from '../common/common.types';
import { InternalBroadcastMessage } from '../internal-broadcast';

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

  try {
    sb.get(); // ?
    const code = sb.getName();
    const scope = sb.getName();
    const table = sb.getName();

    return { code, scope, table };
  } catch (error) {
    log(
      `Unable to extract data, most likely data cannot be deserialized using eosjs.Serialize or the contract does not contain tables. ${error.message}`
    );
    return null;
  }
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
