/* eslint-disable @typescript-eslint/no-unused-vars */
import { log, Route } from '@alien-worlds/api-core';
import express, { Express } from 'express';
import { ApiConfig } from './api.config';

export class Api {
  private app: Express;

  constructor(private config: ApiConfig) {
    this.app = express();
  }

  public async start() {
    const {
      config: { port },
    } = this;
    this.app.listen(port, () => {
      log(`Server is running at http://localhost:${port}`);
    });
  }
}
