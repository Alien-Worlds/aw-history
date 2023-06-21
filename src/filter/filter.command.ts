import { Command } from 'commander';

export const filterCommand = new Command();

filterCommand
  .version('1.0', '-v, --version')
  .option('-k, --scan-key <scan-key>', 'Scan key')
  .option('-m, --mode <mode>', 'Mode (default/replay/test)')
  .option('-t, --threads <threads>', 'Number of threads')
  .parse(process.argv);
