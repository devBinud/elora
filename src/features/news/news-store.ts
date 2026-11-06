import { create } from 'zustand';

import type { NewsArticle } from './types';

type NewsStore = {
  /** Articles seen in any feed this session, by id, for the detail screen. */
  articlesById: Record<string, NewsArticle>;
  remember: (articles: NewsArticle[]) => void;
};

export const useNewsStore = create<NewsStore>()((set) => ({
  articlesById: {},
  remember: (articles) =>
    set((state) => {
      const next = { ...state.articlesById };
      for (const article of articles) next[articleKey(article)] = article;
      return { articlesById: next };
    }),
}));

/** Stable id for routing (GNews ids, falling back to the URL). */
export function articleKey(article: NewsArticle): string {
  return article.id || article.url;
}
