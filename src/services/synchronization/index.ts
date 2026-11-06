import {
  createSyncableRepository,
  type SyncableRepository,
} from '@/database/repositories/syncable-repository';
import type { EntitySchema, SyncableEntity } from '@/database/schemas/entity-schema';

import { requestSync } from './sync-engine';
import { registerRepository } from './sync-registry';

/**
 * Creates a local-first repository for a feature and registers it with the
 * sync engine. Local writes automatically schedule a background sync.
 *
 * Usage (in a feature module):
 *   export const tasksRepository = defineSyncableRepository(tasksSchema);
 */
export function defineSyncableRepository<T extends SyncableEntity>(
  schema: EntitySchema<T>,
): SyncableRepository<T> {
  const repository = createSyncableRepository(schema, { onLocalChange: requestSync });
  registerRepository(repository);
  return repository;
}

export { refreshPendingCount, requestSync, syncNow } from './sync-engine';
