import { Result } from '@alien-worlds/api-core';
import { DatabaseConfigBuilder, Dependencies } from '../common';
import { Api } from './api';

/**
 * An abstract class representing a Api dependencies.
 * @class ApiDependencies
 */
export abstract class ApiDependencies extends Dependencies {
  public api: Api;
  public databaseConfigBuilder: DatabaseConfigBuilder;

  public abstract initialize(): Promise<Result>;
}
