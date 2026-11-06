import type { UserCollectionName } from '@/constants/collections';
import type { SyncableRepository } from '@/database/repositories/syncable-repository';
import type { SyncableEntity } from '@/database/schemas/entity-schema';

type AnyRepository = SyncableRepository<any>;

const repositories = new Map<UserCollectionName, AnyRepository>();

export function registerRepository<T extends SyncableEntity>(repository: SyncableRepository<T>) {
  repositories.set(repository.schema.collection, repository as AnyRepository);
}

export function getRepository(collection: UserCollectionName): AnyRepository | undefined {
  return repositories.get(collection);
}

export function getRegisteredRepositories(): AnyRepository[] {
  return [...repositories.values()];
}
