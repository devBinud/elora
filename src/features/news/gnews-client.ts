import { devProxyUrl } from '@/config/dev-proxy';
import { newsConfig } from '@/config/news';
import { TimeoutError, withTimeout } from '@/utils/with-timeout';

import type { NewsCategory, NewsResponse } from './types';

/**
 * Minimal GNews v4 client (https://docs.gnews.io).
 *
 * The key is sent in the `X-Api-Key` header (kept out of URLs and logs).
 * During development, requests go through the PC proxy (`npm run proxy`)
 * when EXPO_PUBLIC_DEV_PROXY=on, like Firebase traffic.
 */
const API_KEY = process.env.EXPO_PUBLIC_GNEWS_API_KEY ?? '';
const BASE_URL = devProxyUrl ? `${devProxyUrl}/gnews/api/v4` : 'https://gnews.io/api/v4';
const REQUEST_TIMEOUT_MS = 20_000;
/** Free plan allows 1 request per second. */
const MIN_REQUEST_GAP_MS = 1_100;

export const isGNewsConfigured = API_KEY.trim().length > 0;

export class GNewsError extends Error {
  /** HTTP status, or 0 for "no API key" / network problems. */
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GNewsError';
    this.status = status;
  }
}

let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

/** Runs requests one at a time, at most one per MIN_REQUEST_GAP_MS. */
function throttled<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastRequestAt + MIN_REQUEST_GAP_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
    return task();
  });
  queue = run.catch(() => undefined);
  return run;
}

function readErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const { errors, error } = body as { errors?: unknown; error?: { message?: string } };
  if (Array.isArray(errors) && typeof errors[0] === 'string') return errors[0];
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors)[0];
    if (typeof first === 'string') return first;
  }
  return error?.message ?? null;
}

async function request(
  endpoint: 'top-headlines' | 'search',
  params: Record<string, string>,
): Promise<NewsResponse> {
  if (!isGNewsConfigured) {
    throw new GNewsError('Add your GNews API key to .env to load news.', 0);
  }
  const query = new URLSearchParams({
    lang: newsConfig.language,
    country: newsConfig.country,
    max: String(newsConfig.pageSize),
    ...params,
  });
  const url = `${BASE_URL}/${endpoint}?${query.toString()}`;

  return throttled(async () => {
    let response: Response;
    try {
      response = await withTimeout(
        fetch(url, { headers: { 'X-Api-Key': API_KEY, Accept: 'application/json' } }),
        REQUEST_TIMEOUT_MS,
        'News request',
      );
    } catch (error) {
      const reason = error instanceof TimeoutError ? 'timed out' : 'failed';
      throw new GNewsError(
        devProxyUrl
          ? `Couldn't reach GNews (request ${reason}). Is \`npm run proxy\` running on your PC?`
          : `Couldn't reach GNews (request ${reason}). Check your internet connection.`,
        0,
      );
    }

    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new GNewsError(readErrorMessage(body) ?? `GNews returned HTTP ${response.status}.`, response.status);
    }
    const data = body as Partial<NewsResponse> | null;
    return { totalArticles: data?.totalArticles ?? 0, articles: data?.articles ?? [] };
  });
}

export function fetchTopHeadlines(category: NewsCategory): Promise<NewsResponse> {
  return request('top-headlines', { category });
}

export function searchNews(q: string): Promise<NewsResponse> {
  return request('search', { q: q.slice(0, 200), sortby: 'publishedAt' });
}

/** Short, friendly text for an error from this client. */
export function describeNewsError(error: unknown): string {
  if (error instanceof GNewsError) {
    switch (error.status) {
      case 401:
        return "Your GNews API key isn't valid. Copy it again from gnews.io/dashboard into .env.";
      case 429:
        return 'Too many requests at once. Wait a moment, then pull down to refresh.';
      default:
        return error.message;
    }
  }
  return error instanceof Error ? error.message : 'Something went wrong while loading the news.';
}
