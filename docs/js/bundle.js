/* ===== config.js ===== */
/* =====================================================================
   config.js — НАСТРОЙКИ РАЗВЁРТЫВАНИЯ (единственный файл, который нужно
   отредактировать под себя) + контент дневника.
   ===================================================================== */

window.SIXMIN_CONFIG = {
  // ── 1. SUPABASE ────────────────────────────────────────────────────
  // Dashboard → Project Settings → API
  //   Project URL          → supabaseUrl
  //   anon / public key    → supabaseAnonKey   (публичный ключ, защищён RLS)
  // service_role key НИКОГДА сюда не пишите — он только для бота.
  // Чтобы приложение работало без облака (локально на устройстве) —
  // оставьте оба значения пустыми.
  supabaseUrl: "https://asaecttdxnfiszzafufc.supabase.co",
  supabaseAnonKey: "sb_publishable_MLaTGdUWE2S9uFC6gpKNVQ_Y6lDdOjP",

  // ── 2. ПУБЛИЧНЫЙ АДРЕС ПРИЛОЖЕНИЯ ──────────────────────────────────
  // Например: https://ivan.github.io/sixmin/  или https://sixmin.netlify.app
  // Нужен для кнопок «Открыть дневник» в Telegram и для поля URL в .ics.
  appUrl: "https://studiomwm.ru/",

  // ── 3. ПРОЧЕЕ ──────────────────────────────────────────────────────
  defaultTimezone: "Europe/Moscow",
  version: "0.1.0"
};

/* ── Контент: вопросы (свои формулировки, пул вариантов для ротации) ── */

window.QUESTIONS = {
  am: [
    {
      id: "a1",
      main: "За что ты благодарен(на) прямо сейчас?",
      variants: [
        "Что хорошего уже есть в твоей жизни?",
        "Кого ты сегодня ценишь?",
        "Что маленькое тебя сейчас радует?"
      ],
      hint: "Конкретно: не «всё хорошо», а «кофе в тишине до всеобщего подъёма»"
    },
    {
      id: "a2",
      main: "Что сделает сегодняшний день удачным?",
      variants: [
        "Какие 1–2 действия дадут ощущение, что день прожит не зря?",
        "Что ты сегодня хочешь успеть для себя?"
      ],
      hint: "Одно-два реальных действия, а не список из десяти"
    },
    {
      id: "a3",
      main: "Каким человеком ты хочешь быть сегодня?",
      variants: [
        "Что ты себе напоминаешь о себе?",
        "Какое качество ты сегодня включаешь?"
      ],
      hint: "Спокойным. Внимательным. Решительным. Добрым к себе."
    }
  ],
  pm: [
    {
      id: "e1",
      main: "Что хорошего ты сегодня сделал(а) — для себя или других?",
      variants: [
        "Чем ты сегодня можешь гордиться?",
        "Где ты был(а) полезен(на)?"
      ],
      hint: "Считается и мелочь: вовремя лёг спать, не сорвался, помог"
    },
    {
      id: "e2",
      main: "Что сегодня тебя порадовало или удивило?",
      variants: [
        "Какой момент дня ты бы сохранил(а)?",
        "Что было приятным, даже совсем мелкое?"
      ],
      hint: "Момент, а не оценка дня"
    },
    {
      id: "e3",
      main: "Что можно было сделать лучше — и что берёшь в завтра?",
      variants: [
        "Какой урок сегодня?",
        "Что завтра сделаешь иначе?"
      ],
      hint: "Без самобичевания: факт → вывод → действие"
    }
  ],
  weekly: [
    { id: "w1", main: "Какой момент недели был самым ценным?", variants: [], hint: "" },
    { id: "w2", main: "Что ты сделал(а) на этой неделе для своих целей?", variants: [], hint: "" },
    { id: "w3", main: "Что забирало энергию — и как это изменить?", variants: [], hint: "" },
    { id: "w4", main: "Кому и за что хочешь сказать спасибо?", variants: [], hint: "" },
    { id: "w5", main: "Один главный приоритет следующей недели.", variants: [], hint: "" }
  ]
};

/* ── Теги (под ваши сферы: работа, здоровье, семья, быт, свои проекты) ── */
window.TAGS = ["работа", "здоровье", "семья", "быт", "свои проекты", "спорт", "деньги", "отдых", "учёба"];

/* ── Подкрепляющие фразы после сохранения ─────────────────────────── */
window.QUOTES = [
  { t: "Мы то, что мы постоянно делаем. Поэтому совершенство — не поступок, а привычка.", a: "Уилл Дюрант, по мотивам Аристотеля" },
  { t: "Не то, что мы живём мало, а то, что много теряем.", a: "Сенека" },
  { t: "Счастье твоей жизни зависит от качества твоих мыслей.", a: "Марк Аврелий" },
  { t: "Трудности укрепляют ум, как труд укрепляет тело.", a: "Сенека" },
  { t: "Путь в тысячу ли начинается с одного шага.", a: "Лао-цзы" },
  { t: "Упади семь раз — встань восемь.", a: "японская пословица" },
  { t: "Лучшее время посадить дерево было двадцать лет назад. Следующее лучшее время — сегодня.", a: "китайская пословица" },
  { t: "Знать недостаточно — надо применять. Желать недостаточно — надо делать.", a: "Гёте" },
  { t: "Два самых могучих воина — терпение и время.", a: "Лев Толстой" },
  { t: "Кажется невозможным лишь то, пока не сделано.", a: "Нельсон Мандела" },
  { t: "Цепи привычки сначала легки как нить, а после тяжки как канат.", a: "приписывается Уоррену Баффетту" },
  { t: "Хорошо начатое дело — наполовину сделанное.", a: "Аристотель" },
  { t: "Держись настоящего: оно одно твоё.", a: "Марк Аврелий" },
  { t: "Маленькое дело лучше большого безделья.", a: "народная мудрость" },
  { t: "Не жди идеального момента: возьми момент и сделай его хорошим.", a: "народная мудрость" },
  { t: "Забота о мелочах, которые повторяются каждый день, и есть большая жизнь.", a: "народная мудрость" },
  { t: "Шесть минут сегодня — это привычка, которая держится годами.", a: null },
  { t: "Неидеальная запись лучше пустой страницы.", a: null },
  { t: "Внимание к хорошему — это тоже действие.", a: null },
  { t: "Ты не обязан заполнять дневник. Ты выбираешь заметить день.", a: null },
  { t: "Прогресс важнее совершенства.", a: null },
  { t: "Сегодняшняя фраза — опора для тебя будущего.", a: null },
  { t: "Вечерний вопрос «что беру в завтра» работает лучше любой мотивации.", a: null },
  { t: "Дневник — это разговор с собой, в котором ты на своей стороне.", a: null },
  { t: "Благодарность замечает то, что привычка прячет.", a: null },
  { t: "День, который ты заметил, прожит дважды.", a: null },
  { t: "Сначала мы строим привычки, потом привычки строят нас.", a: "приписывается Джону Драйдену" },
  { t: "Великие дела состоят из малых, вовремя сделанных.", a: "народная мудрость" },
  { t: "Кто каждый вечер подводит итог, тому утро даёт план.", a: "народная мудрость" },
  { t: "Записанное — пережитое дважды и понятое глубже.", a: null },
  { t: "Спокойствие — это навык, а не подарок судьбы.", a: null },
  { t: "Три честные строки сильнее страницы самообмана.", a: null },
  { t: "Серия дней — не цепь, а тропинка, которую ты протоптал.", a: null },
  { t: "Отдых, который ты запланировал, отдыхает вдвое лучше.", a: null },
  { t: "Слово, пойманное вечером, утром становится решением.", a: null },
  { t: "Мы замечаем не дни, а моменты. Этот блокнот — про моменты.", a: null }
];

/* ── Настройки по умолчанию (совпадают с reminder_settings в SQL) ───── */
window.DEFAULT_SETTINGS = {
  tz: "Europe/Moscow",
  wd_am: "07:30",
  wd_pm: "22:00",
  we_am: "09:30",
  we_pm: "22:30",
  followup_min: 60,
  quiet_from: null,
  quiet_to: null,
  channels: { telegram: true, webpush: false, ics: false },
  vacation_until: null,
  rotation: "random",
  weekly_digest_time: "20:00"
};

;
/* ===== store.js ===== */
/* store.js — локальное хранилище (IndexedDB) + расчёты серии и статистики.
   Источник правды на устройстве; облако — слой синхронизации поверх него. */

