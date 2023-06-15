import { Command } from 'commander';

export const bootstrapCommand = new Command();

bootstrapCommand
  .version('1.0', '-v, --version')
  .option('-k, --scan-key <scan-key>', 'Scan key')
  .option('-s, --start-block <start-block>', 'Start at this block')
  .option('-m, --mode <mode>', 'Mode (default/replay/test)')
  .option('-e, --end-block <end-block>', 'End block (exclusive)');
