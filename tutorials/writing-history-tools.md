# Writing your own History Tools

This tutorial provides a comprehensive guide to building your own Alien Worlds History Tools, a set of utilities for downloading and processing data from the blockchain. The History Tools are divided into several packages, making it modular and independent from third-party resources.

[Back to Readme](../README.md)

## Table of Contents

1. [Project Preparation](#project-preparation)
2. [Creating a List of Contracts](#creating-a-list-of-contracts)
3. [Process Implementation](#process-implementation)
   - [Bootstraps](#bootstraps)
   - [Broadcasting](#broadcasting)
   - [Reader](#reader)
   - [Filter](#filter)
   - [Processor](#processor)
4. [Creating Processors](#creating-processors)

### 1. Project Preparation

The first step to create history tools is to set up a new project and import the necessary dependencies.

Your `package.json` file should look similar to this:

```json
{
  "name": "your-history-tools",
  "version": "0.0.1",
  "description": "your-description",
  "packageManager": "yarn@3.2.3",
  "main": "build/index.js",
  "types": "build/index.d.ts",
  "scripts": {
    "broadcast": "node build/broadcast/index.js",
    "boot": "node build/bootstrap/index.js",
    "reader": "node build/reader/index.js",
    "filter": "node build/filter/index.js",
    "processor": "node build/processor/index.js",
    ...
  },
  ...
  "dependencies": {
    "@alien-worlds/api-history-tools": "^0.0.136",
    "@alien-worlds/history-tools-default-dependencies": "^0.0.27",
    ... all your contract packages and other typescript dependencies
  }
}
```

After setting up your `package.json`, define all necessary configuration variables, preferably in an `.env` file. For instructions to complete the `.env` file, see [./envs.md](./envs.md).

Next, create a new `src` directory and within it, create `bootstrap`, `broadcast`, `filter`, `reader` and `processor` directories.

### 2. Creating a List of Contracts

Now you need to define what data you want to download from the blockchain. You can achieve this by creating a separate json file containing the configuration. This json file schema is as follows:

```json
{
  "traces": [
    {
      "shipTraceMessageName": ["transaction_trace_v0"],
      "shipActionTraceMessageName": ["action_trace_v0", "action_trace_v1"],
      "contract": ["dao.worlds"],
      "action": ["*"],
      "processor": "DaoWorldsTraceProcessor"
    }
  ],
  "deltas": [
    {
      "shipDeltaMessageName": ["table_delta_v0"],
      "name": ["contract_row"],
      "code": ["dao.worlds"],
      "scope": ["*"],
      "table": ["*"],
      "processor": "DaoWorldsDeltaProcessor"
    }
  ]
}

// or shorter version
{
  "traces": [
    {
      "contract": ["dao.worlds"],
      "action": ["*"],
      "processor": "DaoWorldsTraceProcessor"
    }
  ],
  "deltas": [
    {
      "code": ["dao.worlds"],
      "scope": ["*"],
      "table": ["*"],
      "processor": "DaoWorldsDeltaProcessor"
    }
  ]
}
```

Here, you can specify many values in the arrays. For example, if you are only interested in specific actions for the `dao.worlds` contract, you can write them, e.g., ["appointcust", "nominate", "firecust"], instead of '*' (get all). This way, you can limit the work of the processor to only the data that interests you. The same applies for deltas.

### 3. Process Implementation

Having defined what data you're interested in, the next step is to create processes that will handle the work.

#### 3.1 Bootstraps

In the `bootstrap`

directory, create an `index.ts` file and add the following content:

```typescript
import { startBootstrap } from '@alien-worlds/api-history-tools';
import { DefaultBootstrapDependencies } from '@alien-worlds/history-tools-default-dependencies';
import path from 'path';

startBootstrap(
  process.argv,
  new DefaultBootstrapDependencies(),
  path.join(__dirname, '../../your.featured.json')
);
```

#### 3.2 Broadcasting

In the `broadcast` directory, create an `index.ts` file and add the following content:

```typescript
import { startBroadcast } from '@alien-worlds/api-history-tools';

startBroadcast();
```

#### 3.3 Reader

In the `reader` directory, create an `index.ts` file and add the following content:

```typescript
import { startReader } from '@alien-worlds/api-history-tools';
import { DefaultReaderDependencies } from '@alien-worlds/history-tools-default-dependencies';

startReader(process.argv, new DefaultReaderDependencies());
```

#### 3.4 Filter

In the `filter` directory, create an `index.ts` file and add the following content:

```typescript
import { startFilter } from '@alien-worlds/api-history-tools';
import { DefaultFilterDependencies } from '@alien-worlds/history-tools-default-dependencies';
import path from 'path';

startFilter(
  process.argv,
  new DefaultFilterDependencies(),
  path.join(__dirname, '../../your.featured.json')
);
```

#### 3.5 Processor

In the `processor` directory, create an `index.ts` file and add the following content:

```typescript
import { startProcessor } from '@alien-worlds/api-history-tools';
import { DefaultProcessorDependencies } from '@alien-worlds/history-tools-default-dependencies';
import path from 'path';

startProcessor(
  process.argv,
  new DefaultProcessorDependencies(),
  path.join(__dirname, './processors'),
  path.join(__dirname, '../../your.featured.json')
);
```

### 4. Creating Processors

You also need to specify the Processor class that is to be started when the data is read. This is done in the json file you created in Step 2.

Here is an example:

```json
"processor": "DaoWorldsDeltaProcessor"
```

Now, create this class and save it where the worker loader processor can find and instantiate it. In the `processors` directory, create an `index.ts` file and export all processors contained in the directory.

```typescript
// ./processors/index.ts
export * from './dao-worlds.trace-processor';
export * from './dao-worlds.delta-processor';
...

// ./processors/dao-worlds.trace-processor.ts
import { ActionTraceProcessor } from '@alien-worlds/api-history-tools';

export class DaoWorldsTraceProcessor extends ActionTraceProcessor {
  public async run(model: ProcessorTaskModel): Promise<void> {
    try {
      //... all of your operations
      this.resolve();
    } catch (error) {
      this.reject(error);
    }
  }
}

// ./processors/dao-worlds.delta-processor.ts
import { DeltaProcessor } from '@alien-worlds/api-history-tools';

export class DaoWorldsDeltaProcessor extends DeltaProcessor {
  public async run(model: ProcessorTaskModel): Promise<void> {
    try {
      //... all of your operations
      this.resolve();
    } catch (error) {
      this.reject

(error);
    }
  }
}
```

With these steps completed, you now have all the necessary components to run your history tools locally or via Docker. Please keep in mind that the project is constantly being updated and some elements may change over time.
