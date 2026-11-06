import { format, isThisYear, isToday, isYesterday } from 'date-fns';
import { Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/aurora';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

import { countWords, JOURNAL_CATEGORIES, type JournalEntry } from '../journal-repository';

/** "Today, 4:12 PM" / "Yesterday" / "6 Nov" / "6 Nov 2025" */
export function entryDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`;
  return format(date, isThisYear(date) ? 'd MMM' : 'd MMM yyyy');
}

type JournalEntryCardProps = { entry: JournalEntry; onPress: () => void };

/** One entry in the journal list: category, date, title and a short preview. */
export function JournalEntryCard({ entry, onPress }: JournalEntryCardProps) {
  const category = JOURNAL_CATEGORIES.find((c) => c.id === entry.category)?.label ?? 'Journal';
  const title = entry.title.trim() || 'Untitled';
  const preview = entry.body.trim().replace(/\s+/g, ' ');
  const words = countWords(entry.body);

  return (
    <GlassCard onPress={onPress} accessibilityLabel={`${title}. ${category}. ${entryDateLabel(entry.updatedAt)}.`}>
      <View style={styles.topRow}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
        <Text style={styles.date}>{entryDateLabel(entry.updatedAt)}</Text>
        {entry.favorite ? <Star size={15} color={aurora.lilac} fill={aurora.lilac} strokeWidth={1.8} /> : null}
      </View>
      <Text style={[styles.title, !entry.title.trim() && styles.untitled]} numberOfLines={2}>
        {title}
      </Text>
      {preview ? (
        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>
      ) : null}
      <Text style={styles.meta}>
        {words} {words === 1 ? 'word' : 'words'}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: aurora.accentTint,
    borderColor: aurora.accentBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  categoryText: { color: aurora.lilac, fontFamily: fonts.semibold, fontSize: 11 },
  date: { flex: 1, color: aurora.textSubtle, fontFamily: fonts.medium, fontSize: 12 },
  title: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  untitled: { color: aurora.textMuted, fontFamily: fonts.lightItalic },
  preview: {
    color: aurora.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  meta: { color: aurora.textSubtle, fontFamily: fonts.regular, fontSize: 12, marginTop: 10 },
});
