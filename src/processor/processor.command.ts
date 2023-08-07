import { Command } from 'commander';

export const processorCommand = new Command();

processorCommand
  .version('1.0', '-v, --version')
  .option('-t, --threads <threads>', 'Number of threads')
  .parse(process.argv);
