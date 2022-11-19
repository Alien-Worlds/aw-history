/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FeaturedContent } from "../featured";

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
    const featured = new FeaturedContent(config);

    expect(featured.traces.getProcessor('foo_type:foo_name:foo_contract:foo_action')).toEqual('foo_processor')
    expect(featured.traces.getProcessor('foo_2_type:foo_2_name:foo_2_contract:*')).toEqual('foo_2_processor')
    expect(featured.deltas.getProcessor('bar_type:bar_name:bar_code:bar_scope:bar_table')).toEqual('bar_processor')
    expect(featured.deltas.getProcessor('bar_2_type:*')).toEqual('')
  });

  it('"has" should return a bool value depending on whether the given pattern matches or not', async () => {
    const featured = new FeaturedContent(config);

    expect(featured.traces.has({ shipTraceMessageName: ['foo_type'], shipActionTraceMessageName: ['foo_name'], contract: ['foo_contract'], action: ['foo_action'] })).toEqual(true)
    expect(featured.traces.has({ shipTraceMessageName: ['foo_2_type'], shipActionTraceMessageName: ['foo_2_name'] })).toEqual(true)
    expect(featured.traces.has({ shipTraceMessageName: ['foo_type_3'], shipActionTraceMessageName: ['*'], contract: ['*'], action: ['foo_action'] })).toEqual(false)

    expect(featured.deltas.has({ shipDeltaMessageName: ['bar_type'], name: ['bar_name'], code: ['bar_code'], scope: ['bar_scope'], table: ['bar_table'] })).toEqual(true)
    expect(featured.deltas.has({ shipDeltaMessageName: ['bar_type'], name: ['bar_name'] })).toEqual(true)
    expect(featured.deltas.has({ shipDeltaMessageName: ['bar_type_3'], name: ['*'] })).toEqual(false)
  });

  it('"get" should return an allocation object when given pattern matches', async () => {
    const featured = new FeaturedContent(config);

    expect(featured.traces.get({ shipTraceMessageName: ['foo_type'], shipActionTraceMessageName: ['foo_name'], contract: ['foo_contract'], action: ['foo_action'] })).toEqual([config.traces[0]])
    expect(featured.traces.get({ shipTraceMessageName: ['foo_type_3'], shipActionTraceMessageName: ['*'], contract: ['*'], action: ['foo_action'] })).toEqual([])

    expect(featured.deltas.get({ shipDeltaMessageName: ['bar_type'], name: ['bar_name'], code: ['bar_code'], scope: ['bar_scope'], table: ['bar_table'] })).toEqual(config.deltas)
    expect(featured.deltas.get({ shipDeltaMessageName: ['bar_type_3'], name: ['*'] })).toEqual([])
  });
});
