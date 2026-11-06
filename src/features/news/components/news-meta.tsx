import { formatDistanceToNowStrict } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';

import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

/** "3h ago" style age for an ISO timestamp. */
export function articleAge(publishedAt: string): string {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return '';
  return `${formatDistanceToNowStrict(date)} ago`;
}

/** Source name and article age, e.g. "The Hindu · 3 hours ago". */
export function NewsMeta({ source, publishedAt }: { source: string; publishedAt: string }) {
  const age = articleAge(publishedAt);
  return (
    <View style={styles.row}>
      <Text style={styles.source} numberOfLines={1}>
        {source}
      </Text>
      {age ? (
        <>
          <View style={styles.dot} />
          <Text style={styles.age} numberOfLines={1}>
            {age}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  source: { color: aurora.lilac, fontFamily: fonts.semibold, fontSize: 12, flexShrink: 1 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: aurora.textSubtle },
  age: { color: aurora.textSubtle, fontFamily: fonts.medium, fontSize: 12 },
});
