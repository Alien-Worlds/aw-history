# Extending History Tools

In this tutorial, we'll briefly go over how to extend the history tools and possibly change the resources. Such a situation may occur when the basic construction of the tools does not meet all expectations. in our case, this happened when creating the leaderboard api. We could rely on the available architecture and put all the work of updating the leaderboards in processors, but we wanted to separate this process from others and leave the standard processes (boot, filter, reader, processor) unchanged. We needed another process whose task would be to update the leaderboard database and which would be able to scale properly to increase work efficiency. We called the new process writer and its role is to download records in the leaderboard_updates collection and create updates in the target leaderboar collections (of which we have several). On this own example, we will describe ways to extend the capabilities of history tools.

First, decide how you want to extend the tools. You can download the history-tools repository and add your own implementations of components responsible for communication with the blockchain and the database. The second method is to create a new repository and import history tools along with [Starter Kit](https://github.com/Alien-Worlds/history-tools-starter-kit). Since we will continue to use mongodb and eos we will choose second option.


[Back to Readme](../README.md)

# Table of Contents

- [Extending History Tools](#extending-history-tools)
  - [1. Project Preparation](#1-project-preparation)
  - [2. Creating a List of Contracts](#2-creating-a-list-of-contracts)
  - [Step 3: Create additional processes](#step-3-create-additional-processes)
    - [3.1 Starter](#31-starter)
    - [3.2 Worker](#32-worker)
    - [3.3 WorkerLoader](#33-workerloader)
    - [3.4 WorkerLoaderDependencies](#34-workerloaderdependencies)
  - [Step 4: Create Processes](#step-4-create-processes)
    - [4.1 Bootstrap](#41-bootstrap)
    - [4.2 Broadcasting](#42-broadcasting)
    - [4.3 Reader](#43-reader)
    - [4.4 Filter](#44-filter)
    - [4.5 Processor](#45-processor)
  - [Step 5: Create necessary processors](#step-5-create-necessary-processors)
- [Using other resources](#using-other-resources)

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
    "writer": "node build/writer/index.js",
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

Note that in `sripts` we have a new `writer` process which is located in a separate directory like the others.

### 2. Creating a List of Contracts

Now you need to define what data you want to download from the blockchain. In our case, this will be the `logmine` action from the `notify.world` contract:

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
  "deltas": []
}
```

## Step 3: Create additional processes

Knowing what we will be listening to and what data we want to download from the blockchain, we need to implement additional processes from scratch. In our case, it will be one whose task is to download data, update the leaderboard and save changes to the appropriate collection.

#### 3.1 Starter

Let's start with the startup file, just like the rest of the processes, it should create the config based on given options or enviroment variables, pass the necessary dependencies and run the program.

```typescript
export const startWriter = (args: string[]) => {
  const vars = new ConfigVars();
  const options = bootstrapCommand.parse(args).opts<BootstrapCommandOptions>();
  const config: LeaderboardWriterConfig = buildWriterConfig(vars, options); // you should implement your config builder
  
  const workerPool = await WorkerPool.create({
    ...config.workers,
    sharedData: { config },
    workerLoaderPath: `${__dirname}/leaderboard.worker-loader`,
    workerLoaderDependenciesPath: `${__dirname}/leaderboard.worker-loader.dependencies`,
  });

  ...

  const writer = await LeaderboardWriter.create(config, workerPool);
  writer.next();
}
```

If you want to use workers in your process, like we do in leaderboard writer, you need to add three more worker files, worker loader and dependencies worker loader.

#### 3.2 Worker

The worker is launched from the workerPool which you can implement directly in the starter or a separate class. In the Worker class, you need to implement all the worker logic in the body of the `run` method and finally call the `resolve` or `reject` method so as not to block the `workerPool`. Don't forget to override the standard constructor to have access to the `dependencies` provided by the loader.

```typescript
export default class LeaderboardWorker extends Worker<LeaderboardSharedData> {
  constructor(
    protected dependencies: {
      updatesRepository: LeaderboardUpdateRepository;
      updateLeaderboardUseCase: UpdateLeaderboardUseCase;
    },
    protected sharedData: LeaderboardSharedData
    ) {
    super();
  }

  public async run(): Promise<void> {
    const { dependencies: { updatesRepository, updateLeaderboardUseCase } } = this;
    try {
      ... update leaerboards logic

      this.resolve();
    } catch (error) {
      this.reject(error);
    }
  }
}
```

#### 3.3 WorkerLoader

As you know, the worker loader is used to create a worker instance and initialize and transfer the dependencies needed by the worker. The `setup` method should be overridden as in the example below if you have dependencies and you need to pass arguments to the `initialize` method (in our case this is the config object). Another reason may also be the need to perform additional settings, e.g. adding event listeners to the created dependencies. In the `load` method, we create instances of our worker and pass the created `dependencies`.

```typescript
export default class LeaderboardWorkerLoader extends DefaultWorkerLoader<
LeaderboardSharedData,
LeaderboardWorkerLoaderDependencies
> {
  public async setup(sharedData: LeaderboardSharedData): Promise<void> {
    const { config } = sharedData;
    await super.setup(sharedData, config); // initialize dependencies
    ... additional work eg. event listeners
  }

  public async load(): Promise<Worker> {
    const { dependencies, sharedData } = this;
    return new LeaderboardWorker(dependencies, sharedData);
  }
}
```

#### 3.4 WorkerLoaderDependencies

At this point, the matter is simple, you need to implement all necessary depenedencies. To do this, add the appropriate code in the initialize method, which will be called in the setup worker loader method.

```typescript
export class LeaderboardWorkerLoaderDependencies extends WorkerLoaderDependencies {
  public updatesRepository: LeaderboardUpdateRepository;
  public updateLeaderboardUseCase: UpdateLeaderboardUseCase;

  public async initialize(config: LeaderboardConfig): Promise<void> {
    ... initialize all dependencies
  }
}
```
Remember that when creating a `workerPool` you will have to give paths to the worker loader and its dependencies.

## Step 4: Create Processes

Next, create a folder for each history tools process (`broadcast`, `bootstrap`, `filter`, `reader`, `processor`). Each of these should have an `index.ts` file within.

#### 4.1 Bootstrap

In the `bootstrap` directory, create an `index.ts` file and add the following content:

```typescript
import {
  startBootstrap,
  DefaultBootstrapDependencies,
} from '@alien-worlds/history-tools-starter-kit';
import path from 'path';

startBootstrap(
  process.argv,
  new DefaultBootstrapDependencies(),
  path.join(__dirname, '../../your.featured.json')
);
```

#### 4.2 Broadcasting

In the `broadcast` directory, create an `index.ts` file and add the following content:

```typescript
import { startBroadcast } from '@alien-worlds/history-tools-starter-kit';

startBroadcast();
```

#### 4.3 Reader

In the `reader` directory, create an `index.ts` file and add the following content:

```typescript
import {
  startReader,
  DefaultReaderDependencies,
} from '@alien-worlds/history-tools-starter-kit';

startReader(process.argv, new DefaultReaderDependencies());
```

#### 4.4 Filter

In the `filter` directory, create an `index.ts` file and add the following content:

```typescript
import {
  startFilter,
  DefaultFilterDependencies,
} from '@alien-worlds/history-tools-starter-kit';
import path from 'path';

startFilter(
  process.argv,
  new DefaultFilterDependencies(),
  path.join(__dirname, '../../your.featured.json')
);
```

#### 4.5 Processor

In the `processor` directory, create an `index.ts` file and add the following content:

```typescript
import {
  startProcessor,
  DefaultProcessorDependencies,
} from '@alien-worlds/history-tools-starter-kit';
import path from 'path';

startProcessor(
  process.argv,
  new DefaultProcessorDependencies(),
  path.join(__dirname, './processors'),
  path.join(__dirname, '../../your.featured.json')
);
```

## Step 5: Create necessary processors

Finally, create a `processors` folder where you will store all of the processor files. 
To ensure that `ProcessorWorkerLoader` will create insance of the processor, you have to make sure that processor classes are **exported individually** in the 'processors' folder and not as default exports, follow these instructions:

1. Create the 'processors' folder in your processor directory if it doesn't exist already.

2. Inside the 'processors' folder, create a separate TypeScript file for each class you want to export. For example, Processor1.ts, Processor2.ts, etc.

3. In each class file (e.g., Processor1.ts, Processor2.ts, etc.), define your classes using the `export` keyword. Each class should have its own file.

Example:

```typescript
// ./processors/index.ts
export { NotifyWorldTraceProcessor } from './notify-world.trace-processor';

...

// ./processors/notify-world.trace-processor.ts
import { ActionTraceProcessor, ProcessorTaskModel } from '@alien-worlds/history-tools-starter-kit';

export class NotifyWorldTraceProcessor extends ActionTraceProcessor {
  public async run(model: ProcessorTaskModel): Promise<void> {
    try {
      if (name === NotifyWorldActionName.Logmine) {
          const update = LeaderboardUpdate.fromLogmineJson(
          blockNumber,
          blockTimestamp,
          <NotifyWorldContract.Actions.Types.LogmineStruct>data,
          tlmDecimalPrecision
          );

          const json = update.toJson();

          ...

          const updateResult = await leaderboardUpdates.add(LeaderboardUpdate.fromJson(json));
        }
      }

      this.resolve();
    } catch (error) {
      this.reject(error);
    }
  }
}
```

That's it, the examples shown are of course partial but you should get a general idea of what to do if you want to extend History Tools by adding more processes.

## Using other resources

If, apart from simply adding new processes or modifying existing ones, you want to use another database (replacing the default mongodb) or another blockchain (reading tools). You should check [Starter Kit](https://github.com/Alien-Worlds/history-tools-starter-kit) implementation and write your own based on all interfaces used in [Api Core](https://github.com/Alien-Worlds/api-core), **History Tools**. Check the contents of this package and replace e.g. all mongo.\* components with your own. Theoretically, if you follow the interface guidelines, everything should work fine, including serialization and block reader. The **kit** prepared in this way should be imported into your history tools implementation and then follow the guidelines mentioned above.

Remember, if your **kit** works and meets all requirements, it's worth thinking about sharing it with other users. More _starter-kit_ type repositories may be useful and maybe more users will benefit from your work. Good luck!
