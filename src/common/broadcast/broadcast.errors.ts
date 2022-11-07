export class MapperNotFoundError extends Error {
  constructor(queue: string) {
    super(`Mapper not found for ${queue}`);
  }
}
