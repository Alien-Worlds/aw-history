/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FeaturedContractContent } from "../featured";

const externalTraceData = {
  shipTraceMessageName: ['external_foo_type'],
  shipActionTraceMessageName: ['external_foo_name'],
  contract: ['external_foo_contract'],
  action: ['external_foo_action'],
  processor: 'external_foo_processor',
}

export const matchers = {
  traces: new Map([
    [
      'external',
      async (data) => {
        const result = data['shipTraceMessageName'].includes('external_foo_type') && data['contract'].includes('external_foo_contract');
        return result;
      }
    ]
  ])
}

const config = {
  traces: [{
    shipTraceMessageName: ['foo_type'],
    shipActionTraceMessageName: ['foo_name'],
    contract: ['foo_contract', 'foo_contract_2'],
    action: ['foo_action'],
    processor: 'foo_processor'
  },{
    shipTraceMessageName: ['foo_2_type'],
    shipActionTraceMessageName: ['foo_2_name'],
    contract: ['*'],
    action: ['*'],
    processor: 'foo_2_processor'
  }, {
    matcher: 'external',
    processor: 'external_foo_processor'
  }],
  deltas: [{
    shipDeltaMessageName: ['bar_type'],
    name: ['bar_name'],
    code: ['bar_code'],
    scope: ['bar_scope'],
    table: ['bar_table'],
    processor: 'bar_processor'
  }],
}

describe('Featured Unit tests', () => {
  it('"getProcessor" should return processor path assigned to given label', async () => {
    const featured = new FeaturedContractContent(config as any, matchers);

    expect(await (<any>featured).traces.getProcessor('foo_type:foo_name:foo_contract:foo_action')).toEqual('foo_processor')
    expect(await (<any>featured).traces.getProcessor('foo_2_type:foo_2_name:foo_2_contract:*')).toEqual('foo_2_processor')
    expect(await (<any>featured).deltas.getProcessor('bar_type:bar_name:bar_code:bar_scope:bar_table')).toEqual('bar_processor')
    expect(await (<any>featured).deltas.getProcessor('bar_2_type:*')).toEqual('')
  });

  it('"has" should return a bool value depending on whether the given pattern matches or not', async () => {
    const featured = new FeaturedContractContent(config as any, matchers);

    expect(await (<any>featured).traces.has({ shipTraceMessageName: ['foo_type'], shipActionTraceMessageName: ['foo_name'], contract: ['foo_contract'], action: ['foo_action'] })).toEqual(true)
    expect(await (<any>featured).traces.has({ shipTraceMessageName: ['foo_2_type'], shipActionTraceMessageName: ['foo_2_name'] })).toEqual(true)
    expect(await (<any>featured).traces.has({ shipTraceMessageName: ['foo_type_3'], shipActionTraceMessageName: ['*'], contract: ['*'], action: ['foo_action'] })).toEqual(false)

    expect(await (<any>featured).deltas.has({ shipDeltaMessageName: ['bar_type'], name: ['bar_name'], code: ['bar_code'], scope: ['bar_scope'], table: ['bar_table'] })).toEqual(true)
    expect(await (<any>featured).deltas.has({ shipDeltaMessageName: ['bar_type'], name: ['bar_name'] })).toEqual(true)
    expect(await (<any>featured).deltas.has({ shipDeltaMessageName: ['bar_type_3'], name: ['*'] })).toEqual(false)

    expect(await (<any>featured).traces.has({
      shipTraceMessageName: ['external_foo_type'],
      shipActionTraceMessageName: ['external_foo_name'],
      contract: ['external_foo_contract'],
      action: ['external_foo_action']
    })).toEqual(true)
    
    expect(await (<any>featured).traces.has({
      shipTraceMessageName: ['external_foo_type_UNKNOWN'],
      shipActionTraceMessageName: ['external_foo_name_UNKNOWN'],
      contract: ['external_foo_contract_UNKNOWN'],
      action: ['external_foo_action_UNKNOWN']
    })).toEqual(false)
  });

  it('"get" should return an allocation object when given pattern matches', async () => {
    const featured = new FeaturedContractContent(config as any, matchers);

    expect(await (<any>featured).traces.get({ shipTraceMessageName: ['foo_type'], shipActionTraceMessageName: ['foo_name'], contract: ['foo_contract'], action: ['foo_action'] })).toEqual([config.traces[0]])
    expect(await (<any>featured).traces.get({ shipTraceMessageName: ['foo_type_3'], shipActionTraceMessageName: ['*'], contract: ['*'], action: ['foo_action'] })).toEqual([])

    expect(await (<any>featured).deltas.get({ shipDeltaMessageName: ['bar_type'], name: ['bar_name'], code: ['bar_code'], scope: ['bar_scope'], table: ['bar_table'] })).toEqual(config.deltas)
    expect(await (<any>featured).deltas.get({ shipDeltaMessageName: ['bar_type_3'], name: ['*'] })).toEqual([])
    
    expect(await (<any>featured).traces.get({
      shipTraceMessageName: ['external_foo_type'],
      shipActionTraceMessageName: ['external_foo_name'],
      contract: ['external_foo_contract'],
      action: ['external_foo_action']
    })).toEqual([externalTraceData]);

    expect(await (<any>featured).traces.get({
      shipTraceMessageName: ['external_foo_type_UNKNOWN'],
      shipActionTraceMessageName: ['external_foo_name_UNKNOWN'],
      contract: ['external_foo_contract_UNKNOWN'],
      action: ['external_foo_action_UNKNOWN']
    })).toEqual([])
  });

});
