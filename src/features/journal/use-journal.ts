import { useCallback, useEffect, useState } from 'react';

import type { Stored } from '@/database/schemas/entity-schema';
import { useAuthStore } from '@/store/auth-store';

import {
  journalRepository,
  normalizeEntry,
  type JournalCategory,
  type JournalEntry,
} from './journal-repository';

export type JournalFilter = 'all' | 'favorites' | JournalCategory;

const RELOAD_DEBOUNCE_MS = 120;

type EntriesState = { entries: Stored<JournalEntry>[]; loading: boolean };

/**
 * The signed-in user's journal entries, newest first, filtered by category /
 * favourites and a search text. Updates live when entries change locally or
 * arrive from another device via sync.
 */
export function useJournalEntries(filter: JournalFilter, search: string): EntriesState {
  const userId = useAuthStore((s) => s.user?.uid ?? null);
  const [state, setState] = useState<EntriesState>({ entries: [], loading: true });
  const query = search.trim();

  const load = useCallback(async () => {
    if (!userId) {
      setState({ entries: [], loading: false });
      return;
    }
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    if (filter === 'favorites') conditions.push('favorite = 1');
    else if (filter !== 'all') {
      conditions.push("COALESCE(category, 'journal') = ?");
      params.push(filter);
    }
    if (query) {
      // '!' escapes LIKE wildcards so "%" or "_" in the search match literally.
      conditions.push("(COALESCE(title, '') LIKE ? ESCAPE '!' OR COALESCE(body, '') LIKE ? ESCAPE '!')");
      const like = `%${query.replace(/[!%_]/g, (c) => `!${c}`)}%`;
      params.push(like, like);
    }
    const rows = await journalRepository.list(userId, {
      where: conditions.length ? conditions.join(' AND ') : undefined,
      params,
    });
    setState({ entries: rows.map(normalizeEntry), loading: false });
  }, [userId, filter, query]);

  useEffect(() => {
    void load();
    // Batch bursts of changes (autosave, sync) into one reload.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = journalRepository.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void load(), RELOAD_DEBOUNCE_MS);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [load]);

  return state;
}

/** One entry by id, kept up to date. `undefined` while loading, `null` if missing. */
export function useJournalEntry(id: string | null): Stored<JournalEntry> | null | undefined {
  const userId = useAuthStore((s) => s.user?.uid ?? null);
  const [entry, setEntry] = useState<Stored<JournalEntry> | null | undefined>(id ? undefined : null);

  useEffect(() => {
    if (!userId || !id) {
      setEntry(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const found = await journalRepository.getById(userId, id);
      if (!cancelled) setEntry(found ? normalizeEntry(found) : null);
    };
    void load();
    const unsubscribe = journalRepository.subscribe(() => void load());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [userId, id]);

  return entry;
}
