import { Command } from 'commander';

export const readerCommand = new Command();

readerCommand
  .version('1.0', '-v, --version')
  .option('-k, --scan-key <scan-key>', 'Scan key')
  .option('-s, --start-block <start-block>', 'Start at this block')
  .option('-m, --mode <mode>', 'Mode (default/replay)')
  .option('-e, --end-block <end-block>', 'End block (exclusive)')
  .option('-t, --threads <threads>', 'Number of threads')
  .parse(process.argv);
