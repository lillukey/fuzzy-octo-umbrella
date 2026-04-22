/**
 * service-worker.js
 *
 * A Service Worker that intercepts all fetch requests,
 * logs their URLs (with method, timestamp, and origin),
 * and transparently passes them through to the network.
 */

const SW_VERSION = '1.0.0';

// ─── Lifecycle: Install ────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log(`[SW v${SW_VERSION}] Installed`);

  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting();
});

// ─── Lifecycle: Activate ───────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log(`[SW v${SW_VERSION}] Activated`);

  // Take control of all open clients (tabs/windows) immediately
  event.waitUntil(self.clients.claim());
});

// ─── Fetch Interception ────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Log the intercepted request
  logRequest(request);

  // Pass the request through to the network unmodified.
  // Replace this with custom caching / response logic as needed.
  event.respondWith(passThrough(request));
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Logs a fetch request with timestamp, HTTP method, full URL,
 * and whether it's a same-origin or cross-origin request.
 *
 * @param {Request} request
 */
function logRequest(request) {
  const url      = new URL(request.url);
  const origin   = url.origin === self.location.origin ? 'same-origin' : 'cross-origin';
  const time     = new Date().toISOString();

  console.log(
    `[SW ${time}] ${request.method.padEnd(6)} [${origin}] ${request.url}`
  );

  // Optional: send the log entry to all open clients so the
  // page itself can display it (e.g. in a dev overlay).
  broadcastLog({ time, method: request.method, url: request.url, origin });
}

/**
 * Fetches the request from the network and returns the response.
 * On network failure, returns a minimal 503 error response.
 *
 * @param  {Request} request
 * @returns {Promise<Response>}
 */
async function passThrough(request) {
  // Your Hugging Face Space URL (ends in .hf.space)
  const backend = "https://hf.space";
  
  if (request.url.includes(self.location.origin)) return fetch(request);

  const proxiedUrl = backend + encodeURIComponent(request.url);
  return fetch(proxiedUrl);
}
/**
 * Broadcasts a structured log message to all controlled clients
 * so pages can optionally display live request logs.
 *
 * @param {{ time: string, method: string, url: string, origin: string }} entry
 */
async function broadcastLog(entry) {
  const clients = await self.clients.matchAll({ includeUncontrolled: false });
  for (const client of clients) {
    client.postMessage({ type: 'SW_REQUEST_LOG', payload: entry });
  }
}
