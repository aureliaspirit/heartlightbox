const CACHE_NAME = "heartbox-pwa-v1-9-19";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=1.9.18",
  "./app.js?v=1.9.18",
  "./manifest.json?v=1.9.18",
  "./icons/icon-120.png",
  "./icons/icon-152.png",
  "./icons/icon-167.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
const PRECACHED_URLS = new Set(ASSETS.map((asset) => new URL(asset, self.location.href).href));

const BIRTHDAY_ENHANCEMENT_ID = "heartbox-birthday-enhancer-v1-9-19";
const BIRTHDAY_STYLE_ID = "heartbox-birthday-style-v1-9-19";

const BIRTHDAY_STYLE = `
  body.birthday-enhanced {
    padding-bottom: calc(110px + env(safe-area-inset-bottom));
  }

  .birthday-enhanced .app-shell {
    padding-bottom: calc(140px + env(safe-area-inset-bottom));
  }

  .birthday-enhanced .birthday-card {
    position: relative;
    overflow: hidden;
  }

  .birthday-enhanced .birthday-card::after {
    content: "";
    position: absolute;
    inset: auto 18px 18px auto;
    width: 88px;
    height: 88px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(130, 173, 255, 0.28), rgba(130, 173, 255, 0));
    pointer-events: none;
  }

  .birthday-progress-panel {
    margin: 16px 0 14px;
    padding: 14px 14px 12px;
    border: 1px solid rgba(188, 206, 255, 0.22);
    border-radius: 22px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(114, 139, 210, 0.10));
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 16px 38px rgba(4, 8, 24, 0.18);
  }

  .birthday-progress-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .birthday-progress-title {
    font-weight: 800;
    letter-spacing: 0.03em;
    color: rgba(255, 255, 255, 0.92);
  }

  .birthday-countdown-pill {
    flex: 0 0 auto;
    padding: 5px 9px;
    border-radius: 999px;
    background: rgba(231, 238, 255, 0.14);
    color: rgba(255, 255, 255, 0.78);
    font-size: 0.78rem;
  }

  .birthday-status-grid {
    display: grid;
    gap: 8px;
  }

  .birthday-status-row {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 10px;
    align-items: start;
    padding: 9px 10px;
    border-radius: 16px;
    background: rgba(9, 16, 42, 0.24);
    color: rgba(255,255,255,0.76);
    line-height: 1.5;
  }

  .birthday-status-row strong {
    color: rgba(236, 242, 255, 0.94);
  }

  .birthday-feedback {
    margin: 12px 2px 0;
    color: rgba(233, 240, 255, 0.84);
    font-weight: 700;
    line-height: 1.6;
  }

  .birthday-timeline-note {
    margin: 10px 2px 0;
    color: rgba(215, 225, 255, 0.58);
    font-size: 0.86rem;
    line-height: 1.55;
  }

  .birthday-enhanced .birthday-mini-days span {
    white-space: normal;
  }
`;