const Store = (() => {
  const DB_NAME = "sixmin";
  const DB_VER = 1;
  let _db = null;

  function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("entries")) {
          const s = db.createObjectStore("entries", { keyPath: "id" });
          s.createIndex("by_date", "date");
          s.createIndex("by_key", ["date", "slot"]);
        }
        if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings");
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
      };
      req.onsuccess = () => { _db = req.result; resolve(_db); };
      req.onerror = () => reject(req.error);
    });
  }

  function tx(store, mode) {
    return _db.transaction(store, mode).objectStore(store);
  }
  function wrap(req) {
    return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
  }

  /* ── утилиты ─────────────────────────────────────────────────────── */
  const pad = n => String(n).padStart(2, "0");
  function localDate(d = new Date()) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function parseDate(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function uid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /* ── записи ──────────────────────────────────────────────────────── */
  async function allEntries() {
    if (!_db) await open();
    return (await wrap(tx("entries", "readonly").getAll())) || [];
  }

  async function getEntry(date, slot) {
    if (!_db) await open();
    const idx = tx("entries", "readonly").index("by_key");
    return await wrap(idx.get(IDBKeyRange.only([date, slot])));
  }

  async function saveEntry(data) {
    if (!_db) await open();
    const date = data.date || localDate();
    const slot = data.slot || "pm";
    const existing = await getEntry(date, slot);
    const merged = Object.assign({}, existing || {}, data, {
      id: (existing && existing.id) || data.id || uid(),
      date, slot,
      created_at: (existing && existing.created_at) || data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tz: data.tz || (await getSettings()).tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
      mode: data.mode || (existing && existing.mode) || "full",
      backfilled: data.backfilled !== undefined ? data.backfilled : (existing ? existing.backfilled : date !== localDate()),
      frozen: data.frozen !== undefined ? data.frozen : (existing ? !!existing.frozen : false),
      tags: data.tags || (existing && existing.tags) || [],
      question_variants: data.question_variants || (existing && existing.question_variants) || {},
      answers: Object.assign({}, (existing && existing.answers) || {}, data.answers || {}),
      dirty: true
    });
    await wrap(tx("entries", "readwrite").put(merged));
    return merged;
  }

  async function deleteEntry(id) {
    if (!_db) await open();
    await wrap(tx("entries", "readwrite").delete(id));
  }

  async function freezeDay(date) {
    return saveEntry({ date, slot: "pm", frozen: true, mode: "telegram", answers: {} });
  }

  /* ── настройки и мета ────────────────────────────────────────────── */
  async function getSettings() {
    if (!_db) await open();
    const s = await wrap(tx("settings", "readonly").get("main"));
    return Object.assign({}, window.DEFAULT_SETTINGS, s || {});
  }
  async function saveSettings(patch) {
    if (!_db) await open();
    const cur = await getSettings();
    const next = Object.assign({}, cur, patch, { updated_at: new Date().toISOString(), dirty: true });
    await wrap(tx("settings", "readwrite").put(next, "main"));
    return next;
  }
  async function getMeta(k, def) {
    if (!_db) await open();
    const v = await wrap(tx("meta", "readonly").get(k));
    return v === undefined ? def : v;
  }
  async function setMeta(k, v) {
    if (!_db) await open();
    await wrap(tx("meta", "readwrite").put(v, k));
  }

  /* ── серия дней (streak) ─────────────────────────────────────────── */
  function computeStreak(entries, todayStr) {
    const days = new Map();
    entries.forEach(e => {
      if (!days.has(e.date)) days.set(e.date, { slots: new Set(), frozen: true });
      const d = days.get(e.date);
      d.slots.add(e.slot);
      if (!e.frozen) d.frozen = false;
    });
    const marked = [...days.entries()].filter(([, v]) => !v.frozen).map(([k]) => k).sort();
    const set = new Set(marked);
    const frozenSet = new Set([...days.entries()].filter(([, v]) => v.frozen).map(([k]) => k));

    // Сегодня ещё не заполнено — серия не обнуляется днём (считаем «на вчера»).
    // Авто-заморозки соединяют разрывы МЕЖДУ записями, но не продлевают серию
    // назад до первой записи в истории.
    const minKey = marked.length ? marked[0] : todayStr;
    let current = 0, freezes = 0;
    let d = parseDate(todayStr);
    if (!set.has(todayStr)) d.setDate(d.getDate() - 1);
    while (current < 1000) {
      const key = localDate(d);
      if (key < minKey) break;
      if (set.has(key)) current++;
      else if (frozenSet.has(key)) current++;   // явная заморозка — не тратит лимит
      else if (freezes < 2) { freezes++; current++; }  // авто-заморозка, до 2 раз
      else break;
      d.setDate(d.getDate() - 1);
    }

    let longest = 0, run = 0, prev = null;
    marked.forEach(k => {
      const cur = parseDate(k);
      run = (prev && (cur - prev) === 86400000) ? run + 1 : 1;
      longest = Math.max(longest, run);
      prev = cur;
    });
    const fullDays = marked.filter(k => {
      const v = days.get(k); return v && v.slots.has("am") && v.slots.has("pm");
    });
    return { current, longest: Math.max(longest, current), fullDays: fullDays.length, markedDays: marked.length, set };
  }

  /* ── статистика ──────────────────────────────────────────────────── */
  function stats(entries) {
    const today = localDate();
    const st = computeStreak(entries, today);
    const month = today.slice(0, 7);
    const monthDays = new Set(entries.filter(e => !e.frozen && e.date.startsWith(month)).map(e => e.date)).size;

    const last14 = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = localDate(d);
      const day = entries.filter(e => e.date === key && !e.frozen);
      last14.push({
        date: key, label: pad(d.getDate()),
        mood: Math.max(0, ...day.map(e => e.mood || 0)),
        energy: Math.max(0, ...day.map(e => e.energy || 0))
      });
    }

    const tags = {};
    entries.forEach(e => (e.tags || []).forEach(t => tags[t] = (tags[t] || 0) + 1));
    const topTags = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const hours = {};
    entries.forEach(e => {
      if (!e.created_at) return;
      const h = new Date(e.created_at).getHours();
      hours[h] = (hours[h] || 0) + 1;
    });
    const topHours = Object.entries(hours).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([h, c]) => ({ label: pad(+h) + ":00", count: c }));

    const durations = entries.map(e => e.duration_sec).filter(x => x > 0);
    const avgSec = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

    return { streak: st, monthDays, last14, topTags, topHours, avgSec, total: entries.length };
  }

  /* ── экспорт / импорт ────────────────────────────────────────────── */
  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function toCSV(entries) {
    const head = ["date", "slot", "mode", "mood", "energy", "tags", "a1", "a2", "a3", "e1", "e2", "e3", "created_at"];
    const esc = v => v === undefined || v === null ? "" : '"' + String(v).replace(/"/g, '""') + '"';
    const lines = [head.join(";")];
    entries.sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot)).forEach(e => {
      const a = e.answers || {};
      lines.push([e.date, e.slot, e.mode, e.mood || "", e.energy || "", (e.tags || []).join(","),
        a.a1 || "", a.a2 || "", a.a3 || "", a.e1 || "", a.e2 || "", a.e3 || "", e.created_at || ""].map(esc).join(";"));
    });
    return "\uFEFF" + lines.join("\r\n");
  }

  const RU_MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"];

  function toMarkdown(entries) {
    const Q = window.QUESTIONS;
    const byDate = {};
    entries.forEach(e => { (byDate[e.date] = byDate[e.date] || {})[e.slot] = e; });
    const out = ["# Дневник «шесть минут»", "", "Экспорт: " + new Date().toLocaleString("ru-RU"), ""];
    Object.keys(byDate).sort().reverse().forEach(date => {
      const [y, m, d] = date.split("-").map(Number);
      out.push("## " + d + " " + RU_MONTHS[m - 1] + " " + y, "");
      const slots = byDate[date];
      [["am", "☀️ Утро", Q.am], ["pm", "🌙 Вечер", Q.pm], ["weekly", "📊 Обзор недели", Q.weekly]].forEach(([slot, title, qs]) => {
        const e = slots[slot];
        if (!e) return;
        out.push("### " + title + (e.frozen ? " (заморозка)" : ""), "");
        qs.forEach(q => {
          const v = (e.answers || {})[q.id];
          if (v) out.push("- **" + q.main + "** " + v);
        });
        const meta = [];
        if (e.mood) meta.push("настроение " + e.mood + "/5");
        if (e.energy) meta.push("энергия " + e.energy + "/5");
        if ((e.tags || []).length) meta.push("теги: " + e.tags.join(", "));
        if (meta.length) out.push("", "_" + meta.join(" · ") + "_");
        out.push("");
      });
    });
    return out.join("\n");
  }

  async function importJSON(text) {
    const data = JSON.parse(text);
    const list = Array.isArray(data) ? data : (data.entries || []);
    let added = 0, updated = 0;
    for (const e of list) {
      if (!e || !e.date || !e.slot) continue;
      const existing = await getEntry(e.date, e.slot);
      if (existing && existing.updated_at && e.updated_at && existing.updated_at > e.updated_at) continue;
      await saveEntry(Object.assign({}, e, { id: (existing && existing.id) || e.id }));
      existing ? updated++ : added++;
    }
    return { added, updated, total: list.length };
  }

  async function wipe() {
    if (!_db) await open();
    const e = await allEntries();
    for (const x of e) await wrap(tx("entries", "readwrite").delete(x.id));
    await wrap(tx("settings", "readwrite").clear());
    await wrap(tx("meta", "readwrite").clear());
  }

  return {
    open, allEntries, getEntry, saveEntry, deleteEntry, freezeDay,
    getSettings, saveSettings, getMeta, setMeta,
    computeStreak, stats, localDate, parseDate, pad, uid,
    download, toCSV, toMarkdown, importJSON, wipe
  };
})();

