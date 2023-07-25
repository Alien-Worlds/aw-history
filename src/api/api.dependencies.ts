import { Container, Result, Route, UnknownObject } from '@alien-worlds/api-core';
import { DatabaseConfigBuilder, Dependencies } from '../common';
import { Api } from './api';

/**
 * An abstract class representing a Api dependencies.
 * @class ApiDependencies
 */
export abstract class ApiDependencies extends Dependencies {
  public api: Api;
  public ioc: Container;
  public databaseConfigBuilder: DatabaseConfigBuilder;

  public abstract initialize(
    setupIoc: (config: UnknownObject, container: Container) => Promise<void>,
    routesProvider: (container: Container) => Route[]
  ): Promise<Result>;
}
