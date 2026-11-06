import { UserCollections } from '@/constants/collections';
import type { EntitySchema, SyncableEntity } from '@/database/schemas/entity-schema';
import { defineSyncableRepository } from '@/services/synchronization';

export type JournalCategory = 'journal' | 'blog' | 'idea';

export const JOURNAL_CATEGORIES: { id: JournalCategory; label: string }[] = [
  { id: 'journal', label: 'Journal' },
  { id: 'blog', label: 'Blog draft' },
  { id: 'idea', label: 'Idea' },
];

/** A text-only journal entry. */
export type JournalEntry = SyncableEntity & {
  title: string;
  body: string;
  category: JournalCategory;
  favorite: boolean;
};

export const journalSchema: EntitySchema<JournalEntry> = {
  table: 'journal_entries',
  collection: UserCollections.journals,
  fields: {
    title: { column: 'title', type: 'text' },
    body: { column: 'body', type: 'text' },
    category: { column: 'category', type: 'text' },
    favorite: { column: 'favorite', type: 'boolean' },
  },
};

/**
 * Local-first journal storage: writes go to SQLite instantly (works offline)
 * and sync to Firestore in the background. Importing this module registers
 * the journal with the sync engine.
 */
export const journalRepository = defineSyncableRepository(journalSchema);

/** Fills in defaults for fields that may be missing (e.g. older remote docs). */
export function normalizeEntry<T extends JournalEntry>(entry: T): T {
  return {
    ...entry,
    title: entry.title ?? '',
    body: entry.body ?? '',
    category: (JOURNAL_CATEGORIES.some((c) => c.id === entry.category) ? entry.category : 'journal') as JournalCategory,
    favorite: Boolean(entry.favorite),
  };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