;
/* ===== cloud.js ===== */
/* cloud.js — синхронизация с Supabase (magic link) + привязка Telegram.
   v0.1.4: библиотека supabase-js грузится ЛЕНИВО и асинхронно: интерфейс и
   локальные функции работают даже если её загрузка зависла или не удалась.
   Если config не заполнен — модуль выключен, приложение полностью локальное. */

const Cloud = (() => {
  const CFG = window.SIXMIN_CONFIG || {};
  const LIB_SRC = "js/vendor/supabase.min.js?v=014";

  let client = null;
  let user = null;
  let listeners = [];
  let libPromise = null;

  const configured = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);

  function onChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(fn => { try { fn(state()); } catch (e) { console.error(e); } }); }
  function state() {
    return {
      configured,
      online: !!client,
      user: user ? { id: user.id, email: user.email } : null
    };
  }

  /* ── ленивая загрузка библиотеки ─────────────────────────────────── */
  function ensureLib(timeoutMs) {
    if (window.supabase) return Promise.resolve(true);
    if (!configured) return Promise.reject(new Error("облако не настроено"));
    if (!libPromise) {
      libPromise = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = LIB_SRC;
        s.async = true;
        s.onload = () => window.supabase ? resolve(true) : reject(new Error("библиотека повреждена"));
        s.onerror = () => { libPromise = null; reject(new Error("библиотека облака не загрузилась (сеть)")); };
        document.head.appendChild(s);
      });
    }
    const timer = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("таймаут загрузки облака")), timeoutMs || 12000));
    return Promise.race([libPromise, timer]);
  }

  async function ensureClient() {
    if (client) return client;
    await ensureLib();
    client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.__sbClient = client; // v0.2: общий клиент для модулей трекера

    // magic link / PKCE: токен может прийти в query (?code=) или в hash (#access_token=)
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (code && client.auth.exchangeCodeForSession) {
      try { await client.auth.exchangeCodeForSession(code); } catch (e) { console.warn("code exchange", e); }
      params.delete("code");
      history.replaceState(null, "", location.pathname + (params.toString() ? "?" + params : "") + location.hash);
    }
    if (location.hash.indexOf("access_token") > -1 && client.auth.setSession) {
      const h = new URLSearchParams(location.hash.slice(1));
      try {
        await client.auth.setSession({ access_token: h.get("access_token"), refresh_token: h.get("refresh_token") });
      } catch (e) { console.warn("setSession", e); }
    }

    const { data } = await client.auth.getSession();
    user = (data && data.session && data.session.user) || null;

    client.auth.onAuthStateChange((_ev, session) => {
      user = (session && session.user) || null;
      emit();
      if (user) sync().catch(e => console.warn("auto-sync", e));
    });
    emit();
    return client;
  }

  async function init() {
    if (!configured) { emit(); return; }
    try {
      await ensureClient();
    } catch (e) {
      console.warn("Облако недоступно сейчас:", e.message, "— повторим по действию пользователя");
    }
    emit();
  }

  /* ── авторизация ─────────────────────────────────────────────────── */
  async function signIn(email) {
    const c = await ensureClient();
    const url = (CFG.appUrl || location.origin + location.pathname);
    const { error } = await c.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: url }
    });
    if (error) throw error;
    return true;
  }

  async function signInPassword(email, password) {
    const c = await ensureClient();
    const { error } = await c.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    return true;
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    user = null;
    emit();
  }

  /* ── записи ──────────────────────────────────────────────────────── */
  function rowOf(e) {
    const a = e.answers || {};
    return {
      id: e.id, user_id: user.id, date: e.date, slot: e.slot,
      created_at: e.created_at, updated_at: e.updated_at || new Date().toISOString(),
      tz: e.tz || null, mode: e.mode || "full", backfilled: !!e.backfilled, frozen: !!e.frozen,
      a1: a.a1 || null, a2: a.a2 || null, a3: a.a3 || null,
      e1: a.e1 || null, e2: a.e2 || null, e3: a.e3 || null,
      w1: a.w1 || null, w2: a.w2 || null, w3: a.w3 || null, w4: a.w4 || null, w5: a.w5 || null,
      question_variants: e.question_variants || {},
      mood: e.mood || null, energy: e.energy || null,
      tags: e.tags || [], duration_sec: e.duration_sec || null,
      voice_path: e.voice_path || null, device: e.device || "pwa"
    };
  }

  function entryOf(r) {
    const answers = {};
    ["a1", "a2", "a3", "e1", "e2", "e3", "w1", "w2", "w3", "w4", "w5"].forEach(k => { if (r[k]) answers[k] = r[k]; });
    return {
      id: r.id, date: r.date, slot: r.slot,
      created_at: r.created_at, updated_at: r.updated_at,
      tz: r.tz, mode: r.mode, backfilled: r.backfilled, frozen: r.frozen,
      answers, question_variants: r.question_variants || {},
      mood: r.mood, energy: r.energy, tags: r.tags || [],
      duration_sec: r.duration_sec, voice_path: r.voice_path, device: r.device
    };
  }

  async function push() {
    if (!user) return { pushed: 0 };
    const all = await Store.allEntries();
    const dirty = all.filter(e => e.dirty);
    if (!dirty.length) return { pushed: 0 };
    let pushed = 0;
    for (let i = 0; i < dirty.length; i += 50) {
      const batch = dirty.slice(i, i + 50).map(rowOf);
      const { error } = await client.from("entries").upsert(batch, { onConflict: "user_id,date,slot" });
      if (error) { console.warn("push", error.message); continue; }
      for (const e of dirty.slice(i, i + 50)) {
        await Store.saveEntry(Object.assign({}, e, { dirty: false }));
      }
      pushed += batch.length;
    }
    return { pushed };
  }

  async function pull() {
    if (!user) return { pulled: 0 };
    const last = await Store.getMeta("last_pull", "1970-01-01T00:00:00Z");
    const { data, error } = await client.from("entries")
      .select("*").gt("updated_at", last).order("updated_at", { ascending: true }).limit(500);
    if (error) { console.warn("pull", error.message); return { pulled: 0, error: error.message }; }
    let pulled = 0;
    for (const r of (data || [])) {
      const remote = entryOf(r);
      const local = await Store.getEntry(remote.date, remote.slot);
      if (!local || (local.updated_at || "") < (remote.updated_at || "")) {
        await Store.saveEntry(Object.assign({}, remote, { id: (local && local.id) || remote.id, dirty: false }));
        pulled++;
      }
    }
    if (data && data.length) {
      await Store.setMeta("last_pull", data[data.length - 1].updated_at);
    }
    return { pulled };
  }

  async function sync() {
    if (!configured) return { ok: false, reason: "облако не настроено" };
    try {
      await ensureClient();
    } catch (e) {
      return { ok: false, reason: e.message };
    }
    if (!user) return { ok: false, reason: "нет входа" };
    try {
      const p = await push();
      const q = await pull();
      await Store.setMeta("last_sync", new Date().toISOString());
      emit();
      return { ok: true, pushed: p.pushed, pulled: q.pulled };
    } catch (e) {
      console.error("sync", e);
      return { ok: false, reason: e.message };
    }
  }

  /* ── настройки напоминаний ───────────────────────────────────────── */
  async function pushSettings(s) {
    if (!user) return false;
    await ensureClient();
    const row = {
      user_id: user.id, tz: s.tz, wd_am: s.wd_am, wd_pm: s.wd_pm, we_am: s.we_am, we_pm: s.we_pm,
      followup_min: Number(s.followup_min) || 60, quiet_from: s.quiet_from || null, quiet_to: s.quiet_to || null,
      channels: s.channels || {}, vacation_until: s.vacation_until || null,
      rotation: s.rotation || "random", weekly_digest_time: s.weekly_digest_time || "20:00",
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from("reminder_settings").upsert(row, { onConflict: "user_id" });
    if (error) { console.warn("settings", error.message); return false; }
    return true;
  }

  async function pullSettings() {
    if (!user) return null;
    await ensureClient();
    const { data, error } = await client.from("reminder_settings").select("*").eq("user_id", user.id).maybeSingle();
    if (error || !data) return null;
    return {
      tz: data.tz, wd_am: String(data.wd_am).slice(0, 5), wd_pm: String(data.wd_pm).slice(0, 5),
      we_am: String(data.we_am).slice(0, 5), we_pm: String(data.we_pm).slice(0, 5),
      followup_min: data.followup_min, quiet_from: data.quiet_from, quiet_to: data.quiet_to,
      channels: data.channels || {}, vacation_until: data.vacation_until,
      rotation: data.rotation, weekly_digest_time: String(data.weekly_digest_time || "20:00").slice(0, 5),
      updated_at: data.updated_at
    };
  }

  /* ── код привязки Telegram ───────────────────────────────────────── */
  function genCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    const arr = new Uint32Array(6);
    crypto.getRandomValues(arr);
    for (let i = 0; i < 6; i++) s += alphabet[arr[i] % alphabet.length];
    return s;
  }

  async function createLinkCode() {
    if (!user) throw new Error("Сначала войдите по почте (magic link)");
    await ensureClient();
    const code = genCode();
    const { error } = await client.from("link_tokens").insert({
      code, user_id: user.id, expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
    if (error) throw error;
    return code;
  }

  async function telegramLinked() {
    if (!user) return null;
    await ensureClient();
    const { data } = await client.from("profiles").select("telegram_id").eq("id", user.id).maybeSingle();
    return data ? data.telegram_id : null;
  }

  return {
    configured,
    init, state, onChange, signIn, signInPassword, signOut, sync,
    pushSettings, pullSettings, createLinkCode, telegramLinked,
    ensureClient,
    get client() { return client; },
    get user() { return user; }
  };
})();

