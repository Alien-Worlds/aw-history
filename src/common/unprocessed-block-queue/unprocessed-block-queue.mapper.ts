import { Block } from '@alien-worlds/block-reader';

export abstract class UnprocessedBlockMapper<ModelType> {
  public abstract toEntity(model: ModelType): Block;

  public abstract fromEntity(entity: Block): ModelType;
}
