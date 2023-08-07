import { ConfigVars, UnknownObject } from '@alien-worlds/aw-core';

export type DatabaseConfigBuilder = (
  vars: ConfigVars,
  ...args: unknown[]
) => UnknownObject;
