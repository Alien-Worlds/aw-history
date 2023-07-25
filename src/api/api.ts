/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiConfig } from './api.types';

export class Api<WebFramework> {
  protected app: WebFramework;

  constructor(protected config: ApiConfig) {}

  public async start() {
    throw new Error('Method "start" not implemented');
  }

  public get framework(): WebFramework {
    return this.app;
  }
}
