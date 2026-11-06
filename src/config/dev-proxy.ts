import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Development-only routing of Firebase traffic through `scripts/api-proxy.js`
 * running on the developer's PC. Use it when the phone can reach the PC over
 * Wi-Fi but not Google's servers directly.
 *
 * Enable with `EXPO_PUBLIC_DEV_PROXY=on` in .env. The proxy host defaults to
 * the PC that serves the Metro bundle (same IP, port 8787). Override it with
 * `EXPO_PUBLIC_DEV_PROXY_HOST=192.168.x.x:8787`.
 *
 * Production builds (`__DEV__ === false`) never use the proxy.
 */
const DEFAULT_PORT = process.env.EXPO_PUBLIC_DEV_PROXY_PORT || '8787';

function resolveProxyHost(): string | null {
  if (!__DEV__ || Platform.OS === 'web') return null;
  if (process.env.EXPO_PUBLIC_DEV_PROXY !== 'on') return null;

  const explicit = process.env.EXPO_PUBLIC_DEV_PROXY_HOST;
  if (explicit) return explicit;

  // e.g. "192.168.1.72:8081": the PC running Metro.
  const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
  return metroHost ? `${metroHost}:${DEFAULT_PORT}` : null;
}

/** "192.168.1.72:8787" when the dev proxy is in use, otherwise null. */
export const devProxyHost: string | null = resolveProxyHost();

/** "http://192.168.1.72:8787" when the dev proxy is in use, otherwise null. */
export const devProxyUrl: string | null = devProxyHost ? `http://${devProxyHost}` : null;

/**
 * Routes a remote image through the dev proxy when it is on (the phone may not
 * reach image hosts directly). Returns the URL unchanged otherwise.
 */
export function proxiedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!devProxyUrl || !/^https?:\/\//i.test(url)) return url;
  return `${devProxyUrl}/img?url=${encodeURIComponent(url)}`;
}
