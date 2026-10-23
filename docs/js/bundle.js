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
  // v0.8.9: ВСЕ отправляемые ссылки (письма сброса, magic link, .ics) ведут на зеркало:
  // studiomwm.ru не открывается из РФ без VPN, а ссылка обязана быть доступной получателю.
  appUrl: "https://thesatellite80-code.github.io/dnevnik/",

  // ── 3. ПРОЧЕЕ ──────────────────────────────────────────────────────
  defaultTimezone: "Europe/Moscow",
  version: "9.0.4"
};

/* ── Контент: вопросы (свои формулировки, пул вариантов для ротации) ── */

window.QUESTIONS = {
  am: [
    {
      id: "a1",
      main: "Какие планы на сегодня? Главные 1–3 пункта."
      , variants: [
        "Что должно случиться, чтобы день считался удачным?",
        "Три главные задачи на сегодня — какие?"
      ],
      hint: "Не десять «надо», а 1–3 «сделаю»: план, который реально унести"
    },
    {
      id: "a2",
      main: "С чего начнёшь — и во сколько?",
      variants: [
        "Первый шаг и время — какие?",
        "Какая задача получит лучший час дня?"
      ],
      hint: "План с временем — решение, план без времени — мечта"
    },
    {
      id: "a3",
      main: "Что может помешать — и каков обходной путь?",
      variants: [
        "Какой риск у плана — и план Б?",
        "Где споткнёшься — и как обойдёшь?"
      ],
      hint: "Препятствие, названное утром, не застаёт врасплох днём"
    }
  ],
  pm: [
    {
      id: "e1",
      main: "Что успел(а) сегодня? Записывай фактами."
      , variants: [
        "Что отмечешь «сделано», не скромничая?",
        "Какой результат дня можно потрогать?"
      ],
      hint: "Факты, а не оценки: «позвонил(а)», «дописал(а)», «начал(а)» — всё считается"
    },
    {
      id: "e2",
      main: "Что не успел(а) — и решение: завтра, отказаться или делегировать?",
      variants: [
        "Какой хвост остаётся — и куда он идёт: в завтра, в корзину, другому?",
        "Что осталось несделанным — и какое решение по этому?"
      ],
      hint: "Хвост с решением — план, хвост без решения — тревога"
    },
    {
      id: "e3",
      main: "Что поменять в плане на завтра по итогам сегодня?",
      variants: [
        "Чему день научил твой план?",
        "Что завтра сделаешь иначе?"
      ],
      hint: "Одной правки достаточно: так план превращается в стратегию"
    }
  ],
  weekly: [
    { id: "w1", main: "Что было главным «не зря» этой недели?", variants: [], hint: "Не самое громкое, а самое двигающее" },
    { id: "w2", main: "Что повторялось трижды и больше — уже как узор, а не случайность?", variants: [], hint: "Узоры — это то, из чего строятся графики и привычки" },
    { id: "w3", main: "Где утекала энергия — и что из этого убрать, делегировать или упростить?", variants: [], hint: "Один кандидат на вылет из следующей недели" },
    { id: "w4", main: "Кто сделал твою неделю легче — и знает ли он об этом?", variants: [], hint: "Спасибо, сказанное вслух, считается вдвойне" },
    { id: "w5", main: "Одно обещание следующей неделе — и первый шаг к нему?", variants: [], hint: "Обещание без первого шага — просто мечта" }
  ]
};

/* ── Теги (под ваши сферы: работа, здоровье, семья, быт, свои проекты) ── */
window.TAGS = ["работа", "здоровье", "семья", "быт", "свои проекты", "спорт", "деньги", "отдых", "учёба"];

/* ── v0.8.58: пары для утренней разминки «найди 3 общих признака» ──────
   Кнопка «🧠 Размять мозг (1 мин)» на экране «Сегодня» (логика в v02.js).
   В течение дня пара не повторяется (localStorage); пользователь не видит
   никаких методологических названий — только простое упражнение. */
