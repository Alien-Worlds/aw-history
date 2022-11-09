/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { log } from '@alien-worlds/api-core';
import { Serialize } from 'eosjs';
import { TextDecoder, TextEncoder } from 'text-encoding';
import { BlockReader, BlockReaderService } from './block-reader';
import { BlockReaderConfig } from './block-reader.config';
import { BlockReaderSource } from './block-reader.source';

export const setupBlockReader = async (
  config: BlockReaderConfig
): Promise<BlockReader> => {
  const source = new BlockReaderSource(config);
  source.onError(error => log(error));
  const blockReader = new BlockReaderService(source);
  await blockReader.connect();

  return blockReader;
};

export const serializeMessage = (
  type: string,
  value: unknown,
  types: Map<string, Serialize.Type>
) => {
  const buffer = new Serialize.SerialBuffer({
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
  });
  Serialize.getType(types, type).serialize(buffer, value);
  return buffer.asUint8Array();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deserializeMessage = <T = any>(
  type: string,
  array: Uint8Array,
  types: Map<string, Serialize.Type>
): T => {
  const buffer = new Serialize.SerialBuffer({
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
    array,
  });
  const result = Serialize.getType(types, type).deserialize(
    buffer,
    new Serialize.SerializerState({ bytesAsUint8Array: true })
  );

  if (buffer.readPos != array.length) throw new Error('oops: ' + type); // todo: remove check
  return <T>result;
};
