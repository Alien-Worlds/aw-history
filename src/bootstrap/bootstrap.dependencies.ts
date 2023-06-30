import { BlockchainService, Result } from '@alien-worlds/api-core';
import { Dependencies } from '../common/dependencies';
import { Featured, FeaturedContractDataCriteria } from '../common/featured';
import { BroadcastClient } from '@alien-worlds/broadcast';
import { Abis, BlockRangeScanner, BlockState, DatabaseConfigBuilder } from '../common';
import { BootstrapConfig } from './bootstrap.config';

/**
 * An abstract class representing a Bootstrap dependencies.
 * @export
 * @abstract
 * @class BootstrapDependencies
 */
export abstract class BootstrapDependencies extends Dependencies {
  /**
   * The broadcast client used for communication.
   * @type {BroadcastClient}
   */
  public broadcastClient: BroadcastClient;
  /**
   * The ABIs (Application Binary Interfaces) for contracts.
   * @type {Abis}
   */
  public abis: Abis;
  /**
   * The block range scanner for scanning blocks.
   * @type {BlockRangeScanner}
   */
  public scanner: BlockRangeScanner;
  /**
   * The featured contract service.
   * @type {Featured}
   */
  public featured: Featured;
  /**
   * The block state for maintaining blockchain state.
   * @type {BlockState}
   */
  public blockState: BlockState;

  /**
   * The blockchain service for interacting with the blockchain.
   * @type {BlockchainService}
   */
  public blockchain: BlockchainService;

  /**
   * @type {DatabaseConfigBuilder}
   */
  public databaseConfigBuilder: DatabaseConfigBuilder;

  public abstract initialize(
    config: BootstrapConfig,
    featuredCriteria: FeaturedContractDataCriteria
  ): Promise<Result>;
}
