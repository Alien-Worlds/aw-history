# History Tools

This project is part of the Alien Worlds open source initiative, offering a set of tools and processes for downloading and processing blockchain data (transactions and deltas). It is designed to operate in two modes: default (live) and replay. The default mode continuously downloads current block data, while replay mode is designed for data retrieval from a specific range of blocks.

This package encapsulates the core mechanism, however, complete functionality requires packages that contain implementations of common components and third-party elements.

## Dependencies

- [@alien-worlds/api-core](https://github.com/Alien-Worlds/api-core)
- [@alien-worlds/block-reader](https://github.com/Alien-Worlds/block-reader)
- [@alien-worlds/broadcast](https://github.com/Alien-Worlds/broadcast)
- [@alien-worlds/workers](https://github.com/Alien-Worlds/workers)
- [async](https://github.com/caolan/async)
- [commander](https://github.com/tj/commander.js)
- [express](https://github.com/expressjs/express)


## Table of Contents

- [Installation](#installation)
- [Processes](#processes)
  - [API](#api)
  - [Broadcasting](#broadcasting)
  - [Bootstrap](#bootstrap)
  - [Reader](#reader)
  - [Filter](#filter)
  - [Processor](#processor)
- [Common components](#common-components)
  - [Abis](#abis)
  - [BlockRangeScanner](#blockrangescanner)
  - [BlockState](#blockstate)
  - [Featured](#featured)
  - [ProcessorTaskQueue](#processortaskqueue)
  - [UnprocessedBlockQueue](#unprocessedblockqueue)
- [Additional Tools](#additional-tools)
  - [Config](#config)
- [Tutorials](#tutorials)
- [Contributing](#contributing)
- [License](#license)

## Installation

To add History Tools to your project, use the following command with your favorite package manager:

```bash
yarn add @alien-worlds/api-history-tools

```

## Processes

All processes utilize the commander, enabling specific value assignments for individual options or the use of environment variables.

### API

The API process, currently under development, is intended to provide easy access to downloaded data. This Express.js-based API allows viewing of blockchain data, offering endpoints to retrieve block-specific data, transactions, tables, or data from a specific range according to selected criteria. The API is read-only, it doesn't contain methods that modify the content.

### Broadcasting

The broadcasting process creates a server for communication between processes, leveraging the @alien-worlds/broadcast module. Processes inform each other about their state, enabling efficient work coordination. The server facilitates the dispatch of messages defining tasks and states, improving performance when processing a high volume of blockchain data.

### Bootstrap

The bootstrap process prepares input data according to provided guidelines and dispatches tasks to other processes using broadcasting, thereby initiating the blockchain data download.

### Reader

The Reader process downloads blocks in their undecrypted form based on the given operating mode (live/replay) and block interval. The primary function is to fetch blocks and store them in the database. Multiple reader instances can be created or workers can be used for scaling if not using Docker.

### Filter

The Filter process retrieves blocks from the database, verifying their content. If a block contains specific contracts, actions, or tables listed in the configuration file, these data are decoded using a dedicated blockchain serializer and saved as tasks for the Processor in the database.

### Processor

The Processor process retrieves tasks from the database, generating appropriate action or delta data based on their content. It coordinates the work of workers who perform the processing. There are two categories of processors: DeltaProcessor and ActionTraceProcessor. The processor creates separate collections in the database for each contract, stock, and delta e.g. `dao.worlds_actions` and `dao.worlds_deltas`. Any processing failures are stored in a separate collection for subsequent review and analysis.

## Common components

In addition to the processes that make up the base of the History Tools package, there are also common components used between these processes. These components provide essential functionality and are shared among the processes. To a large extent, this repository contains high/domain level implementations of these components, and any code that directly depends on external libraries is placed in a separate repository such as the **Starter Kit**. common components consist of:

### Abis

The Abis component serves as a repository for storing contract ABIs (Application Binary Interfaces). It includes a service for downloading new ABIs and retrieving existing ABIs. The Abis component is primarily used in the Bootstrap process to download ABIs for listed contracts. The downloaded ABIs are saved in the database and can be fetched when needed.

```javascript
{
  block_number, // numer bloku w ktorym zainicjonowano kontrakt
  contract, // nazwa kontraktu
  hex // ABI w postaci HEX
}
```

We also use Addis in **Filter** when creating tasks for the processor. At that time we get ABI (for the concrete contract) from the database and if it does not exist, try to fetch it.

#### Methods
- `getAbis(options?)`: Retrieves the ABIs (Application Binary Interfaces) for the specified options.
- `getAbi(blockNumber, contract, fetch?)`: Retrieves the single ABI for the specified block number and contract address.
- `storeAbi(blockNumber, contract, hex)`: Stores the ABI with data.
- `fetchAbis(contracts?)`: Fetch via service ABIs. Optionally you can specify which contracts you want to use
- `cacheAbis(contracts?)`: Caches the ABIs for the specified contracts.


### BlockRangeScanner
The BlockRangeScanner is used in the Reader process during replay mode. It creates sets of blocks to be scanned within a specific range, allowing for organized data download. The BlockRangeScanner divides the range into subgroups containing an equal number of blocks to be scanned. This helps distribute the workload among multiple instances of the Reader process or workers.

#### Methods

- `createScanNodes(key, startBlock, endBlock)`: Creates range scan sets under specified label.
- `getNextScanNode(key)`: Returns the next (not currently scanned) set of the range.
- `hasUnscannedBlocks(key, startBlock, endBlock)`: Returns a boolean after checking whether the condition is true or not.
- `updateScanProgress(scanKey, blockNumber)`: Updates the number of the currently scanned block in the corresponding set.



### BlockState
The BlockState component is a service for updating the current status of the History Tools. It stores various statistics in the database, including the number of the last read block. After reading a block, the BlockState is updated so that in case of restarting the History Tools, they can resume from the last processed block.

#### Methods

- `getState()`: Returns the current statistics.
- `getBlockNumber()`: Returns the number of the last read block.
- `updateBlockNumber(blockNumber)`: Updates the block number value in the statistics.

### Featured
The Featured component includes a repository for storing information about "featured" contracts. These contracts are included in a list and have certain criteria for choosing the right processor for their actions and deltas. The Featured component is used in the Bootstrap process to download data for the featured contracts, and it is also used in the Filter process to determine the appropriate ABI based on the block number when reading block data.

#### FeaturedContracts Methods

- `readContracts(data)`: reads a json object or list of strings and retrieves the previously mentioned data. After they are downloaded from the web, they are stored in the database and cache.
- `isFeatured(contract)`: Checks if the given name is on the list of blocks of interest.

We build `Featured` class instances based on the data contained in the list of "featured" contracts (e.g. in the form of a JSON object). Each object in the list contains not only the names of the contracts, but also criteria on choosing the right processor for individual actions and contract deltas. For more information, see the [Tutorials](#tutorials) section.


#### Featured Methods

- `getCriteria(criteria)`: Gets all match criteria that match the given criteria.
- `getProcessor(label)`: Gets the processor for the given label and criteria.
- `getContracts()`: Lists all contracts in the processor.


### ProcessorTaskQueue

The ProcessorTaskQueue is a queue/repository of processor tasks. These tasks are generated by the Filter process and saved in the database by the ProcessorTaskQueue. The Processor process retrieves the tasks from the queue, removes them from the list, and processes them accordingly. Each task contains encrypted data that needs to be decoded using native blockchain deserializers. If a task fails, it is sent to a separate list `unsuccessful_processor_tasks` for subsequent attempts or analysis.

The task document diagram is as follows:

```typescript
{
  _id : "6494e07f7fcfdd1bb21c8da6",
  abi : "...",
  short_id : "uspts.worlds:addpoints",
  label : "transaction_trace_v0:action_trace_v1:uspts.worlds:addpoints",
  type : "action",
  mode : "default",
  content: "... binary ...";
  hash: "db1a9ef8ddf670313b6868760283e42b0cc21176";
  block_number : 252016298,
  block_timestamp : "2023-06-22T23:59:12.000Z",
  is_fork : false,
  error?;
};
``` 

#### Methods

- `nextTask(mode)`: Returns the next unassigned task from the list.
- `addTasks(tasks)`: Adds tasks to the list.
- `stashUnsuccessfulTask(task, error)`: Method to put tasks into the failed list.

### UnprocessedBlockQueue

UnprocessedBlockQueue is a queue/repository of blocks to be read. We create these collections to speed up the process of reading and filtering blocks. Filtering takes more time than reading, so we separated the two processes, thus allowing you to set the resources appropriately for the fastest result. UnprocessedBlockQueue is used in the reader process to add more blocks to the list and filter to filter them and extract interesting data. The UnprocessedBlockQueue allows setting limits on the number of unread blocks or their total size to prevent overloading the system.

#### Methods

- `getBytesSize()`: Gets the size in bytes of the queue of unread blocks.
- `add(block, isLast)`: Adds a block to the list.
- `next()`: Returns the next block in the list.
- `beforeSendBatch(handler)`: Sets the handler to run before sending blocks to the database.
- `afterSendBatch(handler)`: Sets the handler to start after sending blocks to the database.
- `onOverload(handler)`: Sets the handler to start when the number or total size of blocks in the list is exceeded.




## Additional Tools

The History Tools package also includes additional tools that can be helpful in various scenarios:

### Config

The Config tools are used for generating configuration objects based on values stored in the .env file or environment variables. The list of required options can be found in the file [.env.template](./.env.template).

## Tutorials

For tutorials on creating and using the history tools for your specific needs, see the tutorials in the [History Tools Starter Kit](https://github.com/Alien-Worlds/history-tools-starter-kit) repository. If you want to create history tools with `mongodb` and `eosjs` tools, you should go to the mentioned repository. 


If you want to extend the capabilities of the history tools or take advantage of other third-party resources, please refer to the following tutorial.

- [Extending history tools](./tutorials/extending-history-tools.md)
- [What is "featured" content?](./tutorials/what-is-featured-content.md)
- [Description of configuration variables](./tutorials/config-vars.md)

## Contributing

We welcome contributions from the community. Before contributing, please read through the existing issues on this repository to prevent duplicate submissions. New feature requests and bug reports can be submitted as an issue. If you would like to contribute code, please open a pull request.

## License

This project is licensed under the terms of the MIT license. For more information, refer to the [LICENSE](./LICENSE) file.
