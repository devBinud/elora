import { format } from 'date-fns';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Headphones, Newspaper, Share2, Square } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import {
  AuroraBackground,
  BottomScrim,
  GlassCard,
  GradientButton,
  IconBubble,
} from '@/components/aurora';
import { proxiedImageUrl } from '@/config/dev-proxy';
import { SkeletonBlock, SkeletonGroup } from '@/components/aurora/skeleton';
import { cleanSnippet, fetchArticleParagraphs } from '@/features/news/article-reader';
import { articleAge } from '@/features/news/components/news-meta';
import { useNewsStore } from '@/features/news/news-store';
import { speakAndWait, stopSpeaking } from '@/features/voice/voice-engine';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

const HERO_HEIGHT = 380;
const WORDS_PER_MINUTE = 200;

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = useNewsStore((s) => (id ? s.articlesById[id] : undefined));
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // null = still loading the full text; [] = not available.
  const [paragraphs, setParagraphs] = useState<string[] | null>(null);
  const [reading, setReading] = useState(false);
  const readToken = useRef(0);

  const articleUrl = article?.url;
  useEffect(() => {
    if (!articleUrl) return;
    let cancelled = false;
    setParagraphs(null);
    fetchArticleParagraphs(articleUrl)
      .then((result) => !cancelled && setParagraphs(result))
      .catch(() => !cancelled && setParagraphs([]));
    return () => {
      cancelled = true;
    };
  }, [articleUrl]);

  // Stop reading aloud when leaving the screen.
  useEffect(
    () => () => {
      readToken.current++;
      stopSpeaking();
    },
    [],
  );

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [HERO_HEIGHT - 160, HERO_HEIGHT - 90], [0, 1], Extrapolation.CLAMP),
  }));
  const heroStyle = useAnimatedStyle(() => {
    const y = scrollY.get();
    // Gentle parallax while scrolling, and a stretch when pulling down.
    return y < 0
      ? { transform: [{ translateY: y }, { scale: 1 - y / HERO_HEIGHT }] }
      : { transform: [{ translateY: y * 0.4 }] };
  });

  if (!article) {
    return (
      <View style={[styles.root, styles.missing, { paddingTop: insets.top + 60 }]}>
        <AuroraBackground />
        <StatusBar style="light" />
        <GlassCard style={styles.missingCard}>
          <IconBubble icon={Newspaper} size={48} />
          <Text style={styles.missingTitle}>Article not available</Text>
          <Text style={styles.missingBody}>Go back to the news and open it again.</Text>
          <View style={styles.missingAction}>
            <GradientButton title="Back to news" onPress={() => router.back()} />
          </View>
        </GlassCard>
      </View>
    );
  }

  const image = proxiedImageUrl(article.image);
  const snippet = cleanSnippet(article.content);
  const body = paragraphs && paragraphs.length > 0 ? paragraphs : null;
  const words = (body ?? [article.description ?? '', snippet ?? '']).join(' ').split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  const published = new Date(article.publishedAt);
  const publishedLabel = Number.isNaN(published.getTime()) ? '' : format(published, 'd MMM yyyy, h:mm a');

  const toggleReading = async () => {
    if (reading) {
      readToken.current++;
      stopSpeaking();
      setReading(false);
      return;
    }
    const token = ++readToken.current;
    setReading(true);
    stopSpeaking();
    const parts = [article.title, ...(body ?? [article.description ?? '', snippet ?? ''])].filter(Boolean);
    for (const part of parts) {
      if (readToken.current !== token) return;
      await speakAndWait(part);
    }
    if (readToken.current === token) setReading(false);
  };

  const share = () => {
    void Share.share({ title: article.title, message: `${article.title}\n${article.url}` });
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <StatusBar style="light" />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}>
        {/* Hero image */}
        <Animated.View style={[styles.hero, heroStyle]}>
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
              <LinearGradient id="article-hero-fade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={aurora.background} stopOpacity="0.55" />
                <Stop offset="0.3" stopColor={aurora.background} stopOpacity="0" />
                <Stop offset="0.65" stopColor={aurora.background} stopOpacity="0.15" />
                <Stop offset="1" stopColor={aurora.background} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#article-hero-fade)" />
          </Svg>
        </Animated.View>

        <View style={styles.body}>
          <View style={styles.sourcePill}>
            <Text style={styles.sourcePillText} numberOfLines={1}>
              {article.source.name}
            </Text>
          </View>

          <Text style={styles.title} accessibilityRole="header">
            {article.title}
          </Text>

          <Text style={styles.meta}>
            {[publishedLabel, articleAge(article.publishedAt), `${minutes} min read`]
              .filter(Boolean)
              .join('  ·  ')}
          </Text>

          <GradientButton
            title={reading ? 'Stop listening' : 'Listen with Elora'}
            icon={reading ? Square : Headphones}
            onPress={() => void toggleReading()}
          />

          <View style={styles.divider} />

          {article.description ? <Text style={styles.lead}>{article.description}</Text> : null}

          {paragraphs === null ? (
            <ReaderSkeleton />
          ) : body ? (
            body.map((paragraph, index) => (
              <Text key={index} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))
          ) : (
            <>
              {snippet ? <Text style={styles.paragraph}>{snippet}</Text> : null}
              <GlassCard style={styles.note}>
                <Text style={styles.noteText}>
                  The full story from {article.source.name} couldn&apos;t be loaded here, so this is
                  the summary GNews provides.
                </Text>
              </GlassCard>
            </>
          )}

          <Text style={styles.credit}>
            Source: {article.source.name}
            {'\n'}Headlines by GNews
          </Text>
        </View>
      </Animated.ScrollView>

      <BottomScrim />

      {/* Compact bar with the headline, fades in once the hero scrolls away */}
      <Animated.View
        pointerEvents="none"
        style={[styles.topBar, { paddingTop: insets.top, height: insets.top + 60 }, barStyle]}>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {article.title}
        </Text>
      </Animated.View>

      {/* Floating controls */}
      <View pointerEvents="box-none" style={[styles.controls, { top: insets.top + 10 }]}>
        <RoundButton label="Back" onPress={() => router.back()}>
          <ChevronLeft size={22} color={aurora.text} strokeWidth={2} />
        </RoundButton>
        <RoundButton label="Share article" onPress={share}>
          <Share2 size={18} color={aurora.text} strokeWidth={2} />
        </RoundButton>
      </View>
    </View>
  );
}

function RoundButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.roundButton, pressed && styles.roundButtonPressed]}>
      {children}
    </Pressable>
  );
}

function ReaderSkeleton() {
  return (
    <SkeletonGroup style={styles.skeleton} accessibilityLabel="Loading the full story">
      {['100%', '96%', '88%', '100%', '72%', '94%', '60%'].map((width, index) => (
        <SkeletonBlock key={index} style={[styles.skeletonLine, { width: width as `${number}%` }]} />
      ))}
      <Text style={styles.skeletonText}>Loading the full story…</Text>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: aurora.background },
  hero: { height: HERO_HEIGHT, backgroundColor: aurora.backgroundRaised },
  body: { paddingHorizontal: 20, gap: 16, marginTop: -72 },

  sourcePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: aurora.violet,
    maxWidth: '80%',
  },
  sourcePillText: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.4 },
  title: { color: aurora.text, fontFamily: fonts.bold, fontSize: 26, lineHeight: 34, letterSpacing: -0.5 },
  meta: { color: aurora.textSubtle, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: aurora.glassBorder, marginVertical: 4 },
  lead: { color: aurora.lilac, fontFamily: fonts.lightItalic, fontSize: 18, lineHeight: 28 },
  paragraph: {
    color: 'rgba(237, 233, 254, 0.86)',
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 27,
  },
  note: { padding: 14 },
  noteText: { color: aurora.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  credit: {
    color: aurora.textSubtle,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },

  skeleton: { gap: 12 },
  skeletonLine: { height: 13, borderRadius: 7 },
  skeletonText: { color: aurora.textSubtle, fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    paddingHorizontal: 72,
    backgroundColor: 'rgba(11, 7, 22, 0.96)',
    borderBottomColor: 'rgba(216, 180, 254, 0.18)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarTitle: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: 'center' },

  controls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 5, 14, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  roundButtonPressed: { backgroundColor: 'rgba(7, 5, 14, 0.8)' },

  missing: { paddingHorizontal: 20 },
  missingCard: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  missingTitle: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 17 },
  missingBody: { color: aurora.textMuted, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },
  missingAction: { alignSelf: 'stretch', marginTop: 8 },
});
