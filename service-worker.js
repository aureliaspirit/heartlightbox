const CACHE_NAME = "heartbox-pwa-v1-9-27b";
const BEDSTATE_VERSION = "1.9.27";
const BEDSTATE_SCRIPT = `./bedstate.js?v=${BEDSTATE_VERSION}`;
const ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=1.9.26",
  "./app.js?v=1.9.26",
  BEDSTATE_SCRIPT,
  "./manifest.json?v=1.9.26",
  "./icons/icon-120.png",
  "./icons/icon-152.png",
  "./icons/icon-167.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
const PRECACHED_URLS = new Set(ASSETS.map((asset) => new URL(asset, self.location.href).href));

function isAppScript(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin && url.pathname.endsWith("/app.js");
}

function isAppShell(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin && (request.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/"));
}

async function withBedstateHtml(response) {
  if (!response || !response.ok) return response;
  const html = await response.text();
  if (html.includes("bedstate.js")) {
    return new Response(html, response);
  }
  const injected = html.includes("</body>")
    ? html.replace("</body>", `  <script src="${BEDSTATE_SCRIPT}"></script>\n</body>`)
    : `${html}\n<script src="${BEDSTATE_SCRIPT}"></script>`;
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(injected, { status: response.status, statusText: response.statusText, headers });
}

async function withBedstateModule(response) {
  if (!response || !response.ok) return response;
  const source = await response.text();
  if (source.includes("bedstate.js")) {
    return new Response(source, response);
  }
  const decorated = `${source}\n\n// Heartbox v${BEDSTATE_VERSION}: 主被窝状态生成器\nimport(\"${BEDSTATE_SCRIPT}\").catch(() => {});\n`;
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "application/javascript; charset=utf-8");
  return new Response(decorated, { status: response.status, statusText: response.statusText, headers });
}

async function putFreshCopy(request) {
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    putFreshCopy(request).catch(() => {});
    return cached;
  }
  return putFreshCopy(request);
}

async function navigationFallback(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put("./index.html", response.clone());
    }
    return withBedstateHtml(response.clone());
  } catch {
    const cached = (await caches.match("./index.html")) || (await caches.match("./"));
    return withBedstateHtml(cached);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith("heartbox-pwa-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (isAppShell(event.request)) {
    event.respondWith(navigationFallback(event.request));
    return;
  }

  if (isAppScript(event.request)) {
    event.respondWith(cacheFirst(event.request).then(withBedstateModule));
    return;
  }

  if (url.origin === self.location.origin && PRECACHED_URLS.has(url.href)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
