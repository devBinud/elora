#!/usr/bin/env node
/**
 * Elora development API proxy.
 *
 * Some Wi-Fi networks let the phone reach this PC but not Google's servers
 * (often broken IPv6). This proxy runs on the PC, which has working internet,
 * and forwards the app's Firebase traffic:
 *
 *   phone --(LAN, http)--> this proxy --(https, IPv4)--> Google APIs
 *
 * Usage:
 *   1. npm run proxy                  (or: node scripts/api-proxy.js)
 *   2. In .env set EXPO_PUBLIC_DEV_PROXY=on
 *   3. npx expo start --go --clear
 *
 * Development only. The app ignores the proxy in production builds.
 * No dependencies: uses Node's built-in http/https modules.
 */
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');

// Read project/region from .env so Cloud Functions calls can be routed.
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envFile);
}

const PORT = Number(process.env.EXPO_PUBLIC_DEV_PROXY_PORT || 8787);
const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '';
const REGION = process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION || 'asia-south1';

/**
 * Path prefix -> upstream host. The prefix is stripped before forwarding.
 * The app is configured (src/config/dev-proxy.ts) to send each service to
 * its prefix. Anything unmatched goes to Firestore.
 */
const ROUTES = [
  { prefix: '/identitytoolkit', host: 'identitytoolkit.googleapis.com' },
  { prefix: '/securetoken', host: 'securetoken.googleapis.com' },
  { prefix: '/functions', host: `${REGION}-${PROJECT_ID}.cloudfunctions.net` },
  { prefix: '/gnews', host: 'gnews.io' },
  { prefix: '', host: 'firestore.googleapis.com' },
];

/** Cloud Storage requests keep their path (/v0/b/<bucket>/...), so they are matched by it. */
const STORAGE = { pathStart: '/v0/b/', host: 'firebasestorage.googleapis.com' };

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-connection',
  'proxy-authorization',
  'transfer-encoding',
  'upgrade',
  'te',
  'trailer',
  'host',
]);

// Force IPv4 upstream and reuse connections.
const agent = new https.Agent({ keepAlive: true, family: 4 });

function resolveRoute(url) {
  if (url.startsWith(STORAGE.pathStart)) return { host: STORAGE.host, path: url };
  for (const route of ROUTES) {
    if (route.prefix === '') return { host: route.host, path: url };
    if (url === route.prefix || url.startsWith(`${route.prefix}/`) || url.startsWith(`${route.prefix}?`)) {
      return { host: route.host, path: url.slice(route.prefix.length) || '/' };
    }
  }
  return null;
}

function copyHeaders(source) {
  const result = {};
  for (const [name, value] of Object.entries(source)) {
    if (value !== undefined && !HOP_BY_HOP.has(name.toLowerCase())) result[name] = value;
  }
  return result;
}

