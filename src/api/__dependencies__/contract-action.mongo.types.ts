import { MongoDB } from '@alien-worlds/storage-mongodb';

export type ContractActionMongoModel = {
  _id?: MongoDB.ObjectId;
  [key: string]: unknown;
};
