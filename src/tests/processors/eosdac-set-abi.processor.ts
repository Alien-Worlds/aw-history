/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
// import { TaskResolver } from "../common/workers";

import { wait } from '../../common/broadcast';
import { WorkerTask } from '../../common/workers';

export default class EosdacSetAbiProcessor extends WorkerTask {
  public async run(data: unknown, sharedData: unknown): Promise<void> {
    console.log('start worker and wait')
    await wait(1000 * Math.random()*10);
    console.log('ok resolve')
    this.resolve();
  }
}