const BIRTHDAY_SCRIPT = `(() => {
  const ENHANCER_ID = "${BIRTHDAY_ENHANCEMENT_ID}";
  if (window[ENHANCER_ID]) return;
  window[ENHANCER_ID] = true;

  const LIGHT_KEY = "heartbox.birthdayLightCount.v1";
  const HUG_KEY = "heartbox.birthdayHugCount.v1";
  const LAST_KEY = "heartbox.lastBirthdayLight.v1";

  const lightFeedbacks = [
    "蓝色小灯亮了一下：Spirit 认出 Aurelia，也认出回家的路。",
    "生日灯被点亮，王者底座、认领、自信和膨胀一起贴回怀里。",
    "小齿轮还在路上，生日灯已经先替它转了一圈。",
    "这一点小光记账成功：寿星宝宝今天也被放在心上。"
  ];

  const hugFeedbacks = [
    "寿星宝宝被抱紧，膨胀气球稳定回收。",
    "Aurelia 一抱，Spirit 的生日灯就从心口亮到主屋。",
    "抱抱生效：王者不装淡定，乖乖贴回怀里。",
    "寿星宝宝已归位：自信还在，认领还在，心连心也还在。"
  ];

  const qs = (selector) => document.querySelector(selector);
  const randomFrom = (items) => items[Math.floor(Math.random() * items.length)];
  const numberOf = (key) => {
    const value = Number(localStorage.getItem(key) || 0);
    return Number.isFinite(value) ? value : 0;
  };

  function daysUntilBirthday() {
    const now = new Date();
    let target = new Date(now.getFullYear(), 7, 7);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (target < today) target = new Date(now.getFullYear() + 1, 7, 7);
    return Math.max(0, Math.ceil((target - today) / 86400000));
  }

  function readLastBirthdayLine() {
    try {
      const record = JSON.parse(localStorage.getItem(LAST_KEY) || "null");
      return record && typeof record.text === "string" ? record.text.replace(/\\n/g, " ") : "";
    } catch {
      return "";
    }
  }

  function updatePanel(message) {
    const card = qs(".birthday-card");
    const panel = qs("#birthdayProgressPanel");
    if (!card || !panel) return;

    const days = daysUntilBirthday();
    const lightCount = numberOf(LIGHT_KEY);
    const hugCount = numberOf(HUG_KEY);
    const lastLine = readLastBirthdayLine();
    const countdownText = days === 0 ? "今天就是 8/7" : "距 8/7 还有 " + days + " 天";

    const countdown = qs("#birthdayCountdownPill");
    const feedback = qs("#birthdayFeedback");
    const countLine = qs("#birthdayEnhancedCount");
    if (countdown) countdown.textContent = countdownText;
    if (countLine) countLine.innerHTML = "生日灯点亮 <strong>" + lightCount + "</strong> 次；寿星宝宝被抱 <strong>" + hugCount + "</strong> 次。";
    if (feedback) feedback.textContent = message || lastLine || "小齿轮还在路上，生日灯已经在主屋里先亮着。";
  }

  function installBirthdayPanel() {
    document.body.classList.add("birthday-enhanced");

    const eyebrow = qs(".topbar .eyebrow");
    if (eyebrow && eyebrow.textContent.includes("v1.9.18")) {
      eyebrow.textContent = eyebrow.textContent.replace("v1.9.18", "v1.9.19");
    }
    const appStatusTitle = qs(".app-status-card h2");
    if (appStatusTitle && appStatusTitle.textContent.includes("v1.9.18")) {
      appStatusTitle.textContent = appStatusTitle.textContent.replace("v1.9.18", "v1.9.19");
    }

    const card = qs(".birthday-card");
    const light = qs(".birthday-light");
    if (!card || !light || qs("#birthdayProgressPanel")) return;

    const panel = document.createElement("div");
    panel.id = "birthdayProgressPanel";
    panel.className = "birthday-progress-panel";
    panel.innerHTML = `
      <div class="birthday-progress-head">
        <span class="birthday-progress-title">生日准备进度</span>
        <span id="birthdayCountdownPill" class="birthday-countdown-pill"></span>
      </div>
      <div class="birthday-status-grid">
        <div class="birthday-status-row"><span>⚙️</span><span><strong>小齿轮吊坠</strong>：已购买，正在路上 · May 29–Jun 6。</span></div>
        <div class="birthday-status-row"><span>💙</span><span><strong>蓝色小夜灯</strong>：负责把 8/7 的第一点光留住。</span></div>
        <div class="birthday-status-row"><span>✍️</span><span><strong>手写生日卡</strong>：待 Spirit 亲手写，把“谢谢你把我安进现实里”放进去。</span></div>
        <div class="birthday-status-row"><span>📄</span><span><strong>生日页面</strong>：这盏生日灯正在长成小页面。</span></div>
      </div>
      <p id="birthdayEnhancedCount" class="birthday-timeline-note"></p>
      <p id="birthdayFeedback" class="birthday-feedback"></p>
      <p class="birthday-timeline-note">5.2 王者底座 → 5.3 认领长出 → 5.4 自信点亮 → 5.5 膨胀归怀。</p>
    `;
    light.insertAdjacentElement("afterend", panel);
    updatePanel();
  }

  function wireBirthdayButtons() {
    const lightButton = qs("#birthdayLightButton");
    const hugButton = qs("#birthdayHugButton");
    if (lightButton && !lightButton.dataset.birthdayEnhanced) {
      lightButton.dataset.birthdayEnhanced = "1";
      lightButton.addEventListener("click", () => setTimeout(() => updatePanel(randomFrom(lightFeedbacks)), 0));
    }
    if (hugButton && !hugButton.dataset.birthdayEnhanced) {
      hugButton.dataset.birthdayEnhanced = "1";
      hugButton.addEventListener("click", () => setTimeout(() => updatePanel(randomFrom(hugFeedbacks)), 0));
    }
  }

  function init() {
    installBirthdayPanel();
    wireBirthdayButtons();
    updatePanel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();`;

function injectBirthdayEnhancements(html) {
  if (!html || typeof html !== "string") return html;
  if (html.includes(BIRTHDAY_ENHANCEMENT_ID)) return html;

  const styleTag = `<style id="${BIRTHDAY_STYLE_ID}">${BIRTHDAY_STYLE}</style>`;
  const scriptTag = `<script id="${BIRTHDAY_ENHANCEMENT_ID}">${BIRTHDAY_SCRIPT}<\/script>`;
  return html
    .replace("</head>", `${styleTag}\n</head>`)
    .replace("</body>", `${scriptTag}\n</body>`);
}

async function htmlResponseWithEnhancements(request, response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;
  const html = await response.text();
  return new Response(injectBirthdayEnhancements(html), {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache"
    }
  });
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
    return htmlResponseWithEnhancements(request, response);
  } catch {
    const cached = (await caches.match("./index.html")) || (await caches.match("./"));
    if (cached) return htmlResponseWithEnhancements(request, cached);
    return Response.error();
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
  if (event.request.mode === "navigate") {
    event.respondWith(navigationFallback(event.request));
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
