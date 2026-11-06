import { devProxyUrl } from '@/config/dev-proxy';
import { withTimeout } from '@/utils/with-timeout';

/**
 * Best-effort "reader view": downloads an article's web page and extracts its
 * readable paragraphs, so the story can be shown inside Elora instead of
 * opening the publisher's site. GNews' Free plan only includes the first 250
 * characters of each article.
 *
 * In development the page is fetched through the PC proxy (`/page?url=`).
 * Returns an empty list when the text can't be extracted (paywalls, apps
 * that render with JavaScript, blocked requests).
 */

const MIN_PARAGRAPH_LENGTH = 40;
const MAX_PARAGRAPHS = 80;
const BOILERPLATE =
  /(subscribe|newsletter|sign up|sign in|log in|cookie|all rights reserved|advertisement|click here|download the app|follow us|read more:|also read|recommended for you|terms of use|privacy policy)/i;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  hellip: '…',
  rupee: '₹',
  bull: '•',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code =
        entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function toPlainText(html: string): string {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Finds the longest `articleBody` string anywhere in parsed JSON-LD. */
function findArticleBody(node: unknown): string | null {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    let best: string | null = null;
    for (const item of node) {
      const found = findArticleBody(item);
      if (found && (!best || found.length > best.length)) best = found;
    }
    return best;
  }
  const record = node as Record<string, unknown>;
  let best = typeof record.articleBody === 'string' ? record.articleBody : null;
  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      const found = findArticleBody(value);
      if (found && (!best || found.length > best.length)) best = found;
    }
  }
  return best;
}

/** Splits a long body into paragraphs: on line breaks, else every ~3 sentences. */
function splitIntoParagraphs(text: string): string[] {
  const byLines = text
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);
  if (byLines.length >= 2) return byLines;

  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+["”’)]*\s*/g) ?? [text];
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    paragraphs.push(sentences.slice(i, i + 3).join('').trim());
  }
  return paragraphs.filter(Boolean);
}

/** Many news sites embed the full story as schema.org `articleBody` JSON-LD. */
function extractFromJsonLd(html: string): string[] {
  let best: string | null = null;
  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const body = findArticleBody(JSON.parse(match[1].trim()));
      if (body && (!best || body.length > best.length)) best = body;
    } catch {
      // Malformed JSON-LD: skip it.
    }
  }
  if (!best || best.length < 200) return [];
  const text = decodeEntities(best.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, ''));
  return splitIntoParagraphs(text).slice(0, MAX_PARAGRAPHS);
}

/**
 * Extracts readable paragraphs from an HTML document: the page's JSON-LD
 * `articleBody` or its <p> text, whichever holds more of the story.
 */
export function extractParagraphs(html: string): string[] {
  const fromJsonLd = extractFromJsonLd(html);
  const fromMarkup = extractFromMarkup(html);
  const length = (list: string[]) => list.reduce((sum, p) => sum + p.length, 0);
  return length(fromJsonLd) >= length(fromMarkup) ? fromJsonLd : fromMarkup;
}

function extractFromMarkup(html: string): string[] {
  let doc = html.replace(
    /<(script|style|noscript|svg|nav|footer|header|aside|form|figcaption|button|iframe)\b[\s\S]*?<\/\1>/gi,
    ' ',
  );

  // Prefer the largest <article> block when the page has one.
  const articles = doc.match(/<article\b[\s\S]*?<\/article>/gi);
  if (articles && articles.length > 0) {
    const largest = articles.reduce((a, b) => (b.length > a.length ? b : a));
    if (largest.length > 1500) doc = largest;
  }

  const seen = new Set<string>();
  const paragraphs: string[] = [];
  for (const match of doc.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = toPlainText(match[1]);
    if (text.length < MIN_PARAGRAPH_LENGTH || BOILERPLATE.test(text) || seen.has(text)) continue;
    seen.add(text);
    paragraphs.push(text);
    if (paragraphs.length >= MAX_PARAGRAPHS) break;
  }
  return paragraphs.length >= 2 ? paragraphs : [];
}

const cache = new Map<string, string[]>();

export async function fetchArticleParagraphs(url: string): Promise<string[]> {
  const cached = cache.get(url);
  if (cached) return cached;

  const target = devProxyUrl ? `${devProxyUrl}/page?url=${encodeURIComponent(url)}` : url;
  const response = await withTimeout(fetch(target, { headers: { Accept: 'text/html' } }), 20_000, 'Article');
  if (!response.ok) return [];
  const paragraphs = extractParagraphs(await response.text());
  cache.set(url, paragraphs);
  return paragraphs;
}

/** GNews content without its "... [1862 chars]" truncation marker. */
export function cleanSnippet(content: string | null): string | null {
  if (!content) return null;
  return content.replace(/\s*\[\+?\d+\s*chars?\]\s*$/i, '').trim() || null;
}
