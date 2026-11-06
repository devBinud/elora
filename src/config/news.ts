import type { NewsCategory } from '@/features/news/types';

/**
 * News settings (GNews API, https://docs.gnews.io).
 *
 * Your API key goes in .env as EXPO_PUBLIC_GNEWS_API_KEY (get it from
 * https://gnews.io/dashboard). Restart Expo with --clear after adding it.
 *
 * Free plan: 100 requests a day, 10 articles per request, 1 request per
 * second, and headlines arrive with a 12-hour delay. Elora caches each feed
 * for `cacheMinutes` so browsing doesn't use up the quota.
 */
export const newsConfig = {
  /** 2-letter country code, e.g. 'in' (India), 'us', 'gb'. */
  country: 'in',
  /** Display name for the country, shown above the headlines. */
  countryName: 'India',
  /** 2-letter language code, e.g. 'en' (English), 'hi' (Hindi). */
  language: 'en',
  /** Articles per request (Free plan maximum is 10). */
  pageSize: 10,
  /** How long a loaded feed is reused before fetching again. */
  cacheMinutes: 30,
  /** Category chips, in order. `id` must be a GNews category. */
  categories: [
    { id: 'general', label: 'Top stories' },
    { id: 'nation', label: 'India' },
    { id: 'world', label: 'World' },
    { id: 'business', label: 'Business' },
    { id: 'technology', label: 'Tech' },
    { id: 'sports', label: 'Sports' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'science', label: 'Science' },
    { id: 'health', label: 'Health' },
  ] satisfies { id: NewsCategory; label: string }[],
};
