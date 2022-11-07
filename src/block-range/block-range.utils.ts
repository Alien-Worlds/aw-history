import { Serialize } from 'eosjs';
import { FeaturedTrace, FeaturedDelta } from './block-range.types';

export const extractAllocationFromDeltaRowData = (value: Uint8Array) => {
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
      if (/^(\*|[A-Za-z0-9_]*)$/g.test(entry)) {
        result.add(entry);
      }
    });
  }
  return result;
};

// transaction_trace_v0:action_trace_v0#contract:action&contract2:*
// transaction_trace_v0,transaction_trace_v1:action_trace_v0,action_trace_v1#contract:action&contract2:*|action_trace_v1#contract:action1,action2

export const parseToFeaturedTraces = (value: string): FeaturedTrace[] => {
  const set = new Set<FeaturedTrace>();

  value
    .replace(/\s/g, '')
    .split('|')
    .forEach(valueStr => {
      const [versionAndActionTracesVersionStr, contractsStr] = valueStr.split('#');
      const [version, actionTracesVersion] = versionAndActionTracesVersionStr.split(':');

      contractsStr.split('&').forEach(contractsAndActionsStr => {
        const [contractsStr, actionsStr] = contractsAndActionsStr.split(':');

        const contracts = new Set<string>();
        const actions = new Set<string>();
        extractValues(contractsStr).forEach(contract => contracts.add(contract));
        extractValues(actionsStr).forEach(action => actions.add(action));

        set.add({
          type: version,
          actionTracesVersion,
          contracts,
          actions,
        });
      });
    });

  return Array.from(set.values());
};

// table_delta_v0:contract_rows#code:scope:table&code:scope2:*|table_delta_v0:other_contract_rows#code:*

export const parseToFeaturedDeltas = (value: string): FeaturedDelta[] => {
  const set = new Set<FeaturedDelta>();

  value
    .replace(/\s/g, '')
    .split('|')
    .forEach(typeStr => {
      const [typeAndNameStr, contractStr] = typeStr.split('#');
      const [type, name] = typeAndNameStr.split(':');

      contractStr.split('&').forEach(contract => {
        const [codeStr, scopeStr, tableStr] = contract.split(':');

        const codes = new Set<string>();
        const scopes = new Set<string>();
        const tables = new Set<string>();

        extractValues(codeStr).forEach(code => codes.add(code));
        extractValues(scopeStr).forEach(scope => scopes.add(scope));
        extractValues(tableStr).forEach(table => tables.add(table));

        set.add({
          type,
          name,
          codes: new Set<string>(),
          scopes: new Set<string>(),
          tables: new Set<string>(),
        });
      });
    });

  return Array.from(set.values());
};
