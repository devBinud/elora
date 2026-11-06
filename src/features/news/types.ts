/** GNews categories (https://docs.gnews.io/endpoints/top-headlines-endpoint). */
export type NewsCategory =
  | 'general'
  | 'world'
  | 'nation'
  | 'business'
  | 'technology'
  | 'entertainment'
  | 'sports'
  | 'science'
  | 'health';

/** One article, as returned by GNews v4 (https://docs.gnews.io/json-response). */
export type NewsArticle = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  image: string | null;
  /** UTC ISO 8601, e.g. "2025-09-30T19:38:25Z". */
  publishedAt: string;
  lang?: string;
  source: { id?: string; name: string; url: string; country?: string };
};

export type NewsResponse = {
  totalArticles: number;
  articles: NewsArticle[];
};

/** What a feed shows: top headlines for a category, or search results. */
export type NewsRequest =
  | { kind: 'top'; category: NewsCategory }
  | { kind: 'search'; query: string };
