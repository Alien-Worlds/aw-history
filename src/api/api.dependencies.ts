import { Result } from '@alien-worlds/api-core';
import { DatabaseConfigBuilder, Dependencies } from '../common';
import { Api } from './api';
import { ApiConfig } from './api.types';

/**
 * An abstract class representing a Api dependencies.
 * @class ApiDependencies
 */
export abstract class ApiDependencies extends Dependencies {
  public api: Api;

  public databaseConfigBuilder: DatabaseConfigBuilder;

  public abstract initialize(config: ApiConfig): Promise<Result>;
}
