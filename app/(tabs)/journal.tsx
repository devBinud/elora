import { useRouter } from 'expo-router';
import { NotebookPen, PenLine, SearchX } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import {
  AuroraScreen,
  ChipRow,
  GlassCard,
  GradientButton,
  IconBubble,
  SearchField,
} from '@/components/aurora';
import { JournalEntryCard } from '@/features/journal/components/journal-entry-card';
import { countWords } from '@/features/journal/journal-repository';
import { useJournalEntries, type JournalFilter } from '@/features/journal/use-journal';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

const FILTERS: { id: JournalFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'journal', label: 'Journal' },
  { id: 'blog', label: 'Blog drafts' },
  { id: 'idea', label: 'Ideas' },
  { id: 'favorites', label: '★ Saved' },
];

export default function JournalScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<JournalFilter>('all');
  const [search, setSearch] = useState('');
  const { entries, loading } = useJournalEntries(filter, search);

  const totalWords = entries.reduce((sum, entry) => sum + countWords(entry.body), 0);
  const isFiltered = filter !== 'all' || search.trim().length > 0;

  const openNew = () => {
    const category = filter === 'blog' || filter === 'idea' ? filter : 'journal';
    router.push({ pathname: '/entry/[id]', params: { id: 'new', category } });
  };
  const openEntry = (id: string) => router.push({ pathname: '/entry/[id]', params: { id } });

  return (
    <AuroraScreen overline="Private · only you" title="Your" accent="journal">
      <GradientButton title="New entry" icon={PenLine} onPress={openNew} />

      <SearchField
        placeholder="Search your journal"
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch('')}
      />

      <ChipRow options={FILTERS} selected={filter} onSelect={setFilter} />

      {entries.length > 0 ? (
        <Text style={styles.summary}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · {totalWords.toLocaleString()}{' '}
          {totalWords === 1 ? 'word' : 'words'}
        </Text>
      ) : null}

      {loading ? null : entries.length === 0 ? (
        isFiltered ? (
          <GlassCard style={styles.empty}>
            <IconBubble icon={SearchX} size={52} />
            <Text style={styles.emptyTitle}>No matching entries</Text>
            <Text style={styles.emptyBody}>Try another filter or different words.</Text>
          </GlassCard>
        ) : (
          <GlassCard style={styles.empty}>
            <IconBubble icon={NotebookPen} size={56} />
            <Text style={styles.emptyTitle}>Start your first entry</Text>
            <Text style={styles.emptyBody}>
              Write about your day, draft a blog post or save an idea. Entries save instantly, work
              offline and sync to your account.
            </Text>
          </GlassCard>
        )
      ) : (
        entries.map((entry) => (
          <JournalEntryCard key={entry.id} entry={entry} onPress={() => openEntry(entry.id)} />
        ))
      )}
    </AuroraScreen>
  );
}

const styles = StyleSheet.create({
  summary: { color: aurora.textSubtle, fontFamily: fonts.medium, fontSize: 12, marginLeft: 4 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyTitle: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 18, marginTop: 4 },
  emptyBody: {
    color: aurora.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