window.WARMUP_PAIRS = [
  ["чайник", "будильник"], ["зонтик", "парашют"], ["плитка", "пазл"], ["велосипед", "швейная машинка"],
  ["гитара", "лук"], ["хлеб", "кирпич"], ["мыло", "ластик"], ["самолёт", "птица"],
  ["вентилятор", "вертолёт"], ["дверь", "книга"], ["река", "дорога"], ["зеркало", "окно"],
  ["мяч", "колесо"], ["рюкзак", "холодильник"], ["стакан", "ведро"], ["подушка", "облако"],
  ["лопата", "вилка"], ["печка", "термос"], ["ключ", "кнопка"], ["кольцо", "монета"],
  ["конверт", "чемодан"], ["мост", "игла"], ["почтовый ящик", "копилка"], ["шарф", "ремень"],
  ["кастрюля", "барабан"], ["дерево", "дом"], ["телевизор", "картина"], ["лимон", "лампочка"],
  ["тапочки", "ласты"], ["щётка", "швабра"], ["пульт", "телефон"], ["кресло", "гамак"],
  ["тент", "крыша"], ["фонарь", "маяк"], ["медаль", "пуговица"], ["термометр", "линейка"]
];

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
  weekly_digest_time: "20:00",
  ics_days: 90,
  ics_shifts_only: false
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
      // v0.8.4: вход по recovery-ссылке = сеанс восстановления: сразу просим новый пароль
      if (_ev === "PASSWORD_RECOVERY") {
        setTimeout(() => {
          show("settings");
          flash("Вы вошли по ссылке восстановления — задайте новый пароль в карточке «Облако» и сохраните.", "ok");
        }, 400);
      }
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
  // v0.8.4: смена пароля у залогиненного пользователя (после временного или recovery-входа)
  async function changePassword(pass) {
    const c = await ensureClient();
    const { error } = await c.auth.updateUser({ password: pass });
    if (error) throw error;
    return true;
  }
  // v0.7.2: сброс пароля письмом (кнопка «забыли пароль?» в карточке облака)
  async function resetPassword(email) {
    const c = await ensureClient();
    const { error } = await c.auth.resetPasswordForEmail(email.trim(), { redirectTo: CFG.appUrl });
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
    if (!user) return { pushed: 0, failed: 0 };
    const all = await Store.allEntries();
    const dirty = all.filter(e => e.dirty);
    if (!dirty.length) return { pushed: 0, failed: 0 };
    let pushed = 0, failed = 0, lastErr = "";
    for (let i = 0; i < dirty.length; i += 50) {
      const batch = dirty.slice(i, i + 50).map(rowOf);
      // v0.8.52: id НЕ отправляем: после локальной смены date/slot upsert со старым id
      // бил по PK (409 Conflict, запись v0.8.21). Конфликт решаем по (user_id,date,slot).
      const rows = batch.map((r) => { const c = Object.assign({}, r); delete c.id; return c; });
      const { error } = await client.from("entries").upsert(rows, { onConflict: "user_id,date,slot" });
      if (error) {
        // v9.0.2: ошибка пачки больше не тонет в консоли — счётчик и плашка показывают число и причину
        console.warn("push", error.message, error.code || "", error.details || "");
        failed += batch.length; lastErr = (error.code || "") + " " + error.message;
        continue;
      }
      // сверка id: сервер мог слить строку в свой id; осиротевший локальный id убираем
      const dates = batch.map((r) => r.date);
      const sel = await client.from("entries").select("id,date,slot").eq("user_id", user.id).in("date", dates);
      const byKey = {};
      for (const r of (sel.data || [])) byKey[r.date + "|" + r.slot] = r.id;
      for (const e of dirty.slice(i, i + 50)) {
        const sid = byKey[e.date + "|" + e.slot];
        if (sid && sid !== e.id) {
          await client.from("entries").delete().eq("id", e.id); // 0 строк, если его не было на сервере
          await Store.saveEntry(Object.assign({}, e, { id: sid, dirty: false }));
        } else {
          await Store.saveEntry(Object.assign({}, e, { id: sid || e.id, dirty: false }));
        }
      }
      pushed += batch.length;
    }
    return { pushed, failed, lastErr };
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

  function withTimeoutC(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_res, rej) => setTimeout(() => rej(new Error("облако не отвечает " + Math.round(ms / 1000) + " с")), ms)),
    ]);
  }

  async function sync() {
    if (!configured) return { ok: false, reason: "облако не настроено" };
    try {
      // v9.0.2: getSession/refresh токена мог висеть без ответа — кнопка выглядела мёртвой;
      // теперь ждём не дольше 10 с и говорим причину вслух.
      await withTimeoutC(ensureClient(), 10000);
    } catch (e) {
      return { ok: false, reason: e.message };
    }
    if (!user) return { ok: false, reason: "нет входа" };
    try {
      const p = await push();
      const q = await pull();
      await Store.setMeta("last_sync", new Date().toISOString());
      emit();
      return { ok: true, pushed: p.pushed, pulled: q.pulled, failed: p.failed || 0, lastErr: p.lastErr || "" };
    } catch (e) {
      console.error("sync", e);
      return { ok: false, reason: e.message };
    }
  }

  /* ── настройки напоминаний ───────────────────────────────────────── */
  // v0.8.52: строка reminder_settings собирается ТОЛЬКО здесь и только из валидных значений:
  // любое поле с мусором (пустое время, кривая дата, неизвестная ротация) заменяется дефолтом,
  // чтобы upsert не уезжал в 400 (invalid input / not-null). Дефолты = DEFAULT_SETTINGS.
  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  const tOr = (v, d) => (typeof v === "string" && TIME_RE.test(v.trim()) ? v.trim() : d);
  function settingsRow(s) {
    const D = window.DEFAULT_SETTINGS;
    const src = Object.assign({}, D, s || {});
    return {
      user_id: user.id,
      tz: (typeof src.tz === "string" && src.tz.trim()) ? src.tz.trim().slice(0, 64) : D.tz,
      wd_am: tOr(src.wd_am, D.wd_am), wd_pm: tOr(src.wd_pm, D.wd_pm),
      we_am: tOr(src.we_am, D.we_am), we_pm: tOr(src.we_pm, D.we_pm),
      followup_min: Math.min(240, Math.max(0, parseInt(src.followup_min, 10) || D.followup_min)),
      quiet_from: src.quiet_from ? tOr(src.quiet_from, null) : null,
      quiet_to: src.quiet_to ? tOr(src.quiet_to, null) : null,
      channels: (src.channels && typeof src.channels === "object") ? src.channels : D.channels,
      vacation_until: (typeof src.vacation_until === "string" && /^\d{4}-\d{2}-\d{2}/.test(src.vacation_until)) ? src.vacation_until.slice(0, 10) : null,
      rotation: ["fixed", "random", "weekly"].includes(src.rotation) ? src.rotation : D.rotation,
      weekly_digest_time: tOr(src.weekly_digest_time, D.weekly_digest_time),
      updated_at: new Date().toISOString()
    };
  }
  async function pushSettings(s) {
    if (!user) return false;
    await ensureClient();
    const row = settingsRow(s);
    const { error } = await client.from("reminder_settings").upsert(row, { onConflict: "user_id" });
    if (error) { console.warn("settings", error.message, error.code || "", error.details || "", JSON.stringify(row)); return false; }
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
    init, state, onChange, signIn, signInPassword, resetPassword, changePassword, signOut, sync,
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
  function ymdPlus(ymd, days) {
    const y = +ymd.slice(0, 4), m = +ymd.slice(4, 6), d = +ymd.slice(6, 8);
    const dt = new Date(y, m - 1, d + days);
    const p = (n) => String(n).padStart(2, "0");
    return dt.getFullYear() + p(dt.getMonth() + 1) + p(dt.getDate());
  }

  function vevent(o) {
    const lines = [
      "BEGIN:VEVENT",
      "UID:" + o.uid,
      "DTSTAMP:" + fmtUTC(new Date()),
      ...(o.allday
        ? ["DTSTART;VALUE=DATE:" + o.dateYMD, "DTEND;VALUE=DATE:" + o.endDateYMD]
        : ["DTSTART:" + fmtUTC(o.start), "DTEND:" + fmtUTC(new Date(o.start.getTime() + (o.minutes || 6) * 60000))]),
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

    const only = !!settings.ics_shifts_only; // v0.8.52: режим «только смены»
    const events = only ? [] : [
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

    // v0.8.1: смены, события кругов, отпуска и ДР — из модуля смен
    const xd = (window.SixMinShifts && window.SixMinShifts.icsData) ? window.SixMinShifts.icsData({ days: parseInt(settings.ics_days, 10) || 90, shiftsOnly: only }) : null;
    if (xd) {
      const mk = (ymd, hhmm) => {
        const y = +ymd.slice(0, 4), m = +ymd.slice(5, 7), d = +ymd.slice(8, 10);
        const p2 = String(hhmm || "09:00").split(":");
        return new Date(y, m - 1, d, +p2[0], +p2[1]);
      };
      const dur = (date, from, to) => {
        let mins = Math.round((mk(date, to) - mk(date, from)) / 60000);
        if (mins <= 0) mins += 1440;
        return mins;
      };
      xd.shifts.forEach((s, n) => {
        events.push(s.from && s.to
          ? vevent({ uid: "sixmin-shift-" + s.date + "-" + n + "@local", start: mk(s.date, s.from), minutes: dur(s.date, s.from, s.to), title: "🏭 " + s.title, description: desc })
          : vevent({ uid: "sixmin-shift-" + s.date + "-" + n + "@local", allday: true, dateYMD: s.date.replace(/-/g, ""), endDateYMD: ymdPlus(s.date.replace(/-/g, ""), 1), title: "🏭 " + s.title, description: desc }));
      });
      if (!only) xd.events.forEach((ev, n) => {
        events.push(ev.from
          ? vevent({ uid: "sixmin-ev-" + ev.date + "-" + n + "@local", start: mk(ev.date, ev.from), minutes: ev.to ? dur(ev.date, ev.from, ev.to) : 60, title: "📅 " + ev.title, description: desc })
          : vevent({ uid: "sixmin-ev-" + ev.date + "-" + n + "@local", allday: true, dateYMD: ev.date.replace(/-/g, ""), endDateYMD: ymdPlus(ev.date.replace(/-/g, ""), 1), title: "📅 " + ev.title, description: desc }));
      });
      if (!only) (xd.vacations || []).forEach((v) => {
        events.push(vevent({ uid: "sixmin-vac-" + v.id + "@local", allday: true, dateYMD: String(v.start_date).replace(/-/g, ""), endDateYMD: ymdPlus(String(v.start_date).replace(/-/g, ""), v.days || 1), title: "🏖 Отпуск", description: desc }));
      });
      if (!only && xd.birthday) {
        const b = String(xd.birthday).slice(0, 10);
        const yy = new Date().getFullYear();
        const md = b.slice(5);
        const start = (yy + "-" + md >= b.slice(0, 4) && yy + "-" + md >= new Date().toISOString().slice(0, 10)) ? yy + "-" + md : (yy + 1) + "-" + md;
        events.push(vevent({ uid: "sixmin-bday@local", allday: true, dateYMD: start.replace(/-/g, ""), endDateYMD: ymdPlus(start.replace(/-/g, ""), 1), rrule: "FREQ=YEARLY", title: "🎂 День рождения", description: desc }));
      }
    }

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
  function lastMainTab() {
    try {
      const t = localStorage.getItem("sixmin-tab");
      if (t && t !== "wisdom" && document.getElementById("screen-" + t)) return t;
    } catch (e) {}
    return "today";
  }
  function show(name) {
    state.screen = name;
    // v0.6.13: запоминаем активную вкладку между перезагрузками страницы
    if (name !== "form" && name !== "quick" && name !== "done" && name !== "wisdom") {
      try { localStorage.setItem("sixmin-tab", name); } catch (e) {}
    }
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const target = $("screen-" + name);
    if (target) target.classList.add("active");
    const tabbar = $("tabbar");
    tabbar.style.display = (name === "form" || name === "quick" || name === "done" || name === "wisdom") ? "none" : "flex";
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
    // v0.8.5: баннер живёт только на «Сегодня»; если пользователь в другом месте —
    // дублируем глобальным тостом, иначе реакция кнопки выглядит как «не работает»
    try {
      const todayActive = document.getElementById("screen-today") && document.getElementById("screen-today").classList.contains("active");
      if (!todayActive && window.SixMin && SixMin.toast) SixMin.toast(msg);
    } catch (e) {}
  }

  // v0.8.7: inline-примечание прямо в карточке «Облако» — обратная связь,
  // которую невозможно не увидеть (ни баннер на другой вкладке, ни тост вне экрана)
  function authNote(msg) {
    const n = $("auth-note");
    if (!n) return;
    n.textContent = msg || "";
    n.hidden = !msg;
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
    const fz = $("btn-freeze"); // v0.8.45: заморозка в шапке, видно состояние
    if (fz) {
      const frozen = entries.some(x => x.date === today && x.frozen);
      fz.textContent = frozen ? "❄️ Заморожено" : "🧊 Заморозить";
      fz.disabled = frozen;
      fz.title = frozen ? "Сегодня заморожено: день отдыха, серия не прервётся"
        : "Заморозить сегодня: день отдыха без вины";
    }

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
    const ax = $("am-extra"); // v0.8.43: подсказка о ДР круга под утренними вопросами
    if (ax && window.SixMinAmExtraHTML) ax.innerHTML = window.SixMinAmExtraHTML(today) || "";
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
    updateDirtyCount(); // v9.0.2: видно без нажатий, сколько записей ещё не ушли в облако
  }

  // v9.0.2: счётчик «ждут отправки» — ответ на кейс 23.10: владелец не видел, что синхронизация
  // молча прошла (плашка была вне viewport), и не знал, какое устройство держит долг.
  async function updateDirtyCount() {
    const el = $("sync-dirty");
    if (!el) return;
    try {
      const all = await Store.allEntries();
      const n = all.filter(e => e.dirty).length;
      el.textContent = n ? "в очереди: " + n : "всё отправлено";
      el.style.color = n ? "var(--danger)" : "var(--ok)";
    } catch (e) { el.textContent = ""; }
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

  /* ═══════════ v0.8.58: микро-подсказка вечернего вопроса №3 (e3) ═══════════
     Тупиковый момент: ответ пустой или односложный — под полем появляется мягкая
     подсказка, сдвигающая угол зрения. Без терминологии, без блокировки сохранения.
     - не чаще 1 раза в день: флаг triz_pm3_seen_<дата> в localStorage;
     - кнопка «✕» закрывает; повторный показ в этот день — только на следующий;
     - проверка отложенная (220 мс): blur из-за нажатия «Дальше»/«Отмена» отменяется
       в renderStep/closeForm — подсказка не вспыхивает на переходе и флаг не тратится. */
  const TRIZ_PM3_STOP = ["ничего", "нормально", "ок", "—"];
  let trizPm3Timer = null;
  function trizPm3Remove() {
    if (trizPm3Timer) { clearTimeout(trizPm3Timer); trizPm3Timer = null; }
    const old = $("q-triz");
    if (old && old.remove) old.remove();
  }
  function trizPm3Show() {
    const f = state.form;
    if (!f || f.slot !== "pm") return;
    const q = f.bank[f.step];
    if (!q || q.id !== "e3") return;
    const step = $("q-step");
    const input = $("q-input");
    if (!step || !input || step.hidden) return;
    const v = String(input.value || "").trim();
    const stuck = !v || v.length <= 5 || TRIZ_PM3_STOP.indexOf(v.toLowerCase()) > -1;
    if (!stuck) { trizPm3Remove(); return; }
    const day = Store.localDate();
    try { if (localStorage.getItem("triz_pm3_seen_" + day)) return; } catch (e) {}
    if ($("q-triz")) return;
    try {
      localStorage.setItem("triz_pm3_seen_" + day, String(Date.now()));
      Object.keys(localStorage).forEach((k) => {
        if (k.indexOf("triz_pm3_seen_") === 0 && k !== "triz_pm3_seen_" + day) localStorage.removeItem(k);
      });
    } catch (e) {}
    const box = document.createElement("div");
    box.className = "q-triz";
    box.id = "q-triz";
    const txt = document.createElement("span");
    txt.textContent = "Попробуй посмотреть с другой стороны: если бы завтра всё получилось само — что бы ты поменял(а) в плане?";
    const x = document.createElement("button");
    x.type = "button";
    x.className = "q-triz-x";
    x.textContent = "✕";
    x.title = "Скрыть подсказку";
    x.onclick = () => { box.remove(); };
    box.appendChild(txt);
    box.appendChild(x);
    step.appendChild(box);
  }
  function trizPm3Schedule() {
    if (trizPm3Timer) clearTimeout(trizPm3Timer);
    trizPm3Timer = setTimeout(() => { trizPm3Timer = null; trizPm3Show(); }, 220);
  }

  function renderStep() {
    const f = state.form;
    trizPm3Remove(); // v0.8.58: подсказка e3 не переживает смену шага
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
    trizPm3Remove(); // v0.8.58
    state.form = null;
    show(lastMainTab());
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
  // v0.8.45: строки зависят от слота и совпадают по смыслу с вопросами v0.8.42
  // (план утром / итоги вечером). Кейс v0.8.42: плейсхолдеры жили в index.html
  // отдельно от QUESTIONS и не поменялись вместе с вопросами.
  const QUICK_PH = {
    am: ["Какие планы на сегодня? 1–3 пункта.", "С чего начнёте — и во сколько?", "Что может помешать — и каков обход?"],
    pm: ["Что успели сегодня? Запишите фактами.", "Что не успели — и какое решение?", "Что поменять в плане на завтра?"]
  };
  function setQuickPh() {
    const ph = QUICK_PH[state.quick.slot] || QUICK_PH.am;
    ["quick-1", "quick-2", "quick-3"].forEach((id, i) => { const el = $(id); if (el) el.placeholder = ph[i]; });
  }
  function openQuick() {
    const hour = new Date().getHours();
    state.quick.slot = hour < 15 ? "am" : "pm";
    document.querySelectorAll("#quick-slot button").forEach(b =>
      b.classList.toggle("on", b.dataset.slot === state.quick.slot));
    ["quick-1", "quick-2", "quick-3"].forEach(id => $(id).value = "");
    setQuickPh();
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
    show(lastMainTab());
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
    const icsDaysEl = $("set-ics-days"); if (icsDaysEl) icsDaysEl.value = String(s.ics_days || 90);
    const icsOnlyEl = $("set-ics-only"); if (icsOnlyEl) icsOnlyEl.checked = !!s.ics_shifts_only;
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
    const cp = $("auth-chpass"); if (cp) cp.hidden = !st.user;
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

  // v0.7.2: переводим типовые ошибки auth на человеческий русский
  function authRu(e) {
    const m = String((e && e.message) || e);
    if (/Invalid login credentials/i.test(m))
      return "неверная пара почта+пароль, либо аккаунт ещё не создан. " +
        "Если не регистрировались в дневнике — нажмите «Создать аккаунт» ниже. " +
        "Если пароль забыт — «забыли пароль?». Пароль здесь — от дневника, а не от почты.";
    if (/Email not confirmed/i.test(m))
      return "почта аккаунта не подтверждена: найдите письмо «Confirm your email» (возможно, в «Спам») или попросите владельца подтвердить вход в Supabase → Authentication → Users.";
    if (/already registered/i.test(m))
      return "эта почта уже зарегистрирована: войдите с паролем или сбросьте пароль.";
    if (/email rate limit/i.test(m))
      return "письма со ссылками временно заблокированы лимитом бесплатного тарифа (обычно до часа). " +
        "Войдите с паролем, а если пароль забыт — попробуйте сброс позже или попросите владельца сбросить пароль из Supabase.";
    if (/rate limit/i.test(m)) return "слишком много попыток подряд: подождите минуту и повторите.";
    if (/Password should be/i.test(m)) return "пароль должен быть не короче 6 символов.";
    if (/Unable to validate email/i.test(m)) return "похоже, в почте опечатка: проверьте адрес.";
    if (/Token has expired|invalid token|Token is invalid/i.test(m))
      return "ссылка из письма уже использована или истекла (они одноразовые, ~1 час). " +
        "Запросите новую и откройте сразу, либо попросите владельца задать временный пароль из Supabase.";
    return m;
  }

  async function login() {
    const email = $("auth-email").value;
    if (!email || email.indexOf("@") < 0) { $("auth-email").focus(); flash("Введите корректную почту", "err"); return; }
    try {
      await Cloud.signIn(email);
      flash("Письмо со ссылкой отправлено на " + email + ". Откройте его на этом же устройстве.", "ok");
    } catch (e) {
      flash("Ошибка входа: " + authRu(e), "err");
    }
  }

  async function loginPass() {
    const email = $("auth-email").value;
    const pass = $("auth-pass").value;
    if (!email || email.indexOf("@") < 0) { $("auth-email").focus(); flash("Введите корректную почту", "err"); return; }
    if (!pass) { $("auth-pass").focus(); flash("Введите пароль", "err"); return; }
    try {
      await Cloud.signInPassword(email, pass);
      authNote("");
      flash("Вход выполнен ✓", "ok");
      renderAuth(); renderSyncState();
    } catch (e) {
      flash("Ошибка входа: " + authRu(e), "err");
    }
  }

  async function forgotPass() {
    const email = $("auth-email").value.trim();
    if (!email || email.indexOf("@") < 0) { $("auth-email").focus(); authNote("Введите почту в поле выше — для неё и придёт ссылка сброса."); flash("Введите почту в поле выше — для неё и придёт ссылка сброса", "err"); return; }
    try {
      await Cloud.resetPassword(email);
      authNote("Письмо со ссылкой сброса отправлено (если аккаунт существует). Ссылка одноразовая и живёт около часа — откройте сразу, в этом же браузере. Повторные клики сжигают почтовый лимит!");
      flash("Если аккаунт на " + email + " существует, письмо со ссылкой сброса уже отправлено (загляните в «Спам»). " +
        "Ссылка ОДНОРАЗОВАЯ и живёт около часа: открывайте её сразу и в том браузере, где будете работать.", "ok");
    } catch (e) {
      authNote("Не удалось отправить сброс: " + authRu(e));
      flash("Не удалось отправить сброс: " + authRu(e), "err");
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
        "<p>Цель блока — план дня в три строки: что делаю, с чего и во сколько начинаю, чему помешаю помешать.</p>" +
        "<ul><li>1–3 главных пункта, а не весь список хотелок.</li>" +
        "<li>Время старта превращает намерение в решение.</li>" +
        "<li>Нет времени печатать — кнопка «🎙 Диктовка» или «⚡ Быстро» на главном экране.</li>" +
        "<li>Черновик сохраняется сам: можно свернуться и дописать позже.</li></ul>" +
        "<p class='muted'>Таймер 3:00 — ориентир, а не ограничение: он просто подскажет, если вы углубились.</p>",
    pm: "<h3>🌙 Вечер · 3 вопроса + оценки · ~3 минуты</h3>" +
        "<ul><li>Сначала факты сделанного, потом решение по хвостам: завтра / отказаться / делегировать.</li>" +
        "<li>Третий вопрос — про стратегию: одна правка завтрашнего плана по итогам дня.</li>" +
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
    $("btn-quick-close").onclick = () => show(lastMainTab());
    $("btn-quick-save").onclick = saveQuick;
    document.querySelectorAll("#quick-slot button").forEach(b =>
      b.onclick = () => {
        state.quick.slot = b.dataset.slot;
        document.querySelectorAll("#quick-slot button").forEach(x => x.classList.toggle("on", x === b));
        setQuickPh();
      });

    $("btn-form-close").onclick = closeForm;
    $("btn-next").onclick = nextStep;
    $("btn-prev").onclick = prevStep;
    $("btn-mic").onclick = toggleMic;
    // v0.8.58: микро-подсказка e3 — проверка по blur и Enter; ввод длинного ответа убирает её
    $("q-input").addEventListener("blur", trizPm3Schedule);
    $("q-input").addEventListener("input", trizPm3Schedule);
    $("q-input").addEventListener("keydown", (ev) => { if (ev.key === "Enter") trizPm3Schedule(); });
    $("btn-done-close").onclick = () => show("today");
    document.querySelectorAll("[data-info]").forEach(b =>
      b.onclick = (ev) => { ev.stopPropagation(); openInfo(b.dataset.info); });
    $("info-close").onclick = closeInfo;
    $("info-back").onclick = closeInfo;
    $("btn-sync").onclick = async () => {
      const b = $("btn-sync");
      b.disabled = true; b.textContent = "Синхронизирую…";   // v9.0.2: кнопка показывает, что нажата
      const r = await Cloud.sync();
      b.disabled = false; b.textContent = "Синхронизировать";
      if (r.ok) {
        await renderToday();
        const tail = r.failed ? ", НЕ отправлено: " + r.failed + " (" + (r.lastErr || "ошибка сервера") + ")" : "";
        flash("Синхронизация: отправлено " + (r.pushed || 0) + ", получено " + (r.pulled || 0) + tail, r.failed ? "err" : "ok");
      } else {
        flash("Синхронизация не удалась: " + (r.reason || "нет входа"), "err");
      }
      updateDirtyCount();
    };

    $("m-prev").onclick = () => { state.month.setMonth(state.month.getMonth() - 1); renderMonth(); };
    $("m-next").onclick = () => { state.month.setMonth(state.month.getMonth() + 1); renderMonth(); };
    let st;
    $("search").oninput = e => { clearTimeout(st); st = setTimeout(() => doSearch(e.target.value), 250); };

    $("btn-save-settings").onclick = saveSettings;
    $("btn-login").onclick = login;
    $("btn-login-pass").onclick = loginPass;
    const bf = $("btn-forgot"); if (bf) bf.onclick = forgotPass;
    const bcp = $("btn-chpass");
    if (bcp) bcp.onclick = async () => {
      const p = $("auth-newpass").value;
      if (!p || p.length < 6) { flash("Пароль — минимум 6 символов", "err"); return; }
      try {
        await Cloud.changePassword(p);
        $("auth-newpass").value = "";
        authNote("Пароль изменён ✓ Теперь входите с ним.");
        flash("Пароль изменён ✓ Теперь входите с ним.", "ok");
      } catch (e) { authNote("Не удалось изменить пароль: " + authRu(e)); flash("Не удалось изменить пароль: " + authRu(e), "err"); }
    };
    const bw = $("btn-wisdom"); if (bw) bw.onclick = () => show("wisdom");
    const bwc = $("btn-wisdom-close"); if (bwc) bwc.onclick = () => show(lastMainTab());
    // v0.8.55: явная кнопка обновления страницы (iOS PWA/standalone: pull-to-refresh ненадёжен).
    // Одна делегированная точка на все шапки: тост-отдача и перезагрузка.
    document.addEventListener("click", (e) => {
      const rl = e.target && e.target.closest ? e.target.closest("[data-reload]") : null;
      if (!rl) return;
      e.preventDefault();
      SixMin.toast("Обновляю страницу…");
      setTimeout(() => location.reload(), 400);
    });
    $("btn-logout").onclick = async () => { await Cloud.signOut(); renderAuth(); flash("Вы вышли из облака"); };
    $("btn-gen-code").onclick = genLinkCode;
    $("btn-ics").onclick = async () => {
      const s = await Store.getSettings();
      ICS.download(s, CFG.appUrl);
      flash("Файл six-minutes.ics сохранён. iPhone: открыть файл → «Добавить всё».", "ok");
    };
    // v0.8.52: горизонт и состав .ics — настройки устройства (боту не нужны, в облако не шлём)
    const icsDaysSel = $("set-ics-days");
    if (icsDaysSel) icsDaysSel.onchange = async () => {
      await Store.saveSettings({ ics_days: parseInt(icsDaysSel.value, 10) || 90 });
      flash("Календарь: смены за " + (parseInt(icsDaysSel.value, 10) || 90) + " дн.");
    };
    const icsOnlyChk = $("set-ics-only");
    if (icsOnlyChk) icsOnlyChk.onchange = async () => {
      await Store.saveSettings({ ics_shifts_only: icsOnlyChk.checked });
      flash(icsOnlyChk.checked ? "Календарь: только смены." : "Календарь: полный состав.");
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
      const today = Store.localDate();
      const frozen = (await Store.allEntries()).some(x => x.date === today && x.frozen);
      if (frozen) { flash("❄️ Сегодня уже заморожено — серия не прервётся", "ok"); return; }
      if (!confirm("Заморозить сегодня? День станет днём отдыха: запись не нужна, серия не прервётся.")) return;
      await Store.freezeDay(today);
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
  // v0.8.63: сетевые ожидания запуска не имеют права блокировать экран (кейс 22.10.2026 —
  // iPhone без сети: оболочка нарисована, кнопки не привязаны, само не отходило).
  const BOOT_NET_TIMEOUT = 4000; // мс — сколько ждём облако при запуске
  function withTimeout(promise, ms, what) {
    let timer = null;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => {
        console.warn("[boot] " + what + ": сеть не ответила за " + ms + " мс — продолжаем без облака");
        resolve(null);
      }, ms);
    });
    return Promise.race([
      Promise.resolve().then(() => promise).catch((e) => {
        console.warn("[boot] " + what + ":", (e && e.message) || e);
        return null;
      }),
      timeout,
    ]).then((v) => { if (timer) clearTimeout(timer); return v; });
  }

  async function init() {
    await Store.open();
    // часовой пояс устройства — по умолчанию
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || CFG.defaultTimezone;
    const s0 = await Store.getSettings();
    if (!s0.tz || s0.tz === window.DEFAULT_SETTINGS.tz) await Store.saveSettings({ tz });
    state.settings = await Store.getSettings();

    // v0.8.63: СНАЧАЛА экран и привязка кнопок, потом облако. Раньше bind()/show() стояли
    // после await Cloud.init() и await Cloud.pullSettings(): висящий сетевой запрос оставлял
    // приложение «мёртвым» (оболочка есть, кнопки не привязаны) — кейс владельца 22.10.2026.
    // Локальные данные (IndexedDB) к этому моменту уже открыты, так что экран рисуется настоящий.
    bind();
    show(lastMainTab());

    // Подписку ставим ДО init(), чтобы не пропустить первое событие облака.
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
    // Облако — с таймаутом: если сеть не отвечает, приложение работает офлайн на локальных данных,
    // а когда запрос всё-таки завершится, Cloud.onChange дорисует статус и подтянет настройки.
    await withTimeout(Cloud.init(), BOOT_NET_TIMEOUT, "Cloud.init");
    if (Cloud.user) {
      state.settingsPulled = true;
      const remote = await withTimeout(Cloud.pullSettings(), BOOT_NET_TIMEOUT, "pullSettings");
      if (remote) { state.settings = await Store.saveSettings(remote); }
      Cloud.sync().catch(() => {});
    }

    // v0.8.8: самолечение устаревшего кэша: version.json ходит только по сети (sw пропускает
    // его мимо кэша). Если сервер новее этого бандла — один раз перезагружаем страницу.
    try {
      fetch("version.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => {
        const sv = String((j && j.version) || "");
        if (!sv) return;
        if (sv !== CFG.version && !sessionStorage.getItem("sm-updating")) {
          sessionStorage.setItem("sm-updating", "1");
          sessionStorage.setItem("sm-just-updated", sv);
          const msg = "Приложение обновилось до v" + sv + " — перезагружу страницу через пару секунд…";
          flash(msg, "ok");
          if (window.SixMin && SixMin.toast) SixMin.toast(msg); // v0.8.12: тост живёт по длине текста
          setTimeout(() => location.reload(), 5200);            // и успеваем дочитать до перезагрузки
        } else if (sv === CFG.version) {
          sessionStorage.removeItem("sm-updating");
          const ju = sessionStorage.getItem("sm-just-updated");
          if (ju) {
            sessionStorage.removeItem("sm-just-updated");
            setTimeout(() => { if (window.SixMin && SixMin.toast) SixMin.toast("Обновление завершено: вы на v" + ju + " ✓"); }, 700);
          }
        }
      }).catch(() => {});
    } catch (e) {}

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

