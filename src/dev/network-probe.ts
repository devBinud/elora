import { devProxyUrl } from '@/config/dev-proxy';
import { firebaseEnv } from '@/config/env';

/**
 * Development-only connectivity check. Logs how long the device takes to
 * reach the endpoints Firebase depends on, to diagnose network problems.
 */
type Probe = { label: string; url: string; init?: RequestInit };

const lookupInit: RequestInit = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
};

const PROXY_PROBES: Probe[] = devProxyUrl
  ? [
      { label: 'dev proxy', url: `${devProxyUrl}/__health` },
      {
        label: 'firebase auth via proxy',
        url: `${devProxyUrl}/identitytoolkit/v1/accounts:lookup?key=${firebaseEnv.apiKey}`,
        init: lookupInit,
      },
    ]
  : [];

const DIRECT_PROBES: Probe[] = [
  { label: 'google.com', url: 'https://www.google.com/generate_204' },
  {
    label: 'firebase auth',
    url: `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseEnv.apiKey}`,
    init: lookupInit,
  },
  { label: 'firestore', url: 'https://firestore.googleapis.com/' },
];

async function probe(label: string, url: string, init?: RequestInit): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  const started = Date.now();
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    await response.text();
    console.log(`[net] ${label}: HTTP ${response.status} in ${Date.now() - started}ms`);
  } catch (error) {
    console.log(`[net] ${label}: FAILED after ${Date.now() - started}ms`, String(error));
  } finally {
    clearTimeout(timer);
  }
}

export function runNetworkProbe(): void {
  if (!__DEV__) return;
  const probes = devProxyUrl ? PROXY_PROBES : DIRECT_PROBES;
  console.log(`[net] probing connectivity${devProxyUrl ? ` via ${devProxyUrl}` : ''}...`);
  for (const { label, url, init } of probes) void probe(label, url, init);
}
