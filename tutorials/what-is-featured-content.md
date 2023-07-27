# What is "featured" content?

## Table of Contents

1. [Introduction](#introduction)
2. [JSON object construction](#json-object-construction)
3. [Using featured content in the project](#using-featured-content-in-the-project)
   - [Featured](#featured)
   - [FeaturedContracts](#featuredcontracts)

## Introduction

The history tools work by reading from the blockchain and providing guidelines to extract and process data as per requirements. This data extraction is facilitated through the use of a JSON object containing two tables: traces and deltas. This JSON object sets the criteria defining what action or table we are looking for and the processor to use to process the data contained in this action or delta.

Without this JSON configuration, only reading blocks will occur, and no data will be extracted from them. Thus, the correct configuration of this JSON object is crucial.

## JSON object construction

Below is an example of a JSON object configuration that we use in our history tools. It contains two tables: traces and deltas.

```json
{
  "traces": [
    {
      "shipTraceMessageName": ["transaction_trace_v0"], // Optional
      "shipActionTraceMessageName": ["action_trace_v0", "action_trace_v1"], // Optional
      "contract": ["dao.worlds"],
      "action": ["*"],
      "processor": "NotifyWorldTraceProcessor"
    }
  ],
  "deltas": [
    {
      "shipDeltaMessageName": ["table_delta_v0"], // Optional
      "name": ["contract_row"],
      "code": ["ref.worlds"],
      "scope": ["*"],
      "table": ["*"],
      "processor": "RefWorldsDeltaProcessor"
    }
  ]
}
```

In traces, you need to provide `contract`, `action`, and `processor`. They are arrays because if you want to use the same processor for several different actions or contracts, there's no need to create a new object for each one. Instead, you can enter the name of the contract or action in the table. The symbol "\*" stands for "all possible" options. Avoid using the wildcard in the contract name tables (`contract` and `code`) as this might result in too much unnecessary data being downloaded.

```json
// example of using one processor for all actions of the listed contracts
"contract": ["dao.worlds", "alien.worlds", "index.words"],
"action": ["*"],
"processor": "YourProcessorClassName",

// example of using one processor for selected contract actions
"contract": ["dao.worlds"],
"action": ["appointcust", "flagcandprof", "newperiod"],
"processor": "YourProcessorClassName",
```

The same rules apply to `deltas` where the `name` will always be "contract_row", followed by `code`, `scope`, and `table`.

In `traces` and `deltas`, optional keys: `shipTraceMessageName`, `shipActionTraceMessageName`, and `shipDeltaMessageName` are present. They are the names with versions of the structs containing data for transactions and deltas, respectively. If you use our **Starter Kit**, you don't need to provide these values in JSON because they will be added by featured scripts. However, remember about them if there's an update of one of the versions. Keep references to the previous ones (`v0` at the moment) to be able to read blocks generated before the API change.

## Using featured content in the project

### Featured

An instance of the `Featured` class represents a set of criteria contained in the JSON configuration. Two instances are created, one for `traces` and the other for `deltas`.

```typescript
const featuredTraces: Featured<ContractTraceMatchCriteria> = new Featured(
  featuredCriteria.traces,
  {
    shipTraceMessageName: [],
    shipActionTraceMessageName: [],
    contract: [],
    action: [],
  },
  {
    shipTraceMessageName: ['transaction_trace_v0'],
    shipActionTraceMessageName: ['action_trace_v0', 'action_trace_v1'],
  }
);

const featuredDeltas: Featured<ContractDeltaMatchCriteria> = new Featured(
  featuredCriteria.deltas,
  {
    shipDeltaMessageName: [],
    name: [],
    code: [],
    scope: [],
    table: [],
  },
  { shipDeltaMessageName: ['table_delta_v0'] }
);
```

The order of keys in the pattern is important. The processor tasks have `short_id` and `label` fields built from the values given in JSON objects.

```json
"short_id" : "notify.world:logmine",
"label" : "transaction_trace_v0:action_trace_v1:notify.world:logmine",

// corresponds to the values in the JSON object:
{
  "shipTraceMessageName": ["transaction_trace_v0"],
  "shipActionTraceMessageName": ["action_trace_v1"],
  "contract": ["notify.world"],
  "action": ["logmine"],
}
```

The `label` string is composed of names separated by ':' and the order corresponds to that defined in the pattern for featured traces.

_Note: The current solution may change as we are considering different alternatives._

### FeaturedContracts

The `FeaturedContracts` is a repository containing the contract data you put in the JSON file. The `FeaturedUtils.readFeaturedContracts` function can be used to extract the names of all contracts and retrieve their data via `SmartContractService`.

To create `FeaturedContracts`, you can use the `FeaturedContractsCreator` available in the [Starter Kit](https://github.com/Alien-Worlds/aw-history-starter-kit). If you want to use other sources and there is no suitable KIT for them, check the wizard implementation from the starter kit and implement it according to your needs.

### FeaturedUtils

FeaturedUtils includes some tools used inside other featured components or History Tools processes

- `readFeaturedContracts(data)`: Extracts contract names from the provided json object
- `fetchCriteria<CriteriaType>(filePath)`: Gets the criteria json object from the given local file or URL

