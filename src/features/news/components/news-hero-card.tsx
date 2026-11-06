import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { proxiedImageUrl } from '@/config/dev-proxy';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

import type { NewsArticle } from '../types';
import { NewsMeta } from './news-meta';

type NewsHeroCardProps = { article: NewsArticle; onPress: () => void };

/** The lead story: a large image with the headline over a dark fade. */
export function NewsHeroCard({ article, onPress }: NewsHeroCardProps) {
  const image = proxiedImageUrl(article.image);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${article.title}. ${article.source.name}. Opens the article.`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.media}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
            cachePolicy="memory-disk"
            accessible={false}
          />
        ) : null}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="news-hero-fade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.3" stopColor={aurora.background} stopOpacity="0" />
              <Stop offset="1" stopColor={aurora.background} stopOpacity="0.95" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#news-hero-fade)" />
        </Svg>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Top story</Text>
        </View>
        <View style={styles.overlay}>
          <NewsMeta source={article.source.name} publishedAt={article.publishedAt} />
          <Text style={styles.title} numberOfLines={3}>
            {article.title}
          </Text>
        </View>
      </View>
      {article.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {article.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  pressed: { opacity: 0.88 },
  media: { aspectRatio: 4 / 3, backgroundColor: aurora.backgroundRaised, justifyContent: 'flex-end' },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: aurora.violet,
  },
  badgeText: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.6 },
  overlay: { padding: 16, gap: 8 },
  title: { color: aurora.text, fontFamily: fonts.bold, fontSize: 20, lineHeight: 27, letterSpacing: -0.3 },
  description: {
    color: aurora.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
});
