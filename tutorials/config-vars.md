# Description of configuration variables

This is more of a description than a tutorial. Here you will find information about the configuration variables that must be provided for history tools to work.

[Back to Readme](../README.md)

Basic Variables

| **Name** | **Type** | **Description** | **Default** |
| :------- | :------: | --------------- | :---------: |
|`BLOCKCHAIN_ENDPOINT`| _string_ | Blockchain API addres| none |
|`BLOCKCHAIN_CHAIN_ID`| _string_ | Blockchain ID string | none |
|`HYPERION_URL`| _string_ | Hyperion API url | none |
|`BLOCK_READER_ENDPOINTS`| _string_ | Comma separated list of State History Plugin WS paths | none |
|`BLOCK_READER_FETCH_BLOCK`| _number_ | Number (0/1) value that specifies whether to fetch the signed block data | 1 |
|`BLOCK_READER_FETCH_DELTAS`| _number_ | Number (0/1) value that specifies whether to fetch deltas | 1 |
|`BLOCK_READER_FETCH_TRACES`| _number_ | Number (0/1) value that specifies whether to fetch traces | 1 |
|`READER_MAX_THREADS`| _number_ | specify the maximum number of threads dedicated to the reader process | 1 |
|`FILTER_MAX_THREADS`| _number_ | specify the maximum number of threads dedicated to the reader process | 1 |
|`PROCESSOR_MAX_THREADS`| _number_ | specify the maximum number of threads dedicated to the reader process | 1 |
|`API_PORT`| _number_ | History Tools API port number | none |
|`BROADCAST_PORT`| _number_ | Broadcast port number | none |
|`BROADCAST_HOST`| _string_ | Broadcast host | none |
|`DATABASE_HOSTS`| _string_ | Comma separated list of database hosts | none |
|`DATABASE_PORTS`| _string_ | Comma separated list of database ports | none |
|`DATABASE_NAME`| _string_ | Name of the database | none |
|`MODE`| _string_ | History Tools run mode label "default"/"replay" | "default" |
|`SCANNER_SCAN_KEY`| _string_ | Label for scanned blocks in replay mode. It serves the main purpose of separating and keeping in the database logs the history of which blocks were scanned for what purpose. It may happen that blocks in the same instance will have to be downloaded again, for this you need to enter a new label. | none |
|`START_BLOCK`| _number_ | Beginning of block scanning in replay mode. | none |
|`END_BLOCK`| _number_ | End of block scan in replay mode. | none |


Advanced Variables

The following settings are additional for more advanced users who want to tweak the work of the tools to use more available resources

|       **Name**        | **Type** | **Description**       | **Default** |
| :-------------------- | :------: | --------------------- | :---------: |
| `SCANNER_NODES_MAX_CHUNK_SIZE` | _number_ |  | 100        |
| `ABIS_SERVICE_LIMIT` | _number_ |  | none        |
| `ABIS_SERVICE_FILTER` | _string_ |  | "eosio:setabi"        |
| `READER_INVIOLABLE_THREADS_COUNT` | _number_ |  | 0        |
| `PROCESSOR_INVIOLABLE_THREADS_COUNT` | _number_ |  | 0        |
| `FILTER_INVIOLABLE_THREADS_COUNT` | _number_ |  | 0        |
| `START_FROM_HEAD` | _number_ |  | 0        |
| `UNPROCESSED_BLOCK_QUEUE_MAX_BYTES_SIZE` | _number_ |  | 256000000        |
| `UNPROCESSED_BLOCK_QUEUE_SIZE_CHECK_INTERVAL` | _number_ |  | 2000        |
| `UNPROCESSED_BLOCK_QUEUE_BATCH_SIZE` | _number_ |  | 100        |
| `PROCESSOR_TASK_QUEUE_CHECK_INTERVAL` | _number_ |  | 5000        |
