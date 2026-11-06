import type { UserCollectionName } from '@/constants/collections';

export type SyncOperation = 'upsert' | 'delete';

export type SyncQueueRow = {
  id: number;
  user_id: string;
  collection: UserCollectionName;
  doc_id: string;
  op: SyncOperation;
  created_at: number;
  attempts: number;
  last_error: string | null;
};
