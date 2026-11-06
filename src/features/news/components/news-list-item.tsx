import { Image } from 'expo-image';
import { Newspaper } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { proxiedImageUrl } from '@/config/dev-proxy';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

import type { NewsArticle } from '../types';
import { NewsMeta } from './news-meta';

type NewsListItemProps = { article: NewsArticle; onPress: () => void };

/** A compact story card: headline and source on the left, thumbnail on the right. */
export function NewsListItem({ article, onPress }: NewsListItemProps) {
  const image = proxiedImageUrl(article.image);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${article.title}. ${article.source.name}. Opens the article.`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.text}>
        <NewsMeta source={article.source.name} publishedAt={article.publishedAt} />
        <Text style={styles.title} numberOfLines={3}>
          {article.title}
        </Text>
      </View>
      <View style={styles.thumb}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            accessible={false}
          />
        ) : (
          <Newspaper size={22} color={aurora.textSubtle} strokeWidth={1.6} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  pressed: { backgroundColor: aurora.glassPressed },
  text: { flex: 1, gap: 6 },
  title: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: aurora.backgroundRaised,
  },
});
