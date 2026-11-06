import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { newsConfig } from '@/config/news';

import { describeNewsError, fetchTopHeadlines, searchNews } from './gnews-client';
import { useNewsStore } from './news-store';
import type { NewsArticle, NewsCategory, NewsRequest } from './types';

const CACHE_PREFIX = 'elora.news.v1.';

type CachedFeed = { fetchedAt: number; articles: NewsArticle[] };

export type NewsFeedState = {
  articles: NewsArticle[];
  /** True on first load when nothing is cached yet. */
  loading: boolean;
  /** True during pull-to-refresh. */
  refreshing: boolean;
  error: string | null;
  fetchedAt: number | null;
  refresh: () => void;
};

function cacheKey(request: NewsRequest): string {
  const base = `${newsConfig.country}.${newsConfig.language}.`;
  return CACHE_PREFIX + base + (request.kind === 'top' ? `top.${request.category}` : `q.${request.query.toLowerCase()}`);
}

async function readCache(key: string): Promise<CachedFeed | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CachedFeed) : null;
  } catch {
    return null;
  }
}

/** Rebuilds a request from its primitive parts (stable effect dependencies). */
function toRequest(kind: NewsRequest['kind'], value: string): NewsRequest {
  return kind === 'top' ? { kind, category: value as NewsCategory } : { kind, query: value };
}

function dedupe(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  return articles.filter((article) => {
    const key = article.url || article.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Loads a news feed with a cache-first strategy: cached articles show
 * instantly, and a fetch happens only when the cache is older than
 * `newsConfig.cacheMinutes` (or on pull-to-refresh). This keeps the Free
 * plan's 100 requests a day from running out.
 */
export function useNewsFeed(request: NewsRequest): NewsFeedState {
  const key = cacheKey(request);
  const [state, setState] = useState<Omit<NewsFeedState, 'refresh'>>({
    articles: [],
    loading: true,
    refreshing: false,
    error: null,
    fetchedAt: null,
  });
  const activeKey = useRef(key);

  const load = useCallback(async (feedKey: string, feedRequest: NewsRequest, force: boolean) => {
    const cached = await readCache(feedKey);
    if (activeKey.current !== feedKey) return;

    const isFresh = cached && Date.now() - cached.fetchedAt < newsConfig.cacheMinutes * 60_000;
    if (cached) {
      useNewsStore.getState().remember(cached.articles);
      setState((s) => ({ ...s, articles: cached.articles, fetchedAt: cached.fetchedAt, loading: false }));
    }
    if (isFresh && !force) {
      setState((s) => ({ ...s, refreshing: false, error: null }));
      return;
    }

    try {
      const response =
        feedRequest.kind === 'top'
          ? await fetchTopHeadlines(feedRequest.category)
          : await searchNews(feedRequest.query);
      if (activeKey.current !== feedKey) return;
      const articles = dedupe(response.articles);
      useNewsStore.getState().remember(articles);
      const fetchedAt = Date.now();
      setState({ articles, fetchedAt, loading: false, refreshing: false, error: null });
      void AsyncStorage.setItem(feedKey, JSON.stringify({ fetchedAt, articles } satisfies CachedFeed));
    } catch (error) {
      if (activeKey.current !== feedKey) return;
      setState((s) => ({ ...s, loading: false, refreshing: false, error: describeNewsError(error) }));
    }
  }, []);

  // Primitive parts of `request`, so a new object each render doesn't refetch.
  const kind = request.kind;
  const value = request.kind === 'top' ? request.category : request.query;

  useEffect(() => {
    activeKey.current = key;
    setState({ articles: [], loading: true, refreshing: false, error: null, fetchedAt: null });
    const feedRequest = toRequest(kind, value);
    void load(key, feedRequest, false);
  }, [key, kind, value, load]);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, refreshing: true }));
    const feedRequest = toRequest(kind, value);
    void load(key, feedRequest, true);
  }, [key, kind, value, load]);

  return { ...state, refresh };
}
