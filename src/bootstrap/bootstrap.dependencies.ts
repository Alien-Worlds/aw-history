import { BroadcastClient } from '@alien-worlds/broadcast';
import { Abis, BlockRangeScanner, BlockState, Featured } from '../common';
import { BlockchainService, Result } from '@alien-worlds/api-core';
import { Dependencies } from '../common/dependencies';
import { BootstrapConfig } from './bootstrap.types';

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
   * The blockchain service for interacting with the blockchain.
   * @type {BlockchainService}
   */
  public featuredContracts: BlockchainService;

  public abstract initialize(
    config: BootstrapConfig,
    featuredContracts: string[]
  ): Promise<Result>;
}