;
/* ===== ics.js ===== */
/* ics.js — генерация .ics для Google Calendar / Apple Calendar.
   События фиксируются в UTC на ближайшую дату, поэтому повторяются
   в нужное ЛОКАЛЬНОЕ время в любом часовом поясе (RRULE работает по UTC).
   Ограничение: при переходе на летнее/зимнее время событие может сдвинуться
   на час — тогда просто скачайте новый .ics и импортируйте повторно. */

const ICS = (() => {

  function fmtUTC(d) {
    const p = n => String(n).padStart(2, "0");
    return d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) +
      "T" + p(d.getUTCHours()) + p(d.getUTCMinutes()) + "00Z";
  }

  function partsInTZ(date, tz) {
    const s = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    }).format(date);
    const m = s.match(/(\d{4})-(\d{2})-(\d{2}),?\s*(\d{2}):(\d{2})/);
    return m ? { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5] } : null;
  }

  /** Находит ближайший момент (с сегодняшнего дня, до 8 дней вперёд),
   *  когда в часовом поясе tz будет hh:mm. Возвращает Date (момент в UTC). */
  function nextOccurrence(hhmm, tz) {
    const [hh, mi] = String(hhmm).split(":").map(Number);
    const now = new Date();
    for (let i = 0; i <= 8; i++) {
      const probe = new Date(now.getTime() + i * 86400000);
      const p = partsInTZ(probe, tz);
      if (!p) continue;
      const guess = new Date(Date.UTC(p.y, p.mo - 1, p.d, hh - 12, mi)); // грубая привязка
      for (let k = 0; k < 48; k++) {
        const cand = new Date(guess.getTime() + k * 3600000);
        const c = partsInTZ(cand, tz);
        if (c && c.h === hh && c.mi === mi) return cand;
      }
    }
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hh, mi));
  }

  function esc(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }

  function vevent(o) {
    const lines = [
      "BEGIN:VEVENT",
      "UID:" + o.uid,
      "DTSTAMP:" + fmtUTC(new Date()),
      "DTSTART:" + fmtUTC(o.start),
      "DTEND:" + fmtUTC(new Date(o.start.getTime() + (o.minutes || 6) * 60000)),
      "RRULE:" + o.rrule,
      "SUMMARY:" + esc(o.title),
      "DESCRIPTION:" + esc(o.description || ""),
      "TRANSP:TRANSPARENT"
    ];
    if (o.url) lines.push("URL:" + o.url);
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:" + esc(o.title),
      "TRIGGER:-PT0M",
      "END:VALARM",
      "END:VEVENT"
    );
    return lines.join("\r\n");
  }

  /**
   * @param {object} settings — wd_am/wd_pm/we_am/we_pm/tz/weekly_digest_time
   * @param {string} appUrl
   * @returns {string} содержимое .ics
   */
  function build(settings, appUrl) {
    const tz = settings.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const WD = "BYDAY=MO,TU,WE,TH,FR";
    const WE = "BYDAY=SA,SU";
    const desc = "Дневник «шесть минут»: три вопроса. Открыть приложение — " + (appUrl || "на домашнем экране iPhone");

    const events = [
      vevent({
        uid: "sixmin-am-wd@local", start: nextOccurrence(settings.wd_am, tz), rrule: "FREQ=DAILY;" + WD,
        title: "☀️ 6 минут: утро", description: desc, url: appUrl ? appUrl + "?slot=am" : null
      }),
      vevent({
        uid: "sixmin-pm-wd@local", start: nextOccurrence(settings.wd_pm, tz), rrule: "FREQ=DAILY;" + WD,
        title: "🌙 6 минут: вечер", description: desc, url: appUrl ? appUrl + "?slot=pm" : null
      }),
      vevent({
        uid: "sixmin-am-we@local", start: nextOccurrence(settings.we_am, tz), rrule: "FREQ=DAILY;" + WE,
        title: "☀️ 6 минут: утро (выходные)", description: desc, url: appUrl ? appUrl + "?slot=am" : null
      }),
      vevent({
        uid: "sixmin-pm-we@local", start: nextOccurrence(settings.we_pm, tz), rrule: "FREQ=DAILY;" + WE,
        title: "🌙 6 минут: вечер (выходные)", description: desc, url: appUrl ? appUrl + "?slot=pm" : null
      }),
      vevent({
        uid: "sixmin-weekly@local", start: nextOccurrence(settings.weekly_digest_time || "20:00", tz),
        rrule: "FREQ=WEEKLY;BYDAY=SU", minutes: 8,
        title: "📊 Обзор недели (5 вопросов)", description: desc, url: appUrl || null
      })
    ];

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//sixmin//diary//RU",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:6 минут с собой",
      "X-WR-TIMEZONE:" + tz,
      "BEGIN:VTIMEZONE",
      "TZID:UTC",
      "BEGIN:STANDARD",
      "DTSTART:19700101T000000",
      "TZOFFSETFROM:+0000",
      "TZOFFSETTO:+0000",
      "TZNAME:UTC",
      "END:STANDARD",
      "END:VTIMEZONE",
      events.join("\r\n"),
      "END:VCALENDAR",
      ""
    ].join("\r\n");
  }

  function download(settings, appUrl) {
    const text = build(settings, appUrl);
    Store.download("six-minutes.ics", text, "text/calendar;charset=utf-8");
    return text;
  }

  return { build, download, nextOccurrence, fmtUTC };
})();

;
/* ===== app.js ===== */
/* app.js — логика интерфейса «Шесть минут с собой» v0.1 */

