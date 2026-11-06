import { useIsFocused } from '@react-navigation/native';
import { formatDistanceToNowStrict } from 'date-fns';
import { StatusBar } from 'expo-status-bar';
import { KeyRound, SearchX, WifiOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground, ChipRow, SearchField } from '@/components/aurora';
import { newsConfig } from '@/config/news';
import { APP_HEADER_BAR_HEIGHT, AppHeader } from '@/components/aurora/app-header';
import { NewsHeroCard } from '@/features/news/components/news-hero-card';
import { NewsListItem } from '@/features/news/components/news-list-item';
import { NewsMessage, NewsSkeleton } from '@/features/news/components/news-placeholders';
import { isGNewsConfigured } from '@/features/news/gnews-client';
import { articleKey } from '@/features/news/news-store';
import type { NewsArticle, NewsCategory } from '@/features/news/types';
import { useNewsFeed } from '@/features/news/use-news-feed';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

export default function NewsScreen() {
  const router = useRouter();
  const openArticle = (article: NewsArticle) =>
    router.push({ pathname: '/article/[id]', params: { id: articleKey(article) } });
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [category, setCategory] = useState<NewsCategory>('general');
  const [searchText, setSearchText] = useState('');
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  const feed = useNewsFeed(
    activeQuery ? { kind: 'search', query: activeQuery } : { kind: 'top', category },
  );
  // Skeleton while loading for the first time, on pull-to-refresh and on retry.
  const showSkeleton = feed.loading || feed.refreshing;
  const [lead, ...rest] = feed.articles;
  const categoryLabel =
    newsConfig.categories.find((c) => c.id === category)?.label ?? 'Top stories';

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  const submitSearch = () => {
    const query = searchText.trim();
    setActiveQuery(query.length > 0 ? query : null);
  };
  const clearSearch = () => {
    setSearchText('');
    setActiveQuery(null);
  };

  const header = (
    <View style={styles.headerBlock}>
      <View>
        <Text style={styles.overline}>
          {activeQuery ? 'Search' : `${newsConfig.countryName} · ${categoryLabel}`}
        </Text>
        <Text style={styles.title}>{activeQuery ? 'Results for' : "Today's"}</Text>
        <Text style={styles.titleAccent} numberOfLines={2}>
          {activeQuery ? `“${activeQuery}”` : 'headlines'}
        </Text>
      </View>

      <SearchField
        placeholder="Search news"
        value={searchText}
        onChangeText={setSearchText}
        onSubmit={submitSearch}
        onClear={clearSearch}
      />

      {activeQuery ? null : (
        <ChipRow
          options={newsConfig.categories}
          selected={category}
          onSelect={setCategory}
        />
      )}

      {!showSkeleton && feed.error && feed.articles.length > 0 ? (
        <Text style={styles.inlineError}>{feed.error} Showing saved headlines.</Text>
      ) : null}

      <FeedTop
        lead={lead}
        loading={showSkeleton}
        error={feed.articles.length === 0 ? feed.error : null}
        isSearch={activeQuery !== null}
        onRetry={feed.refresh}
        onOpen={openArticle}
      />
    </View>
  );

  const footer =
    !showSkeleton && feed.articles.length > 0 ? (
      <Text style={styles.footnote}>
        Powered by GNews
        {feed.fetchedAt ? ` · updated ${formatDistanceToNowStrict(feed.fetchedAt)} ago` : ''}
        {'\n'}Pull down to refresh. Free plan headlines arrive with a 12-hour delay.
      </Text>
    ) : null;

  return (
    <View style={styles.root}>
      <AuroraBackground />
      {isFocused ? <StatusBar style="light" /> : null}

      <Animated.FlatList
        data={showSkeleton ? [] : rest}
        keyExtractor={(article) => article.url || article.id}
        renderItem={({ item }) => <NewsListItem article={item} onPress={() => openArticle(item)} />}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + APP_HEADER_BAR_HEIGHT + 8 },
        ]}
        refreshControl={
          <RefreshControl
            // Must mirror the real state, or Android's spinner can stay stuck.
            refreshing={feed.refreshing}
            onRefresh={feed.refresh}
            tintColor={aurora.lilac}
            colors={[aurora.violet]}
            progressBackgroundColor={aurora.backgroundRaised}
            progressViewOffset={insets.top + APP_HEADER_BAR_HEIGHT}
          />
        }
      />

      <AppHeader scrollY={scrollY} />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

type FeedTopProps = {
  lead: NewsArticle | undefined;
  loading: boolean;
  error: string | null;
  isSearch: boolean;
  onRetry: () => void;
  onOpen: (article: NewsArticle) => void;
};

/** The lead story, or a loading / setup / error / empty message. */
function FeedTop({ lead, loading, error, isSearch, onRetry, onOpen }: FeedTopProps) {
  if (!isGNewsConfigured) {
    return (
      <NewsMessage
        icon={KeyRound}
        title="Connect GNews"
        message={
          'Add your free API key from gnews.io/dashboard to .env:\nEXPO_PUBLIC_GNEWS_API_KEY=your_key\nThen restart Expo with --clear.'
        }
      />
    );
  }
  if (loading) return <NewsSkeleton />;
  if (lead) return <NewsHeroCard article={lead} onPress={() => onOpen(lead)} />;
  if (error) {
    return (
      <NewsMessage
        icon={WifiOff}
        title="Couldn't load the news"
        message={error}
        actionLabel="Try again"
        onAction={onRetry}
      />
    );
  }
  return (
    <NewsMessage
      icon={SearchX}
      title={isSearch ? 'No results' : 'No headlines right now'}
      message={isSearch ? 'Try different words, or clear the search.' : 'Pull down to refresh in a little while.'}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: aurora.background },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  headerBlock: { gap: 16, marginBottom: 12, marginTop: 4 },
  overline: {
    color: aurora.lilac,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { color: aurora.text, fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, letterSpacing: -0.6 },
  titleAccent: {
    color: aurora.lilac,
    fontFamily: fonts.lightItalic,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  inlineError: { color: aurora.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  separator: { height: 12 },
  footnote: {
    color: aurora.textSubtle,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 20,
  },
});
