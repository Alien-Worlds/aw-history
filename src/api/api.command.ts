import { Command } from 'commander';

export const apiCommand = new Command();

apiCommand
  .version('1.0', '-v, --version')
  .option('-p, --port <port>')
  .parse(process.argv);
