import { ConfigVars, UnknownObject } from '@alien-worlds/api-core';

export type DatabaseConfigBuilder = (
  vars: ConfigVars,
  ...args: unknown[]
) => UnknownObject;
