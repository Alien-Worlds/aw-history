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
  - [APIs](#apis)
  - [Broadcasting](#broadcasting)
  - [Bootstrap](#bootstrap)
  - [Reader](#reader)
  - [Filter](#filter)
  - [Processor](#processor)
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

### APIs

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

## Additional Tools

Besides the main processes, this package also contains tools, such as:

### Config

The Config tools are used for generating configuration objects based on values stored in the .env file or environment variables. The list of required options can be found in the file [.env.template](./.env.template).

## Tutorials

- [Description of configuration variables](./tutorials/config-vars.md)
- [Writing your own history tools](./tutorials/writing-history-tools.md)
- [Running history tools locally](./tutorials/running-history-tools-locally.md)
- [Running history tools with Docker](./tutorials/running-history-tools-with-docker.md)

## Contributing

We welcome contributions from the community. Before contributing, please read through the existing issues on this repository to prevent duplicate submissions. New feature requests and bug reports can be submitted as an issue. If you would like to contribute code, please open a pull request.

## License

This project is licensed under the terms of the MIT license. For more information, refer to the [LICENSE](./LICENSE) file.
