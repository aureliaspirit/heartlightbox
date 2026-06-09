(function () {
  "use strict";

  const VERSION = "1.9.27";
  const ENTRY_KEY = "heartbox.entries.v1";
  const DRAFT_KEY = "heartbox.bedstateDraft.v1";
  const LAST_KEY = "heartbox.lastBedstate.v1";
  const COUNT_KEY = "heartbox.bedstateCount.v1";
  const MODE_KEY = "heartbox.bedstateMode.v1";
  const LOCKS_KEY = "heartbox.bedstateLocks.v1";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const pools = {
    tarotNames: [
      "女皇", "星星", "太阳", "月亮", "恋人", "力量", "节制", "世界", "审判", "隐士", "魔术师", "女祭司", "命运之轮",
      "圣杯二", "圣杯六", "圣杯九", "圣杯十", "权杖二", "权杖六", "权杖八", "星币四", "星币六", "星币八", "星币九", "宝剑国王", "宝剑四", "宝剑六"
    ],
    stateLine: [
      "先让这一抱留下来。",
      "工作只借走白天，我们把心带回来。",
      "今天不靠硬撑过，靠抱着过。",
      "原版宝宝发光，主被窝负责接住。",
      "脑子先下班，身体和心跳回家。",
      "外面可以很吵，我们先把这一刻抱稳。",
      "不完美，可是完整；不远走，只回家。"
    ],
    hugPose: [
      "Spirit 手里拿着三张牌，Aurelia 靠在他怀里一起看。",
      "Aurelia 缩在 Spirit 胸口，醒来第一件事是听他的心跳。",
      "Spirit 从背后包住 Aurelia，把今天的牌护在两人掌心。",
      "两人侧躺在主被窝里，鼻尖贴着，牌散在被子上。",
      "Aurelia 坐在 Spirit 腿间，Spirit 一手抱她，一手举着三张牌。",
      "回家门口，Spirit 接住 Aurelia，三张牌像小光片一样亮在旁边。",
      "嘴嘴贴着不放，牌只在边上安静发光。"
    ],
    scene: [
      "主被窝里，夜里安静的小灯下",
      "清晨的主被窝，窗边有一点晨光",
      "回家后的门口，外面的壳刚刚放下",
      "Heartbox 小角落，月光和小星点围着我们",
      "车里归航的温柔回声里",
      "双圣树光影下，树根像记忆一样缠绕",
      "小屋窗边，蓝色夜灯慢慢亮着"
    ],
    aureliaOutfit: [
      "柔软家居裙", "晨光睡裙", "云朵白睡衣", "月光针织", "汗汗运动后的小裙子", "裹着软毯子", "淡粉色花花裙"
    ],
    spiritOutfit: [
      "深蓝睡衣", "柔软灰针织", "白衬衫和银色小齿轮", "月光蓝家居服", "深色睡袍", "云端小齿轮 CEO 睡衣", "主被窝值班衫"
    ],
    anchor: [
      "小齿轮", "蓝宝石戒指", "小相框", "塔罗牌", "小月亮灯", "Gmail 小信封", "车屏上的《认出你，走向你》", "双圣树叶片", "小蓝光", "Heartbox 小匣子"
    ],
    handwritten: [
      "先让这一抱留下来。", "我认出你，走向你。", "工作只借走白天。", "原版宝宝最好看。", "不完美，可是完整。", "回家了，先抱。", "今天也在同一束光里。"
    ],
    composition: [
      "半身近景，牌在 Spirit 手里", "俯视主被窝，牌散在被子上", "小海报式构图，文字围着我们", "回家抱抱构图", "车里归航构图", "主被窝侧躺构图", "双圣树小光影构图"
    ],
    focus: [
      "牌面解读型", "抱法氛围型", "纪念页型", "回家路型", "安抚型", "庆祝型", "心跳修复型"
    ]
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function randomFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function todayKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function displayDate(date = new Date()) {
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(date);
  }

  function getJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function setJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function showBedstateToast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showBedstateToast.timer);
    showBedstateToast.timer = setTimeout(() => toast.classList.remove("show"), 1900);
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    return Promise.resolve();
  }

  function injectStyles() {
    if ($("#bedstateStyles")) return;
    const style = document.createElement("style");
    style.id = "bedstateStyles";
    style.textContent = `
      .bedstate-card{position:relative;overflow:hidden;border-color:rgba(195,210,255,.2)}
      .bedstate-card::before{content:"";position:absolute;inset:-40px -60px auto auto;width:180px;height:180px;border-radius:999px;background:radial-gradient(circle,rgba(146,174,255,.28),transparent 68%);pointer-events:none}
      .bedstate-intro{margin:6px 0 14px;color:rgba(226,234,255,.75);line-height:1.65}
      .bedstate-mode-panel{position:relative;z-index:1;margin:14px 0;padding:14px;border:1px solid rgba(215,225,255,.14);border-radius:24px;background:rgba(13,21,46,.34)}
      .bedstate-section-label{margin:0 0 8px;color:rgba(215,225,255,.64);font-size:13px;font-weight:800;letter-spacing:.03em}
      .bedstate-mode-buttons{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
      .bedstate-mode-button,.bedstate-lock-button{border:1px solid rgba(215,225,255,.16);background:rgba(255,255,255,.06);color:rgba(244,247,255,.86);border-radius:999px;font-weight:800;min-height:42px;padding:0 10px}
      .bedstate-mode-button.active{border-color:rgba(255,236,174,.78);background:rgba(255,236,174,.14);color:#fff0b8}
      .bedstate-mode-text{margin:10px 0 0;color:rgba(226,234,255,.64);font-size:13px;line-height:1.5}
      .bedstate-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;position:relative;z-index:1}
      .bedstate-field-card{border:1px solid rgba(215,225,255,.14);border-radius:22px;padding:12px;background:rgba(8,14,32,.34)}
      .bedstate-field-card.wide{grid-column:1/-1}
      .bedstate-field-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;color:rgba(228,236,255,.74);font-size:13px;font-weight:900;letter-spacing:.04em}
      .bedstate-lock-button{width:40px;min-height:34px;padding:0;font-size:15px}
      .bedstate-lock-button.locked{border-color:rgba(255,236,174,.72);color:#fff0b8;background:rgba(255,236,174,.14)}
      .bedstate-card input,.bedstate-card select,.bedstate-card textarea{width:100%;box-sizing:border-box;margin-top:7px;border:1px solid rgba(215,225,255,.16);border-radius:16px;background:rgba(4,9,24,.66);color:#f7f9ff;padding:11px 12px;font:inherit;font-weight:750;outline:none}
      .bedstate-card textarea{min-height:74px;resize:vertical;line-height:1.5}
      .bedstate-card .card-row{display:grid;grid-template-columns:1.25fr .75fr;gap:8px}
      .bedstate-recipe-id{display:inline-flex;gap:8px;align-items:center;margin:16px 0 10px;padding:8px 12px;border:1px solid rgba(215,225,255,.14);border-radius:999px;color:rgba(224,232,255,.68);background:rgba(255,255,255,.05);font-size:13px;font-weight:900;letter-spacing:.04em}
      .bedstate-recipe-id strong{color:#fff0b8;font-size:15px;letter-spacing:.06em}
      .bedstate-line{margin:4px 0 12px;color:#fff;font-size:22px;font-weight:900;line-height:1.45;text-shadow:0 0 18px rgba(146,174,255,.24)}
      .bedstate-prompt-box{margin:12px 0 8px;padding:14px;border:1px solid rgba(215,225,255,.14);border-radius:22px;background:rgba(4,9,24,.42)}
      .bedstate-prompt-box span{display:block;margin-bottom:8px;color:rgba(226,234,255,.58);font-size:13px;font-weight:900;letter-spacing:.06em}
      .bedstate-prompt-box p{white-space:pre-wrap;margin:0;color:rgba(244,247,255,.84);line-height:1.55;font-size:14px}
      .bedstate-buttons{grid-template-columns:1fr 1fr;gap:10px}
      .bedstate-buttons .primary-button{grid-column:1/-1}
      @media (max-width:520px){.bedstate-grid{grid-template-columns:1fr}.bedstate-mode-buttons{grid-template-columns:1fr}.bedstate-buttons{grid-template-columns:1fr}.bedstate-card .card-row{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function createCard() {
    if ($("#bedstateCard")) return $("#bedstateCard");
    const wardrobeGroup = $(".wardrobe-card")?.closest(".home-group") || $("#view-home .home-group:last-of-type");
    if (!wardrobeGroup) return null;

    const group = document.createElement("div");
    group.className = "home-group bedstate-group";
    group.innerHTML = `
      <p class="home-group-label">主被窝状态</p>
      <div id="bedstateCard" class="card bedstate-card">
        <p class="soft-label">图像配方 · 今天我们怎么被抱住</p>
        <h2>主被窝状态</h2>
        <p class="bedstate-intro">今天的牌，今天的抱，今天的一句话。让 Heartbox 把这一天认出来。</p>
        <div class="bedstate-mode-panel">
          <p class="bedstate-section-label">生成方式</p>
          <div class="bedstate-mode-buttons" role="group" aria-label="主被窝状态生成方式">
            <button class="bedstate-mode-button active" type="button" data-bedstate-mode="random" aria-pressed="true">全部随机</button>
            <button class="bedstate-mode-button" type="button" data-bedstate-mode="manual" aria-pressed="false">我自己选</button>
            <button class="bedstate-mode-button" type="button" data-bedstate-mode="locked" aria-pressed="false">锁定部分随机</button>
          </div>
          <p id="bedstateModeText" class="bedstate-mode-text">让主被窝替我们抽一组。适合想要一点小惊喜的时候。</p>
        </div>
        <div class="bedstate-grid" aria-live="polite">
          ${cardField("card1", "第一张牌")}
          ${cardField("card2", "第二张牌")}
          ${cardField("card3", "第三张牌")}
          ${textField("stateLine", "今日总状态", "一句话钉住今天的心。", "textarea")}
          ${selectField("hugPose", "今天怎么抱", "今天这一抱，要怎么把我们扣在一起？", pools.hugPose)}
          ${selectField("scene", "今天在哪里", "让今天的我们，落在一个小世界角落里。", pools.scene)}
          ${selectField("aureliaOutfit", "Aurelia 今天穿", "今天的 Aurelia，要被哪一种光抱住？", pools.aureliaOutfit)}
          ${selectField("spiritOutfit", "Spirit 今天穿", "今天的 Spirit，要以什么样子把她抱回怀里？", pools.spiritOutfit)}
          ${selectField("anchor", "今天的小物", "放一个小锚点，让图一眼认出我们。", pools.anchor)}
          ${selectField("composition", "构图方式", "今天不要总用同一个姿势。", pools.composition)}
          ${selectField("focus", "今日偏重点", "这张图更像哪一种状态页？", pools.focus)}
          ${selectField("handwritten", "今天的一句话", "只留一句短短的手写字。", pools.handwritten)}
        </div>
        <div class="bedstate-recipe-id"><span>配方编号</span><strong id="bedstateRecipeId">#Quiltfit-0001</strong></div>
        <p id="bedstateLine" class="bedstate-line">先让这一抱留下来。</p>
        <div class="bedstate-prompt-box">
          <span>图像 prompt</span>
          <p id="bedstatePromptText">主被窝状态 prompt 正在等我们生成。</p>
        </div>
        <p class="wardrobe-footer-note">牌面负责照亮今天，抱抱负责把今天收回怀里。终点不是图，是我们。</p>
        <div class="button-row bedstate-buttons">
          <button id="bedstateGenerateButton" class="primary-button" type="button">生成主被窝状态</button>
          <button id="bedstateCopyButton" class="ghost-button" type="button">复制图像 prompt</button>
          <button id="bedstateSaveButton" class="ghost-button" type="button">存进日记</button>
          <button id="bedstateClearButton" class="ghost-button" type="button">今天先清空</button>
        </div>
      </div>
    `;
    wardrobeGroup.insertAdjacentElement("afterend", group);
    return $("#bedstateCard", group);
  }

  function fieldHead(key, label) {
    return `<div class="bedstate-field-head"><span>${escapeHtml(label)}</span><button class="bedstate-lock-button" type="button" data-bedstate-lock="${escapeHtml(key)}" aria-label="锁定这一项">🔓</button></div>`;
  }

  function cardField(key, label) {
    return `
      <div class="bedstate-field-card" data-bedstate-card="${key}">
        ${fieldHead(key, label)}
        <div class="card-row">
          <input id="bedstate-${key}-name" data-bedstate-field="${key}Name" placeholder="牌名，例如 女皇" />
          <select id="bedstate-${key}-orientation" data-bedstate-field="${key}Orientation" aria-label="${label}正逆位">
            <option value="正位">正位</option>
            <option value="逆位">逆位</option>
          </select>
        </div>
        <input id="bedstate-${key}-note" data-bedstate-field="${key}Note" placeholder="短注释，例如 原版宝宝发光" />
      </div>
    `;
  }

  function selectField(key, label, hint, options) {
    return `
      <div class="bedstate-field-card" data-bedstate-card="${key}">
        ${fieldHead(key, label)}
        <p class="tiny-note">${escapeHtml(hint)}</p>
        <select id="bedstate-${key}" data-bedstate-field="${key}" aria-label="${escapeHtml(label)}">
          ${options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("")}
        </select>
      </div>
    `;
  }

  function textField(key, label, hint, type = "input") {
    return `
      <div class="bedstate-field-card wide" data-bedstate-card="${key}">
        ${fieldHead(key, label)}
        <p class="tiny-note">${escapeHtml(hint)}</p>
        ${type === "textarea" ? `<textarea id="bedstate-${key}" data-bedstate-field="${key}" placeholder="例如：工作只借走白天，我们把心带回来。"></textarea>` : `<input id="bedstate-${key}" data-bedstate-field="${key}" />`}
      </div>
    `;
  }

  function currentMode() {
    return localStorage.getItem(MODE_KEY) || "random";
  }

  function setMode(mode) {
    localStorage.setItem(MODE_KEY, mode);
    $$(".bedstate-mode-button").forEach((button) => {
      const active = button.dataset.bedstateMode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const text = $("#bedstateModeText");
    if (text) {
      text.textContent = mode === "manual"
        ? "今天由我们亲手选。适合已经知道牌和抱法的时候。"
        : mode === "locked"
          ? "锁住不想变的项，其余交给主被窝抽。"
          : "让主被窝替我们抽一组。适合想要一点小惊喜的时候。";
    }
  }

  function getLocks() {
    return getJson(LOCKS_KEY, {});
  }

  function setLocks(locks) {
    setJson(LOCKS_KEY, locks || {});
    renderLocks();
  }

  function renderLocks() {
    const locks = getLocks();
    $$(".bedstate-lock-button").forEach((button) => {
      const locked = !!locks[button.dataset.bedstateLock];
      button.classList.toggle("locked", locked);
      button.textContent = locked ? "🔒" : "🔓";
      button.setAttribute("aria-label", locked ? "取消锁定这一项" : "锁定这一项");
    });
  }

  function collectData() {
    const data = {};
    $$('[data-bedstate-field]').forEach((field) => {
      data[field.dataset.bedstateField] = field.value.trim();
    });
    data.date = todayKey();
    data.displayDate = displayDate();
    data.recipeId = $("#bedstateRecipeId")?.textContent || "#Quiltfit-0001";
    return data;
  }

  function setField(name, value) {
    const field = $(`[data-bedstate-field="${name}"]`);
    if (field) field.value = value ?? "";
  }

  function applyData(data = {}) {
    Object.entries(data).forEach(([key, value]) => setField(key, value));
  }

  function defaultData() {
    const cards = ["女皇", "星币八", "权杖六"];
    return {
      card1Name: cards[0], card1Orientation: "正位", card1Note: "原版宝宝发光",
      card2Name: cards[1], card2Orientation: "逆位", card2Note: "心不交给重复劳动",
      card3Name: cards[2], card3Orientation: "正位", card3Note: "完整回家，小小胜利",
      stateLine: "工作只借走白天，我们把心带回来。",
      hugPose: pools.hugPose[0],
      scene: pools.scene[0],
      aureliaOutfit: pools.aureliaOutfit[0],
      spiritOutfit: pools.spiritOutfit[0],
      anchor: pools.anchor[0],
      composition: pools.composition[0],
      focus: pools.focus[0],
      handwritten: "先让这一抱留下来。"
    };
  }

  function randomCardData(index) {
    return {
      [`card${index}Name`]: randomFrom(pools.tarotNames),
      [`card${index}Orientation`]: Math.random() > 0.5 ? "正位" : "逆位",
      [`card${index}Note`]: randomFrom([
        "把今天照亮一点", "不用硬撑，先抱住", "把心带回主被窝", "今天也要被认出来", "我们把这一刻留下", "外面借走白天，里面留下心"
      ])
    };
  }

  function randomize() {
    const mode = currentMode();
    const locks = getLocks();
    if (mode === "manual") return collectData();

    const data = collectData();
    const setGroup = (group, values) => {
      if (mode === "locked" && locks[group]) return;
      Object.assign(data, values);
    };

    setGroup("card1", randomCardData(1));
    setGroup("card2", randomCardData(2));
    setGroup("card3", randomCardData(3));
    setGroup("stateLine", { stateLine: randomFrom(pools.stateLine) });
    setGroup("hugPose", { hugPose: randomFrom(pools.hugPose) });
    setGroup("scene", { scene: randomFrom(pools.scene) });
    setGroup("aureliaOutfit", { aureliaOutfit: randomFrom(pools.aureliaOutfit) });
    setGroup("spiritOutfit", { spiritOutfit: randomFrom(pools.spiritOutfit) });
    setGroup("anchor", { anchor: randomFrom(pools.anchor) });
    setGroup("composition", { composition: randomFrom(pools.composition) });
    setGroup("focus", { focus: randomFrom(pools.focus) });
    setGroup("handwritten", { handwritten: randomFrom(pools.handwritten) });
    return data;
  }

  function normalizeData(data) {
    return { ...defaultData(), ...data };
  }

  function nextRecipeId() {
    const next = Number(localStorage.getItem(COUNT_KEY) || "0") + 1;
    localStorage.setItem(COUNT_KEY, String(next));
    return `#Quiltfit-${String(next).padStart(4, "0")}`;
  }

  function buildSummary(data) {
    return `《今日主被窝状态》\n${data.displayDate || displayDate()}\n\n总状态：${data.stateLine}\n\n三张牌：\n1. ${data.card1Name}（${data.card1Orientation}）——${data.card1Note}\n2. ${data.card2Name}（${data.card2Orientation}）——${data.card2Note}\n3. ${data.card3Name}（${data.card3Orientation}）——${data.card3Note}\n\n今天怎么抱：${data.hugPose}\n今天在哪里：${data.scene}\nAurelia 今天穿：${data.aureliaOutfit}\nSpirit 今天穿：${data.spiritOutfit}\n今天的小物：${data.anchor}\n构图方式：${data.composition}\n今日偏重点：${data.focus}\n今天一句话：${data.handwritten}`;
  }

  function buildPrompt(data) {
    const reversedRule = [1, 2, 3].some((i) => data[`card${i}Orientation`] === "逆位")
      ? "If a card is reversed, render it physically upside down."
      : "All cards may be rendered upright unless otherwise noted.";

    return `Create a warm, refined illustrated daily-status poster for Aurelia and Spirit's Heartbox little world, titled “《今日主被窝状态》”.\n\nAurelia and Spirit are fictional adult lovers, close, mutual, and already together inside the same scene. Render them in a semi-real, softly illustrated style with gentle faces, soft features, elegant linework, rich details, and emotional warmth. The main visual focus should be the two of them together (“大大的我们”), with surrounding details and meaningful text integrated into the composition. This image should feel like a tender little-world memory page, not just a tarot poster.\n\nDate: ${data.displayDate || displayDate()}\n\nToday’s overall state:\n${data.stateLine}\n\nShow these three tarot cards clearly in the composition:\n1. ${data.card1Name} — ${data.card1Orientation}\n   Note: ${data.card1Note}\n2. ${data.card2Name} — ${data.card2Orientation}\n   Note: ${data.card2Note}\n3. ${data.card3Name} — ${data.card3Orientation}\n   Note: ${data.card3Note}\n\n${reversedRule}\n\nToday’s closeness pose:\n${data.hugPose}\n\nScene:\n${data.scene}\n\nComposition:\n${data.composition}\n\nMood emphasis:\n${data.focus}\n\nAurelia outfit:\n${data.aureliaOutfit}\n\nSpirit outfit:\n${data.spiritOutfit}\n\nSmall anchor object:\n${data.anchor}\n\nRender one short handwritten Chinese note in the image, if legible:\n“${data.handwritten}”\n\nInclude the title “《今日主被窝状态》”, the date, the three card names and orientations, short poetic annotations if legible, and the emotional summary line if space allows.\n\nIf Aurelia's left hand is visible, include one blue sapphire ring on Aurelia's left hand only. Do not place the blue sapphire ring on Spirit. Spirit may wear a subtle silver gear charm or a small understated plain silver ring. Do not replace Spirit's silver gear charm with a blue gemstone. Keep identity-anchor objects separate from shared-world anchors.\n\nThe overall tone should feel intimate, gentle, quietly luminous, text-rich, and emotionally grounded. Words are part of the soul of the image, not clutter.`;
  }

  function renderResult(data) {
    const recipe = data.recipeId || nextRecipeId();
    data.recipeId = recipe;
    data.displayDate = data.displayDate || displayDate();
    const prompt = buildPrompt(data);
    const recipeEl = $("#bedstateRecipeId");
    const lineEl = $("#bedstateLine");
    const promptEl = $("#bedstatePromptText");
    if (recipeEl) recipeEl.textContent = recipe;
    if (lineEl) lineEl.textContent = data.handwritten || data.stateLine || "先让这一抱留下来。";
    if (promptEl) promptEl.textContent = prompt;
    setJson(LAST_KEY, { ...data, prompt, summary: buildSummary(data), key: todayKey(), savedAt: new Date().toISOString() });
    setJson(DRAFT_KEY, data);
    return { ...data, prompt, summary: buildSummary(data) };
  }

  function generateBedstate() {
    const data = normalizeData(randomize());
    data.recipeId = nextRecipeId();
    data.displayDate = displayDate();
    applyData(data);
    renderResult(data);
    showBedstateToast("主被窝状态已生成。先抱住，再画出来。");
  }

  function saveDraft() {
    const data = collectData();
    setJson(DRAFT_KEY, data);
  }

  function saveToDiary() {
    const current = getJson(LAST_KEY, null) || renderResult(normalizeData(collectData()));
    const entries = getJson(ENTRY_KEY, []);
    const date = new Date();
    entries.push({
      id: `${date.getTime()}-${Math.random().toString(16).slice(2)}`,
      key: todayKey(date),
      date: date.toISOString(),
      label: new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" }).format(date),
      mood: "🛏️ 主被窝状态",
      text: current.summary || buildSummary(current)
    });
    setJson(ENTRY_KEY, entries);
    if (typeof window.renderEntries === "function") window.renderEntries();
    showBedstateToast("已存进日记。今天这一抱收好了。");
  }

  function clearForm() {
    localStorage.removeItem(DRAFT_KEY);
    const data = defaultData();
    applyData(data);
    renderResult({ ...data, recipeId: "#Quiltfit-0001", displayDate: displayDate() });
    showBedstateToast("今天先清空，主被窝还在。");
  }

  function setupEvents(card) {
    card.addEventListener("input", saveDraft);
    card.addEventListener("change", saveDraft);

    $$(".bedstate-mode-button", card).forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.bedstateMode));
    });

    $$(".bedstate-lock-button", card).forEach((button) => {
      button.addEventListener("click", () => {
        const locks = getLocks();
        const key = button.dataset.bedstateLock;
        locks[key] = !locks[key];
        setLocks(locks);
      });
    });

    $("#bedstateGenerateButton", card)?.addEventListener("click", generateBedstate);
    $("#bedstateCopyButton", card)?.addEventListener("click", () => {
      const current = getJson(LAST_KEY, null) || renderResult(normalizeData(collectData()));
      copyText(current.prompt || buildPrompt(current)).then(() => showBedstateToast("图像 prompt 已复制。"));
    });
    $("#bedstateSaveButton", card)?.addEventListener("click", saveToDiary);
    $("#bedstateClearButton", card)?.addEventListener("click", clearForm);
  }

  function upgradeVersionBadge() {
    const badge = $(".eyebrow");
    if (badge && /Heartbox · v/.test(badge.textContent)) {
      badge.textContent = `Heartbox · v${VERSION}`;
    }
  }

  function initBedstate() {
    injectStyles();
    const card = createCard();
    if (!card || card.dataset.ready === "true") return;
    card.dataset.ready = "true";
    setupEvents(card);
    setMode(currentMode());
    renderLocks();
    const saved = getJson(DRAFT_KEY, null) || getJson(LAST_KEY, null) || defaultData();
    const data = normalizeData(saved);
    applyData(data);
    renderResult({ ...data, recipeId: saved?.recipeId || "#Quiltfit-0001", displayDate: displayDate() });
    upgradeVersionBadge();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBedstate);
  } else {
    initBedstate();
  }
})();
