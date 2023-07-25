/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiConfig } from './api.types';

export class Api<WebFramework = unknown> {
  protected app: WebFramework;
  protected config: ApiConfig;

  public setup(config: ApiConfig) {
    this.config = config;
  }

  public async start() {
    throw new Error('Method "start" not implemented');
  }

  public get framework(): WebFramework {
    return this.app;
  }
}