function log(message) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${message}`);
}

/** Path without the query string, so API keys and tokens aren't printed. */
function displayPath(url) {
  const pathOnly = url.split('?')[0];
  return pathOnly.length > 90 ? `${pathOnly.slice(0, 87)}...` : pathOnly;
}

const BROWSER_UA =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36';

/**
 * Fetches a remote URL given as ?url= (following redirects) and streams it
 * back, but only if its content type passes `kind.allow`. Used for:
 *   GET /img?url=<image URL>   news images
 *   GET /page?url=<page URL>   article pages for the in-app reader
 */
const REMOTE_KINDS = {
  img: {
    label: 'IMG',
    accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
    allow: (type) => type.startsWith('image/'),
    cache: 'public, max-age=86400',
  },
  page: {
    label: 'PAGE',
    accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
    allow: (type) => type.includes('html'),
    cache: 'public, max-age=3600',
  },
};

async function proxyRemote(req, res, kind) {
  const started = Date.now();
  const target = new URL(req.url, 'http://localhost').searchParams.get('url') || '';
  if (req.method !== 'GET' || !/^https?:\/\//i.test(target)) {
    res.writeHead(400, { 'content-type': 'text/plain' });
    res.end('Expected GET ?url=<http(s) URL>');
    return;
  }
  try {
    const upstream = await fetch(target, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
      headers: { 'user-agent': BROWSER_UA, accept: kind.accept, 'accept-language': 'en-IN,en;q=0.9' },
    });
    const type = upstream.headers.get('content-type') || '';
    if (!upstream.ok || !kind.allow(type) || !upstream.body) {
      res.writeHead(upstream.ok ? 415 : upstream.status, { 'content-type': 'text/plain' });
      res.end(`Unexpected response (HTTP ${upstream.status}, ${type || 'no type'})`);
      log(`${kind.label} ${new URL(target).host} -> ${upstream.status} ${type} (${Date.now() - started}ms)`);
      return;
    }
    const headers = { 'content-type': type, 'cache-control': kind.cache };
    const length = upstream.headers.get('content-length');
    // Decompressed by fetch(), so the original length only applies if uncompressed.
    if (length && !upstream.headers.get('content-encoding')) headers['content-length'] = length;
    res.writeHead(200, headers);
    Readable.fromWeb(upstream.body).pipe(res);
    if (kind === REMOTE_KINDS.page) log(`PAGE ${new URL(target).host} -> 200 (${Date.now() - started}ms)`);
  } catch (error) {
    log(`${kind.label} ${target.slice(0, 80)} -> FAILED: ${error.message}`);
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('Fetch failed');
  }
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url === '/__health') {
    res.writeHead(204, { 'cache-control': 'no-store' });
    res.end();
    return;
  }

  if (url.startsWith('/img?')) {
    void proxyRemote(req, res, REMOTE_KINDS.img);
    return;
  }
  if (url.startsWith('/page?')) {
    void proxyRemote(req, res, REMOTE_KINDS.page);
    return;
  }

  const route = resolveRoute(url);
  const started = Date.now();
  const headers = copyHeaders(req.headers);
  headers.host = route.host;

  const upstream = https.request(
    { host: route.host, port: 443, method: req.method, path: route.path, headers, agent },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, copyHeaders(upstreamRes.headers));
      res.flushHeaders();
      upstreamRes.pipe(res);
      upstreamRes.on('end', () => {
        log(`${req.method} ${route.host}${displayPath(route.path)} -> ${upstreamRes.statusCode} (${Date.now() - started}ms)`);
      });
    },
  );

  upstream.on('error', (error) => {
    log(`${req.method} ${route.host}${displayPath(route.path)} -> FAILED: ${error.message}`);
    if (!res.headersSent) {
      res.writeHead(502, { 'content-type': 'application/json' });
    }
    res.end(JSON.stringify({ error: { code: 502, message: `Elora dev proxy: ${error.message}` } }));
  });

  // If the app gives up (e.g. a long-poll is cancelled), stop the upstream call too.
  res.on('close', () => {
    if (!upstream.destroyed) upstream.destroy();
  });

  req.pipe(upstream);
});

function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((info) => info && info.family === 'IPv4' && !info.internal)
    .map((info) => info.address);
}

function checkUpstream() {
  const started = Date.now();
  const request = https.get({ host: 'www.google.com', path: '/generate_204', agent }, (res) => {
    res.resume();
    log(`Internet check from this PC: HTTP ${res.statusCode} in ${Date.now() - started}ms`);
  });
  request.on('error', (error) => log(`Internet check from this PC FAILED: ${error.message}`));
  request.setTimeout(10_000, () => request.destroy(new Error('timed out')));
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Is the proxy already running?`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\nElora dev API proxy is running');
  for (const address of lanAddresses()) console.log(`  http://${address}:${PORT}`);
  console.log(`\nForwarding Firebase Auth, Firestore, Storage, Functions (${REGION}-${PROJECT_ID || '?'}), GNews and news images.`);
  console.log('Make sure EXPO_PUBLIC_DEV_PROXY=on is in .env, then restart Expo with --clear.');
  console.log('Press Ctrl+C to stop.\n');
  checkUpstream();
});