const App = (() => {
  const CFG = window.SIXMIN_CONFIG || {};
  const $ = id => document.getElementById(id);
  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

  const MOOD_ICONS = ["😖", "😕", "😐", "🙂", "😄"];
  const ENERGY_ICONS = ["🪫", "🔋", "🔋", "🔋", "⚡️"];

  const state = {
    screen: "today",
    form: null,          // { slot, step, total, bank, answers, mood, energy, tags, started, editing }
    quick: { slot: null },
    month: new Date(),
    selectedDate: null,
    entries: [],
    settings: null,
    timerId: null,
    timerLeft: 180
  };

  /* ═══════════ навигация ═══════════ */
  function show(name) {
    state.screen = name;
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const target = $("screen-" + name);
    if (target) target.classList.add("active");
    const tabbar = $("tabbar");
    tabbar.style.display = (name === "form" || name === "quick" || name === "done") ? "none" : "flex";
    document.querySelectorAll("#tabbar button").forEach(b =>
      b.classList.toggle("active", b.dataset.tab === name));
    window.scrollTo(0, 0);
    if (target) target.scrollTop = 0;

    if (name === "today") renderToday();
    if (name === "history") renderHistory();
    if (name === "stats") renderStats();
    if (name === "settings") renderSettings();
  }

  function flash(msg, kind) {
    const f = $("flash");
    f.textContent = msg;
    f.className = "flash " + (kind || "");
    f.hidden = false;
    clearTimeout(f._t);
    f._t = setTimeout(() => { f.hidden = true; }, 3800);
  }

  /* ═══════════ ГЛАВНАЯ ═══════════ */
  async function renderToday() {
    const entries = await Store.allEntries();
    state.entries = entries;
    const today = Store.localDate();
    const d = new Date();
    $("today-date").textContent = d.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

    const st = Store.computeStreak(entries, today);
    $("today-streak").textContent = "🔥 " + st.current + (st.current === 1 ? " день" : (st.current < 5 ? " дня" : " дней"));

    [["am", "card-am", "am-sub", "am-action"], ["pm", "card-pm", "pm-sub", "pm-action"]].forEach(([slot, cardId, subId, actId]) => {
      const e = entries.find(x => x.date === today && x.slot === slot && !x.frozen && hasAnswers(x));
      const card = $(cardId);
      card.classList.toggle("done", !!e);
      $(subId).textContent = e
        ? "Заполнено " + new Date(e.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) + (e.mode === "quick" ? " · быстро" : "")
        : (slot === "am" ? "3 вопроса · около 3 минут" : "3 вопроса · настроение и энергия");
      $(actId).textContent = e ? "✓" : "→";
    });

    renderMemory(entries, today);
    renderSyncState();

    const weekly = entries.find(x => x.date === today && x.slot === "weekly");
    $("weekly-sub").textContent = weekly ? "Заполнен в этом tygodне ✓" : "5 вопросов · 5 минут, по воскресеньям";
    $("btn-weekly").textContent = weekly ? "Пересмотреть" : "Заполнить обзор";
  }

  function hasAnswers(e) {
    const a = e.answers || {};
    return Object.values(a).some(v => v && String(v).trim().length > 0) || e.mood || e.energy || e.voice_path;
  }

  function renderMemory(entries, today) {
    const cur = new Date();
    const candidates = [
      { label: "Год назад", date: shift(today, -365) },
      { label: "Месяц назад", date: shiftMonth(today, -1) },
      { label: "Неделю назад", date: shift(today, -7) }
    ];
    const card = $("memory-card");
    for (const c of candidates) {
      const e = entries.find(x => x.date === c.date && !x.frozen && hasAnswers(x));
      if (e) {
        const a = e.answers || {};
        const text = a.a1 || a.e2 || a.e1 || a.a2 || "";
        if (text) {
          $("memory-label").textContent = c.label + " · " + Store.parseDate(c.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
          $("memory-text").textContent = "«" + text.slice(0, 220) + "»";
          card.hidden = false;
          return;
        }
      }
    }
    card.hidden = true;
  }

  function shift(dateStr, days) {
    const d = Store.parseDate(dateStr); d.setDate(d.getDate() + days); return Store.localDate(d);
  }
  function shiftMonth(dateStr, months) {
    const d = Store.parseDate(dateStr); d.setMonth(d.getMonth() + months); return Store.localDate(d);
  }

  function renderSyncState() {
    const s = Cloud.state();
    const n = $("sync-state");
    if (!s.configured) { n.textContent = "Локально на устройстве (облако не настроено)"; $("btn-sync").hidden = true; return; }
    $("btn-sync").hidden = false;
    if (!s.user) n.textContent = "Облако настроено, вход не выполнен";
    else n.textContent = "Облако: " + s.user.email;
  }

  /* ═══════════ ФОРМА ═══════════ */
  function questionBank(slot) {
    return window.QUESTIONS[slot].map(q => {
      const pool = [q.main].concat(q.variants || []);
      const mode = (state.settings && state.settings.rotation) || "random";
      let idx = 0;
      if (pool.length > 1) {
        if (mode === "random") idx = Math.floor(Math.random() * pool.length);
        else if (mode === "weekly") {
          const now = new Date();
          const weekNo = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (7 * 86400000));
          idx = weekNo % pool.length;
        }
      }
      return { id: q.id, text: pool[idx], variant: idx, hint: q.hint || "" };
    });
  }

  async function openForm(slot, dateStr) {
    state.form = {
      slot, step: 0, bank: questionBank(slot), answers: {},
      mood: null, energy: null, tags: [], started: Date.now(),
      date: dateStr || Store.localDate(), editing: false
    };
    if (dateStr) {
      const existing = await Store.getEntry(dateStr, slot);
      if (existing) {
        state.form.answers = Object.assign({}, existing.answers || {});
        state.form.mood = existing.mood || null;
        state.form.energy = existing.energy || null;
        state.form.tags = (existing.tags || []).slice();
        state.form.editing = true;
      }
    }
    state.form.total = state.form.bank.length;
    const titles = { am: "☀️ Утро", pm: "🌙 Вечер", weekly: "📊 Обзор недели" };
    $("form-title").textContent = titles[slot] + (state.form.editing ? " (правка)" : "");
    state.timerLeft = slot === "weekly" ? 300 : 180;
    startTimer();
    renderStep();
    show("form");
  }

  function startTimer() {
    clearInterval(state.timerId);
    const t = $("form-timer");
    const paint = () => {
      const m = Math.floor(Math.abs(state.timerLeft) / 60), s = Math.abs(state.timerLeft) % 60;
      t.textContent = m + ":" + Store.pad(s);
      t.classList.toggle("over", state.timerLeft < 0);
    };
    paint();
    state.timerId = setInterval(() => { state.timerLeft--; paint(); }, 1000);
  }

  function stepCount() {
    const f = state.form;
    return f.slot === "pm" ? f.total + 1 : f.total;
  }

  function renderStep() {
    const f = state.form;
    const ratingStep = f.slot === "pm" && f.step === f.total;
    $("q-step").hidden = ratingStep;
    $("rate-step").hidden = !ratingStep;

    const steps = stepCount();
    $("form-progress").style.width = Math.min(100, Math.round(((f.step + 1) / steps) * 100)) + "%";
    $("btn-next").textContent = (f.step === steps - 1) ? "Сохранить" : "Дальше";
    $("btn-prev").textContent = f.step === 0 ? "Отмена" : "Назад";

    if (!ratingStep) {
      const q = f.bank[f.step];
      $("q-counter").textContent = "Вопрос " + (f.step + 1) + " из " + f.total;
      $("q-text").textContent = q.text;
      $("q-hint").textContent = q.hint || "";
      $("q-input").value = f.answers[q.id] || "";
      $("q-input").focus({ preventScroll: true });
    } else {
      renderRating();
    }
    // микропроверка «не слишком ли общо»
    const input = $("q-input");
    input.oninput = () => {
      f.answers[f.bank[f.step].id] = input.value;
      $("q-hint").textContent = (input.value.trim().length > 0 && input.value.trim().length < 15)
        ? "Можно конкретнее: что именно?"
        : (f.bank[f.step].hint || "");
    };
  }

  function renderRating() {
    const f = state.form;
    [["rate-mood", "mood", MOOD_ICONS], ["rate-energy", "energy", ENERGY_ICONS]].forEach(([id, key, icons]) => {
      const box = $(id); box.innerHTML = "";
      for (let i = 1; i <= 5; i++) {
        const b = el("button", f[key] === i ? "on" : "", icons[i - 1]);
        b.type = "button";
        b.onclick = () => { f[key] = i; renderRating(); };
        box.appendChild(b);
      }
    });
    const chips = $("tag-chips"); chips.innerHTML = "";
    window.TAGS.forEach(t => {
      const c = el("button", "chip" + (f.tags.indexOf(t) > -1 ? " on" : ""), t);
      c.type = "button";
      c.onclick = () => {
        const i = f.tags.indexOf(t);
        i > -1 ? f.tags.splice(i, 1) : f.tags.push(t);
        c.classList.toggle("on");
      };
      chips.appendChild(c);
    });
  }

  function nextStep() {
    const f = state.form;
    if (f.step < stepCount() - 1) { f.step++; renderStep(); }
    else saveForm();
  }

  function prevStep() {
    const f = state.form;
    if (f.step === 0) { closeForm(); return; }
    f.step--; renderStep();
  }

  async function saveForm() {
    const f = state.form;
    clearInterval(state.timerId);
    const variants = {};
    f.bank.forEach(q => variants[q.id] = q.variant);
    const answers = {};
    Object.keys(f.answers).forEach(k => { if (String(f.answers[k]).trim()) answers[k] = f.answers[k].trim(); });

    const rec = {
      date: f.date, slot: f.slot, answers,
      question_variants: variants,
      mode: f.editing ? "full" : "full",
      duration_sec: Math.max(1, Math.round((Date.now() - f.started) / 1000)),
      device: "pwa"
    };
    if (f.slot === "pm") { rec.mood = f.mood; rec.energy = f.energy; rec.tags = f.tags; }
    if (f.slot === "weekly") { rec.tags = f.tags; }

    const saved = await Store.saveEntry(rec);
    await Cloud.sync().catch(() => {});

    const entries = await Store.allEntries();
    const st = Store.computeStreak(entries, Store.localDate());
    $("done-emoji").textContent = f.slot === "am" ? "☀️" : (f.slot === "weekly" ? "📊" : "🌙");
    $("done-title").textContent = saved.frozen ? "Сохранено" : (f.slot === "am" ? "Утро записано" : "День записан");
    $("done-sub").textContent = "🔥 Серия: " + st.current + " · рекорд " + st.longest +
      (saved.backfilled ? " · запись задним числом" : "");
    const q = window.QUOTES[Math.floor(Math.random() * window.QUOTES.length)] || {};
    $("done-quote").textContent = q.t || "Прогресс важнее совершенства.";
    $("done-quote-author").textContent = q.a ? "— " + q.a : "";
    show("done");
    if (navigator.vibrate) navigator.vibrate(12);
  }

  function closeForm() {
    clearInterval(state.timerId);
    state.form = null;
    show("today");
  }

  /* ═══════════ голосовой ввод (Web Speech) ═══════════ */
  function toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { flash("Диктовка не поддерживается этим браузером — используйте микрофон на клавиатуре iPhone", "err"); return; }
    const btn = $("btn-mic");
    if (state.rec) { try { state.rec.stop(); } catch (e) {} return; }
    const rec = new SR();
    rec.lang = "ru-RU"; rec.continuous = true; rec.interimResults = true;
    const input = $("q-input");
    let base = input.value;
    rec.onstart = () => { btn.textContent = "⏹ Стоп"; btn.classList.add("on"); };
    rec.onresult = (ev) => {
      let txt = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
      input.value = (base + " " + txt).replace(/\s+/g, " ").trim();
      input.dispatchEvent(new Event("input"));
    };
    rec.onerror = (e) => { flash("Диктовка: " + e.error, "err"); };
    rec.onend = () => { btn.textContent = "🎙 Диктовка"; state.rec = null; base = input.value; };
    state.rec = rec;
    try { rec.start(); } catch (e) { flash("Не удалось запустить диктовку", "err"); }
  }

  /* ═══════════ БЫСТРАЯ ЗАПИСЬ ═══════════ */
  function openQuick() {
    const hour = new Date().getHours();
    state.quick.slot = hour < 15 ? "am" : "pm";
    document.querySelectorAll("#quick-slot button").forEach(b =>
      b.classList.toggle("on", b.dataset.slot === state.quick.slot));
    ["quick-1", "quick-2", "quick-3"].forEach(id => $(id).value = "");
    show("quick");
    setTimeout(() => $("quick-1").focus(), 120);
  }

  async function saveQuick() {
    const ids = { am: ["a1", "a2", "a3"], pm: ["e1", "e2", "e3"] }[state.quick.slot];
    const answers = {};
    [$("quick-1").value, $("quick-2").value, $("quick-3").value].forEach((v, i) => {
      if (v && v.trim()) answers[ids[i]] = v.trim();
    });
    if (!Object.keys(answers).length) { flash("Напишите хотя бы одну строку", "err"); return; }
    await Store.saveEntry({ date: Store.localDate(), slot: state.quick.slot, answers, mode: "quick", duration_sec: null });
    await Cloud.sync().catch(() => {});
    flash("Сохранено в «" + (state.quick.slot === "am" ? "утро" : "вечер") + "» ✓", "ok");
    show("today");
  }

  /* ═══════════ ИСТОРИЯ ═══════════ */
  async function renderHistory() {
    const entries = await Store.allEntries();
    state.entries = entries;
    renderMonth();
    if (state.selectedDate) renderDayDetail(state.selectedDate);
  }

  function renderMonth() {
    const m = state.month;
    $("m-label").textContent = m.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
    const wd = $("grid-weekdays"); wd.innerHTML = "";
    ["пн", "вт", "ср", "чт", "пт", "сб", "вс"].forEach(d => wd.appendChild(el("div", null, d)));

    const grid = $("grid-month"); grid.innerHTML = "";
    const first = new Date(m.getFullYear(), m.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first); start.setDate(1 - startOffset);
    const today = Store.localDate();

    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const key = Store.localDate(d);
      const cell = el("div", "day");
      if (d.getMonth() !== m.getMonth()) cell.classList.add("other");
      if (key === today) cell.classList.add("today");
      if (key === state.selectedDate) cell.classList.add("sel");
      cell.appendChild(el("div", null, String(d.getDate())));

      const dayEntries = state.entries.filter(e => e.date === key);
      const frozen = dayEntries.some(e => e.frozen);
      const slots = new Set(dayEntries.filter(e => !e.frozen && hasAnswers(e)).map(e => e.slot));
      const dot = el("i", "dot " + (frozen && !slots.size ? "frozen" : (slots.size >= 2 ? "full" : (slots.size === 1 ? "part" : "empty"))));
      cell.appendChild(dot);
      cell.onclick = () => { state.selectedDate = key; renderMonth(); renderDayDetail(key); };
      grid.appendChild(cell);
      if (i >= 34 && d.getMonth() !== m.getMonth()) break;
    }
  }

  async function renderDayDetail(dateStr) {
    const box = $("day-detail");
    const entries = await Store.allEntries();
    const day = entries.filter(e => e.date === dateStr).sort((a, b) => (a.slot === "weekly" ? 1 : b.slot === "weekly" ? -1 : 0));
    box.hidden = false;
    box.innerHTML = "";
    const card = el("div", "card");
    card.appendChild(el("h3", null, Store.parseDate(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" })));
    if (!day.length) {
      card.appendChild(el("p", "muted", "Записей нет."));
      const b = el("button", "btn secondary", "Добавить задним числом");
      b.onclick = () => openForm(new Date().getHours() < 15 ? "am" : "pm", dateStr);
      card.appendChild(b);
      box.appendChild(card);
      return;
    }
    const labels = { am: ["☀️ Утро", window.QUESTIONS.am], pm: ["🌙 Вечер", window.QUESTIONS.pm], weekly: ["📊 Обзор недели", window.QUESTIONS.weekly] };
    day.forEach(e => {
      const [title, qs] = labels[e.slot];
      const blk = el("div", "entry-block");
      const h = el("h3", null, title + (e.frozen ? " · 🧊 заморозка" : "") + (e.mode === "quick" ? " · быстро" : "") + (e.mode === "voice" ? " · 🎙" : ""));
      blk.appendChild(h);
      qs.forEach(q => {
        const v = (e.answers || {})[q.id];
        if (!v) return;
        blk.appendChild(el("div", "entry-q", q.main));
        blk.appendChild(el("div", "entry-a", v));
      });
      const meta = [];
      if (e.mood) meta.push("настроение " + MOOD_ICONS[e.mood - 1] + " " + e.mood);
      if (e.energy) meta.push("энергия " + ENERGY_ICONS[e.energy - 1] + " " + e.energy);
      if ((e.tags || []).length) meta.push(e.tags.join(", "));
      if (e.duration_sec) meta.push(Math.round(e.duration_sec / 60) + " мин");
      if (meta.length) blk.appendChild(el("div", "entry-q", meta.join(" · ")));

      const row = el("div", "btn-row");
      const edit = el("button", "btn ghost", "Изменить");
      edit.onclick = () => openForm(e.slot, dateStr);
      const del = el("button", "btn danger", "Удалить");
      del.onclick = async () => {
        if (!confirm("Удалить запись за " + dateStr + " (" + title + ")?")) return;
        await Store.deleteEntry(e.id);
        if (Cloud.user) {
          try { await Cloud.client.from("entries").delete().eq("id", e.id); } catch (err) { console.warn(err); }
        }
        renderHistory();
      };
      row.appendChild(edit); row.appendChild(del);
      blk.appendChild(row);
      card.appendChild(blk);
    });
    box.appendChild(card);
  }

  function doSearch(q) {
    const box = $("search-results");
    box.innerHTML = "";
    const query = (q || "").trim().toLowerCase();
    if (!query) return;
    const found = state.entries.filter(e => {
      const a = Object.values(e.answers || {}).join(" ").toLowerCase();
      return a.indexOf(query) > -1 || (e.tags || []).join(" ").indexOf(query) > -1;
    }).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
    if (!found.length) { box.appendChild(el("p", "muted", "Ничего не найдено")); return; }
    found.forEach(e => {
      const card = el("div", "card");
      card.appendChild(el("div", "entry-q", Store.parseDate(e.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) + " · " + ({ am: "утро", pm: "вечер", weekly: "неделя" }[e.slot])));
      const a = e.answers || {};
      const snippet = Object.values(a).find(v => String(v).toLowerCase().indexOf(query) > -1) || Object.values(a)[0] || "";
      card.appendChild(el("div", "entry-a", String(snippet).slice(0, 200)));
      card.onclick = () => { state.selectedDate = e.date; state.month = Store.parseDate(e.date); $("search").value = ""; renderHistory(); };
      box.appendChild(card);
    });
  }

  /* ═══════════ СТАТИСТИКА ═══════════ */
  async function renderStats() {
    const entries = await Store.allEntries();
    const s = Store.stats(entries);
    $("stat-streak").textContent = s.streak.current;
    $("stat-longest").textContent = s.streak.longest;
    $("stat-month").textContent = s.monthDays;
    $("stat-avg").textContent = s.avgSec ? Math.max(1, Math.round(s.avgSec / 60)) + " мин" : "—";

    const bars = $("bars-chart"); bars.innerHTML = "";
    s.last14.forEach(d => {
      const g = el("div", "bargroup");
      const pair = el("div", "pair");
      pair.appendChild(el("i", "mood")).style.height = (d.mood ? d.mood * 18 : 2) + "px";
      pair.appendChild(el("i", "energy")).style.height = (d.energy ? d.energy * 18 : 2) + "px";
      g.appendChild(pair);
      g.appendChild(el("small", null, d.label));
      bars.appendChild(g);
    });

    const maxTag = s.topTags.length ? s.topTags[0][1] : 1;
    const tt = $("top-tags"); tt.innerHTML = "";
    if (!s.topTags.length) tt.appendChild(el("p", "muted", "Пока нет тегов — отмечайте их в вечернем блоке"));
    s.topTags.forEach(([t, c]) => {
      const row = el("div", "row");
      row.appendChild(el("b", null, t));
      const track = el("div", "track"); const fill = el("div", "fill");
      fill.style.width = Math.round(c / maxTag * 100) + "%";
      track.appendChild(fill); row.appendChild(track);
      row.appendChild(el("span", null, String(c)));
      tt.appendChild(row);
    });

    const hh = $("hour-hist"); hh.innerHTML = "";
    if (!s.topHours.length) hh.appendChild(el("p", "muted", "Недостаточно данных"));
    const maxH = s.topHours.length ? s.topHours[0].count : 1;
    s.topHours.forEach(h => {
      const row = el("div", "row");
      row.appendChild(el("b", null, h.label));
      const track = el("div", "track"); const fill = el("div", "fill");
      fill.style.width = Math.round(h.count / maxH * 100) + "%";
      track.appendChild(fill); row.appendChild(track);
      row.appendChild(el("span", null, String(h.count)));
      hh.appendChild(row);
    });
  }

  /* ═══════════ НАСТРОЙКИ ═══════════ */
  async function renderSettings() {
    const s = await Store.getSettings();
    state.settings = s;
    $("set-wd-am").value = s.wd_am; $("set-wd-pm").value = s.wd_pm;
    $("set-we-am").value = s.we_am; $("set-we-pm").value = s.we_pm;
    $("set-followup").value = s.followup_min;
    $("set-tz").value = s.tz;
    $("set-vacation").value = s.vacation_until || "";
    $("set-rotation").value = s.rotation || "random";
    $("build-info").textContent = "v" + (CFG.version || "0.1");
    renderAuth();
    renderSyncState();
  }

  function renderAuth() {
    const st = Cloud.state();
    const box = $("auth-box"), status = $("auth-status"), out = $("btn-logout");
    if (!st.configured) {
      status.textContent = "Облако не настроено: заполните supabaseUrl и supabaseAnonKey в pwa/js/config.js";
      box.hidden = true; out.hidden = true; return;
    }
    box.hidden = !!st.user; out.hidden = !st.user;
    status.textContent = st.user ? ("Подключено: " + st.user.email) : "Не подключено — записи хранятся только на этом устройстве.";
  }

  async function saveSettings() {
    const patch = {
      wd_am: $("set-wd-am").value || "07:30",
      wd_pm: $("set-wd-pm").value || "22:00",
      we_am: $("set-we-am").value || "09:30",
      we_pm: $("set-we-pm").value || "22:30",
      followup_min: parseInt($("set-followup").value || "60", 10),
      vacation_until: $("set-vacation").value || null,
      rotation: $("set-rotation").value
    };
    const s = await Store.saveSettings(patch);
    state.settings = s;
    if (Cloud.user) {
      const ok = await Cloud.pushSettings(s);
      flash(ok ? "Сохранено и отправлено боту — напоминания перепланируются в течение часа ✓"
        : "Сохранено локально, но облако ответило ошибкой", ok ? "ok" : "err");
    } else {
      flash("Сохранено на устройстве. Подключите облако и Telegram, чтобы получать напоминания.");
    }
  }

  async function login() {
    const email = $("auth-email").value;
    if (!email || email.indexOf("@") < 0) { flash("Введите корректную почту", "err"); return; }
    try {
      await Cloud.signIn(email);
      flash("Письмо со ссылкой отправлено на " + email + ". Откройте его на этом же устройстве.", "ok");
    } catch (e) {
      flash("Ошибка входа: " + e.message, "err");
    }
  }

  async function loginPass() {
    const email = $("auth-email").value;
    const pass = $("auth-pass").value;
    if (!email || email.indexOf("@") < 0) { flash("Введите корректную почту", "err"); return; }
    if (!pass) { flash("Введите пароль", "err"); return; }
    try {
      await Cloud.signInPassword(email, pass);
      flash("Вход выполнен ✓", "ok");
      renderAuth(); renderSyncState();
    } catch (e) {
      flash("Ошибка входа: " + e.message, "err");
    }
  }

  async function genLinkCode() {
    try {
      const code = await Cloud.createLinkCode();
      $("link-code").textContent = code;
      $("link-note").innerHTML = "Отправьте боту: <code>/link " + code + "</code> (действует 15 минут)";
      if (navigator.clipboard) { navigator.clipboard.writeText("/link " + code).catch(() => {}); }
    } catch (e) {
      flash("Не удалось создать код: " + e.message, "err");
    }
  }

  async function refreshTelegramStatus() {
    if (!Cloud.user) return;
    try {
      const tg = await Cloud.telegramLinked();
      $("link-note").textContent = tg ? ("✅ Telegram привязан (id " + tg + "). Напоминания придут в бота.") : "";
    } catch (e) { /* игнорируем */ }
  }

  /* ═══════════ шторка-инструкция ═══════════ */
  const INFO = {
    am: "<h3>☀️ Утро · 3 вопроса · ~3 минуты</h3>" +
        "<p>Цель блока — включить внимание до того, как день начнёт happening сам.</p>" +
        "<ul><li>Пишите первое честное, а не «правильное».</li>" +
        "<li>Конкретика сильнее общих слов: не «всё хорошо», а «кофе в тишине до всеобщего подъёма».</li>" +
        "<li>Нет времени печатать — кнопка «🎙 Диктовка» или «⚡ Быстро» на главном экране.</li>" +
        "<li>Черновик сохраняется сам: можно свернуться и дописать позже.</li></ul>" +
        "<p class='muted'>Таймер 3:00 — ориентир, а не ограничение: он просто подскажет, если вы углубились.</p>",
    pm: "<h3>🌙 Вечер · 3 вопроса + оценки · ~3 минуты</h3>" +
        "<ul><li>Третий вопрос — про урок, а не про вину: факт → вывод → действие на завтра.</li>" +
        "<li>Настроение и энергия (1–5) строят график на вкладке «Прогресс».</li>" +
        "<li>Теги (работа, семья, здоровье…) показывают, из чего состоит ваша хорошая жизнь.</li>" +
        "<li>Совсем нет сил — ответьте одной фразой в Telegram-боту, запись появится здесь.</li></ul>",
    weekly: "<h3>📊 Обзор недели · 5 вопросов · ~5 минут</h3>" +
        "<p>Заполняется по воскресеньям. Это мини-ретроспектива: что дало энергию, что забрало, кому сказать спасибо и какой один приоритет на следующую неделю.</p>" +
        "<p class='muted'>Пять ответов в неделю дают больше для решений, чем семьдесят заметок без паузы.</p>",
    quick: "<h3>⚡ Быстрая запись · 3 строки · 10 секунд</h3>" +
        "<p>Для моментов, когда «шесть минут» не помещаются в день. Три строки засчитываются в серию как полноценный день.</p>" +
        "<ul><li>Строка 1 — что хорошего сейчас / произошло.</li>" +
        "<li>Строка 2 — что важно сегодня.</li>" +
        "<li>Строка 3 — какой вывод вы берёте из сегодня в завтра.</li></ul>" +
        "<p class='muted'>Позже можно открыть день в «Истории» → «Изменить» и дописать полностью.</p>"
  };

  function openInfo(key) {
    const body = $("info-body");
    body.innerHTML = INFO[key] || "";
    $("info-sheet").hidden = false;
  }
  function closeInfo() { $("info-sheet").hidden = true; }

  /* ═══════════ события ═══════════ */
  function bind() {
    document.querySelectorAll("#tabbar button").forEach(b => b.onclick = () => show(b.dataset.tab));

    $("card-am").onclick = () => openForm("am", Store.localDate());
    $("card-pm").onclick = () => openForm("pm", Store.localDate());
    $("btn-weekly").onclick = () => openForm("weekly", Store.localDate());
    $("btn-quick").onclick = openQuick;
    $("btn-quick-close").onclick = () => show("today");
    $("btn-quick-save").onclick = saveQuick;
    document.querySelectorAll("#quick-slot button").forEach(b =>
      b.onclick = () => {
        state.quick.slot = b.dataset.slot;
        document.querySelectorAll("#quick-slot button").forEach(x => x.classList.toggle("on", x === b));
      });

    $("btn-form-close").onclick = closeForm;
    $("btn-next").onclick = nextStep;
    $("btn-prev").onclick = prevStep;
    $("btn-mic").onclick = toggleMic;
    $("btn-done-close").onclick = () => show("today");
    document.querySelectorAll("[data-info]").forEach(b =>
      b.onclick = (ev) => { ev.stopPropagation(); openInfo(b.dataset.info); });
    $("info-close").onclick = closeInfo;
    $("info-back").onclick = closeInfo;
    $("btn-sync").onclick = async () => {
      const r = await Cloud.sync();
      if (r.ok) { await renderToday(); flash("Синхронизация: отправлено " + (r.pushed || 0) + ", получено " + (r.pulled || 0), "ok"); }
      else flash("Синхронизация не удалась: " + (r.reason || "нет входа"), "err");
    };

    $("m-prev").onclick = () => { state.month.setMonth(state.month.getMonth() - 1); renderMonth(); };
    $("m-next").onclick = () => { state.month.setMonth(state.month.getMonth() + 1); renderMonth(); };
    let st;
    $("search").oninput = e => { clearTimeout(st); st = setTimeout(() => doSearch(e.target.value), 250); };

    $("btn-save-settings").onclick = saveSettings;
    $("btn-login").onclick = login;
    $("btn-login-pass").onclick = loginPass;
    $("btn-logout").onclick = async () => { await Cloud.signOut(); renderAuth(); flash("Вы вышли из облака"); };
    $("btn-gen-code").onclick = genLinkCode;
    $("btn-ics").onclick = async () => {
      const s = await Store.getSettings();
      ICS.download(s, CFG.appUrl);
      flash("Файл six-minutes.ics сохранён. iPhone: открыть файл → «Добавить всё».", "ok");
    };

    $("btn-export-json").onclick = async () => {
      const e = await Store.allEntries();
      Store.download("sixmin-" + Store.localDate() + ".json", JSON.stringify({ exported: new Date().toISOString(), entries: e }, null, 2), "application/json");
    };
    $("btn-export-csv").onclick = async () => {
      const e = await Store.allEntries();
      Store.download("sixmin-" + Store.localDate() + ".csv", Store.toCSV(e), "text/csv;charset=utf-8");
    };
    $("btn-export-md").onclick = async () => {
      const e = await Store.allEntries();
      Store.download("sixmin-" + Store.localDate() + ".md", Store.toMarkdown(e), "text/markdown;charset=utf-8");
    };
    $("file-import").onchange = async ev => {
      const f = ev.target.files[0]; if (!f) return;
      try {
        const text = await f.text();
        const r = await Store.importJSON(text);
        await Cloud.sync().catch(() => {});
        flash("Импорт: добавлено " + r.added + ", обновлено " + r.updated + " из " + r.total, "ok");
        renderToday();
      } catch (e) { flash("Ошибка импорта: " + e.message, "err"); }
      ev.target.value = "";
    };
    $("btn-freeze").onclick = async () => {
      await Store.freezeDay(Store.localDate());
      await Cloud.sync().catch(() => {});
      flash("🧊 Сегодня заморожено — серия не прервётся", "ok");
      renderToday();
    };
    $("btn-wipe").onclick = async () => {
      if (!confirm("Удалить ВСЕ записи на этом устройстве? Сначала сделайте экспорт.")) return;
      await Store.wipe();
      flash("Данные устройства стёрты");
      renderToday();
    };

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && state.screen === "today") { renderToday(); Cloud.sync().catch(() => {}); }
    });
    window.addEventListener("online", () => Cloud.sync().catch(() => {}));
  }

  /* ═══════════ инициализация ═══════════ */
  async function init() {
    await Store.open();
    // часовой пояс устройства — по умолчанию
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || CFG.defaultTimezone;
    const s0 = await Store.getSettings();
    if (!s0.tz || s0.tz === window.DEFAULT_SETTINGS.tz) await Store.saveSettings({ tz });
    state.settings = await Store.getSettings();

    await Cloud.init();
    Cloud.onChange(() => {
      renderAuth(); renderSyncState(); refreshTelegramStatus();
      const st = Cloud.state();
      if (st.user && !state.settingsPulled) {
        state.settingsPulled = true;
        Cloud.pullSettings()
          .then(remote => remote ? Store.saveSettings(remote).then(s2 => { state.settings = s2; }) : null)
          .catch(() => {});
      }
    });
    if (Cloud.user) {
      state.settingsPulled = true;
      const remote = await Cloud.pullSettings().catch(() => null);
      if (remote) { state.settings = await Store.saveSettings(remote); }
      Cloud.sync().catch(() => {});
    }

    bind();
    show("today");

    // deep link: ?slot=am / ?slot=pm / ?quick=1
    const params = new URLSearchParams(location.search);
    const slot = params.get("slot");
    if (params.get("quick") === "1") setTimeout(openQuick, 250);
    else if (slot === "am" || slot === "pm") setTimeout(() => openForm(slot, Store.localDate()), 250);

    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("sw.js").catch(e => console.warn("SW", e));
    }
    if (window.matchMedia("(display-mode: standalone)").matches) document.body.classList.add("standalone");
  }

  return { init, show, openForm, flash, state };
})();

document.addEventListener("DOMContentLoaded", () => { App.init().catch(e => { console.error(e); alert("Ошибка инициализации: " + e.message); }); });

