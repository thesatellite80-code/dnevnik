/* ===== v0.2 modules (separate script) ===== */
(function () {
  var d = document.createElement("div");
  d.id = "v02-banner";
  d.style.cssText = "position:fixed;left:8px;bottom:84px;z-index:99999;background:#111;color:#7CFC00;" +
    "font:11px/1.45 ui-monospace,monospace;padding:6px 9px;border-radius:8px;opacity:.95;max-width:94vw;white-space:pre-wrap";
  d.textContent = "v02: start";
  d.style.display = "none";
  (document.body || document.documentElement).appendChild(d);
  window.__v02banner = d;
  window.__v02say = function (t) { if (window.__v02banner) { window.__v02banner.textContent = t; window.__v02banner.style.display = String(t).indexOf("v02 ERR") === 0 ? "block" : "none"; } };
  window.addEventListener("error", function (e) {
    window.__v02say("v02 ERR: " + (e.message || "?") + " @line " + (e.lineno || "?"));
  });
})();

window.__v02stage = "v02-start";


// app/js/sixmin-common.js — общие утилиты для модулей v0.2
// Подключается ПЕРЕД остальными модулями v0.2.

window.SixMin = window.SixMin || {};

(function () {
  const S = window.SixMin;

  // --- Supabase client: используем глобальный из приложения, иначе создаём ---
  S.sb = () => {
    if (window.supabase && typeof window.supabase.from === "function") return window.supabase;
    if (window.__sbClient) return window.__sbClient;
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;
    if (!url || !key || !window.supabaseLib) {
      throw new Error("SixMin: supabase client не найден. Подключите supabase-js и задайте window.supabase.");
    }
    window.__sbClient = window.supabaseLib.createClient(url, key);
    return window.__sbClient;
  };

  S.uid = () =>
    new Promise((res, rej) =>
      S.sb().auth.getUser().then(({ data, error }) => (error ? rej(error) : res(data.user.id)))
    );

  // --- Таймзона пользователя (настройка хранится в reminder_settings.timezone) ---
  let _tzCache = null;
  S.getTimezone = async () => {
    if (_tzCache) return _tzCache;
    try {
      const uid = await S.uid();
      const { data } = await S.sb()
        .from("reminder_settings")
        .select("timezone")
        .eq("user_id", uid)
        .maybeSingle();
      _tzCache = data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      _tzCache = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return _tzCache;
  };
  S.setTimezoneCache = (tz) => { _tzCache = tz; };

  // --- Даты ---
  // "локальный день" пользователя как YYYY-MM-DD в его таймзоне
  S.todayKey = async (date = new Date()) => {
    const tz = await S.getTimezone();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(date);
    const g = (t) => parts.find((p) => p.type === t).value;
    return `${g("year")}-${g("month")}-${g("day")}`;
  };

  S.parseKey = (key) => { // 'YYYY-MM-DD' -> Date (полдень, чтобы не было сдвигов)
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  };

  S.fmtKey = (date) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  };

  // понедельник текущей недели, сдвинутой на offset недель
  S.weekStart = (offsetWeeks = 0, from = new Date()) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);
    const dow = (d.getDay() + 6) % 7; // 0=Пн
    d.setDate(d.getDate() - dow + offsetWeeks * 7);
    return d;
  };

  S.weekKeys = (offsetWeeks = 0, from = new Date()) => {
    const start = S.weekStart(offsetWeeks, from);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return S.fmtKey(d);
    });
  };

  // ISO-ключ недели: '2026-W41'
  S.weekKeyISO = (date = new Date()) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  };

  S.monthKey = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  S.DAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  S.fmtRange = (keys) => {
    const a = S.parseKey(keys[0]), b = S.parseKey(keys[6]);
    const opt = { day: "numeric", month: "short" };
    return `${a.toLocaleDateString("ru-RU", opt)} — ${b.toLocaleDateString("ru-RU", opt)}`;
  };

  S.esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- инфо-шторка «как это работает» для блоков v0.2 ----------
  S.info = (title, html) => {
    let ov = document.getElementById("sixmin-info-ov");
    if (!ov) {
      const st = document.createElement("style");
      st.textContent = ".sm-ib{width:26px;height:26px;border-radius:50%;border:1px solid rgba(128,128,128,.35);" +
        "background:transparent;color:inherit;opacity:.65;cursor:pointer;font:12px system-ui,sans-serif;" +
        "display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}";
      document.head.appendChild(st);
      ov = document.createElement("div");
      ov.id = "sixmin-info-ov";
      ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9998;display:flex;align-items:flex-end;justify-content:center";
      const sheet = document.createElement("div");
      sheet.id = "sixmin-info-sheet";
      sheet.style.cssText = "background:#2a2520;color:#f5f5f5;border-radius:16px 16px 0 0;padding:20px 20px 30px;" +
        "max-height:70vh;overflow-y:auto;width:100%;max-width:600px;font:14px/1.6 system-ui,sans-serif";
      ov.appendChild(sheet);
      ov.addEventListener("click", (e) => { if (e.target === ov) ov.style.display = "none"; });
      document.body.appendChild(ov);
    }
    const sheet = document.getElementById("sixmin-info-sheet");
    sheet.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
      '<b style="font-size:16px">' + title + '</b>' +
      '<button id="sixmin-info-close" style="border:0;background:transparent;color:inherit;font-size:15px;cursor:pointer;opacity:.7">✕ закрыть</button></div>' + html;
    ov.style.display = "flex";
    document.getElementById("sixmin-info-close").onclick = () => { ov.style.display = "none"; };
  };

  // debounce
  S.debounce = (fn, ms = 600) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  // маленький тост (если в приложении есть свой — замените тело)
  S.toast = (msg) => {
    let el = document.getElementById("sixmin-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "sixmin-toast";
      el.style.cssText =
        "position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);" +
        "background:#222;color:#fff;padding:10px 18px;border-radius:12px;font:14px system-ui;" +
        "opacity:0;transition:.25s;z-index:9999;max-width:90vw;text-align:center";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateX(-50%) translateY(0)";
    });
    clearTimeout(el._t);
    // v0.8.10: время показа по длине текста (≈70 мс/символ, 3.2–12 с), тап — закрыть сразу
    const ms = Math.min(12000, Math.max(3200, 500 + String(msg).length * 70));
    el._t = setTimeout(() => { el.style.opacity = "0"; }, ms);
    el.onclick = () => { clearTimeout(el._t); el.style.opacity = "0"; el.onclick = null; };
  };
})();
window.__v02stage = "after-sixmin-common"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-common");

// app/js/sixmin-comments.js — v0.6: ОБЩИЕ комментарии и вложения к задачам
// Один компонент на два места: личные/рабочие задачи (sixmin-tasks.js)
// и общие задачи кругов + баунти (sixmin-circles.js).
//
// Вложения: 🖼 фото (просмотр + скачать), 📄 документы (pdf — просмотр,
// остальные — скачать), 🎙 голосовые (прослушать + скачать).
// Личная задача  → файл в приватной папке  <uid>/t/...
// Задача круга   → файл в общей папке      circles/<circle_id>/<uid>/...
//                  (поэтому его видят и могут скачать все участники круга)
//
// API:
//   const cm = SixMinComments.create({
//     render: () => render(),                  // перерисовать экран
//     scope: (task) => ({ circle_id }) | null, // null = личная задача
//     authorName: (uid) => "Мама",             // имя автора (для кругов)
//     findTask: (id) => task,                  // задача по id
//     canDelete: (comment) => true|false       // модерация (владелец круга)
//   });
//   cm.loadCounts(ids); cm.count(id); cm.buttonHTML(task); cm.panelHTML(task);
//   cm.toggle(task); cm.close(); cm.wire(root); cm.reset();
//
// Важно: текст черновика и прикреплённые файлы хранятся в состоянии компонента,
// поэтому они НЕ теряются при любой перерисовке экрана.

window.SixMinComments = (function () {
  const MAX_MB = 25;                 // предел одного файла
  const POLL_MS = 20000;             // автообновление открытой переписки
  const ACCEPT = "image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.zip";

  const kindEmoji = (k) => (k === "image" ? "🖼" : k === "voice" ? "🎙" : "📄");
  const safeName = (n) =>
    (String(n || "").replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(-40)) || "file";
  const extOf = (n) => (String(n || "").split(".").pop() || "").toLowerCase();
  const stamp = () => {
    const d = new Date();
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + ", " +
      d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  // ---------- стили (свои, чтобы компонент работал и без модуля задач) ----------
  function injectStyles() {
    if (typeof document === "undefined" || document.getElementById("sixmin-comments-css")) return;
    const css = document.createElement("style");
    css.id = "sixmin-comments-css";
    css.textContent = `
      .sm-task-cm b{font-size:10px;background:var(--accent,#E30613);color:#fff;border-radius:8px;padding:1px 5px;margin-left:2px;vertical-align:middle}
      .sm-cm-panel{border:1px solid rgba(128,128,128,.2);border-top:0;border-radius:0 0 12px 12px;
                   padding:10px;background:rgba(128,128,128,.06);font-family:system-ui,sans-serif}
      .sm-cm-bar{display:flex;align-items:center;gap:6px;margin:-2px 0 6px}
      .sm-cm-cap{font-size:11px;font-weight:800;letter-spacing:.3px;text-transform:uppercase;opacity:.55;flex:1}
      .sm-cm{padding:7px 2px;border-bottom:1px dashed rgba(128,128,128,.18)}
      .sm-cm:last-of-type{border-bottom:0}
      .sm-cm-head{font-size:11px;opacity:.6;margin-bottom:2px;display:flex;gap:6px;align-items:center}
      .sm-cm-head b{opacity:.95;font-weight:700}
      .sm-cm-del{border:0;background:transparent;color:inherit;opacity:.35;cursor:pointer;font-size:13px;
                 padding:0 2px;margin-left:auto}
      .sm-cm-del:hover{opacity:1;color:#E30613}
      .sm-cm-body{font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
      .sm-cm-chip{border:1px solid rgba(127,111,240,.4);color:inherit;background:var(--accent-soft,#FDE9E9);
                  border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer;margin:4px 4px 0 0;
                  max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .sm-cm-pend{margin-top:6px}
      .sm-cm-pending b{color:#E30613;margin-left:6px;cursor:pointer}
      .sm-cm-empty{font-size:12.5px;opacity:.6;padding:4px 2px}
      .sm-cm-add{display:flex;gap:6px;align-items:center;margin-top:8px}
      .sm-cm-input{flex:1;padding:9px 12px;border-radius:10px;border:1px solid rgba(128,128,128,.25);
                   background:transparent;color:inherit;font-size:13.5px;outline:none;min-width:0}
      .sm-cm-input:focus{border-color:var(--accent,#E30613)}
      .sm-cm-btn{border:0;background:transparent;font-size:15px;cursor:pointer;padding:4px;border-radius:8px;
                 color:inherit;line-height:1}
      .sm-cm-send{color:var(--accent,#E30613);font-weight:700}
      .sm-cm-hint{font-size:11px;opacity:.5;margin-top:6px;line-height:1.4}
      .sm-cm-ov{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:10002;display:flex;
                flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:14px}
      .sm-cm-ov-name{color:#fff;font:600 13px/1.4 system-ui,sans-serif;opacity:.85;max-width:92vw;
                     text-align:center;word-break:break-all}
      .sm-cm-ov-acts{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center}
      .sm-cm-ov-dl{padding:10px 18px;border-radius:12px;background:var(--accent,#E30613);color:#fff;
                   font:700 14px system-ui,sans-serif;text-decoration:none}
      .sm-cm-ov-cl{padding:10px 18px;border-radius:12px;border:1px solid #777;background:transparent;
                   color:#fff;font:14px system-ui,sans-serif;cursor:pointer}`;
    document.head.appendChild(css);
  }

  // ---------- общий оверлей просмотра (фото / аудио / pdf) ----------
  function viewer(innerHTML, name, url) {
    if (typeof document === "undefined") return;
    const ov = document.createElement("div");
    ov.className = "sm-cm-ov";
    ov.innerHTML = innerHTML +
      '<div class="sm-cm-ov-name">' + SixMin.esc(name) + "</div>" +
      '<div class="sm-cm-ov-acts">' +
      '<a class="sm-cm-ov-dl" href="' + url + '" download="' + SixMin.esc(name) + '">Скачать</a>' +
      '<button class="sm-cm-ov-cl" type="button">Закрыть</button></div>';
    document.body.appendChild(ov);
    const kill = () => { try { URL.revokeObjectURL(url); } catch (e) {} ov.remove(); };
    ov.querySelector(".sm-cm-ov-cl").onclick = kill;
    ov.addEventListener("click", (e) => { if (e.target === ov) kill(); });
    const a = ov.querySelector("audio");
    if (a) a.play().catch(() => {});
    return ov;
  }

  async function openAtt(btn) {
    const kind = btn.dataset.kind;
    const path = btn.dataset.path;
    const name = btn.dataset.name || "file";
    SixMin.toast("Открываю…");
    try {
      const { data, error } = await SixMin.sb().storage.from("attachments").download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      if (kind === "image") {
        viewer('<img src="' + url + '" alt="" style="max-width:94vw;max-height:68vh;border-radius:12px;background:#000">', name, url);
      } else if (kind === "voice") {
        viewer('<audio controls src="' + url + '" style="width:min(92vw,420px)"></audio>', name, url);
      } else if (extOf(name) === "pdf") {
        viewer('<iframe src="' + url + '" title="" style="width:min(94vw,760px);height:66vh;border:0;border-radius:12px;background:#fff"></iframe>', name, url);
      } else {
        // документы: сразу предлагаем скачать (плюс ссылка в оверлее)
        viewer('<div style="font-size:52px;line-height:1">📄</div>' +
          '<div style="color:#fff;font:13px/1.5 system-ui,sans-serif;opacity:.75;max-width:80vw;text-align:center">' +
          "Документ нельзя показать внутри приложения — нажмите «Скачать», он откроется на устройстве.</div>", name, url);
      }
    } catch (e) {
      SixMin.toast("Не удалось открыть: " + (e.message || e));
    }
  }

  // ---------- экземпляр компонента для одного экрана ----------
  function create(host) {
    host = host || {};
    injectStyles();

    let openId = null;        // id задачи с раскрытой перепиской
    let cache = {};           // taskId -> { comments: [ {.., attachments:[]} ] }
    let counts = {};          // taskId -> число комментариев
    let pending = [];         // [{ blob, name, kind, type }]
    let draft = "";           // текст в поле ввода (не теряется при перерисовке)
    let busy = false;
    let timer = null;
    let myUid = null;

    const render = () => { if (typeof host.render === "function") host.render(); };
    const scopeOf = (t) => (typeof host.scope === "function" ? host.scope(t) : null);
    const findTask = (id) => (typeof host.findTask === "function" ? host.findTask(id) : null);
    const authorName = (uid) =>
      (typeof host.authorName === "function" ? (host.authorName(uid) || "участник") : "");
    const canDelete = (c) =>
      c.user_id === myUid || (typeof host.canDelete === "function" && !!host.canDelete(c));

    async function uid() {
      if (!myUid) myUid = await SixMin.uid();
      return myUid;
    }

    async function fetchFor(id) {
      const sb = SixMin.sb();
      const [cs, at] = await Promise.all([
        sb.from("task_comments").select("*").eq("task_id", id)
          .order("created_at", { ascending: true }).limit(300),
        sb.from("task_attachments").select("*").eq("task_id", id)
          .order("created_at", { ascending: true }).limit(500),
      ]);
      if (cs.error) throw cs.error;
      const atts = at.data || [];
      cache[id] = {
        comments: (cs.data || []).map((c) => ({ ...c, attachments: atts.filter((a) => a.comment_id === c.id) })),
      };
      counts[id] = cache[id].comments.length;
      return cache[id];
    }

    // счётчики для списка задач (один запрос на весь экран)
    async function loadCounts(ids) {
      const list = (ids || []).filter(Boolean);
      if (!list.length) { counts = {}; return; }
      try {
        const { data } = await SixMin.sb().from("task_comments")
          .select("task_id").in("task_id", list).limit(2000);
        counts = {};
        (data || []).forEach((c) => { counts[c.task_id] = (counts[c.task_id] || 0) + 1; });
      } catch (e) { /* таблица ещё не создана — не ломаем экран */ }
    }

    const count = (id) => counts[id] || 0;

    function startPolling(id) {
      stopPolling();
      if (typeof setInterval !== "function") return;
      timer = setInterval(async () => {
        if (openId !== id || busy) return;
        // не перерисовываем экран, пока человек печатает или держит прикреплённые файлы
        if (draft.trim() || pending.length) return;
        const ae = typeof document !== "undefined" ? document.activeElement : null;
        if (ae && ae.dataset && ae.dataset.cminput !== undefined) return;
        try { await fetchFor(id); if (openId === id) render(); } catch (e) {}
      }, POLL_MS);
    }
    function stopPolling() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    async function toggle(t) {
      if (!t) return;
      if (openId === t.id) { close(); return; }
      openId = t.id; pending = []; draft = "";
      render();
      try { await fetchFor(t.id); } catch (e) { cache[t.id] = { comments: [], error: e.message || String(e) }; }
      if (openId === t.id) { render(); startPolling(t.id); }
    }

    function close() {
      stopPolling();
      openId = null; pending = []; draft = "";
      render();
    }

    async function reloadOpen() {
      if (!openId) return;
      try { await fetchFor(openId); } catch (e) { SixMin.toast("Не обновилось: " + (e.message || e)); }
      render();
    }

    // ---------- разметка ----------
    function buttonHTML(t, title) {
      const n = count(t.id);
      return '<button class="sm-task-btn sm-task-cm" data-cmopen="' + t.id + '" type="button" title="' +
        SixMin.esc(title || "Комментарии и вложения") + '">💬' + (n ? "<b>" + n + "</b>" : "") + "</button>";
    }

    function attHTML(a) {
      return '<button class="sm-cm-chip" type="button" data-att="' + a.id + '" data-path="' +
        SixMin.esc(a.storage_path) + '" data-kind="' + SixMin.esc(a.kind) + '" data-name="' +
        SixMin.esc(a.file_name || a.kind) + '">' + kindEmoji(a.kind) + " " +
        SixMin.esc(a.file_name || a.kind) + "</button>";
    }

    function cmHTML(c) {
      const who = authorName(c.user_id);
      const mine = c.user_id === myUid;
      return '<div class="sm-cm">' +
        '<div class="sm-cm-head">' +
        (who ? "<b>" + SixMin.esc(who) + "</b><span>·</span>" : "") +
        "<span>" + stamp2(c.created_at) + "</span>" +
        (mine ? "<em style=\"opacity:.7;font-style:normal\">· вы</em>" : "") +
        (canDelete(c) ? '<button class="sm-cm-del" type="button" data-cmdel="' + c.id + '" title="Удалить комментарий">×</button>' : "") +
        "</div>" +
        (c.body ? '<div class="sm-cm-body">' + SixMin.esc(c.body) + "</div>" : "") +
        ((c.attachments || []).map(attHTML).join("") || "") +
        "</div>";
    }
    function stamp2(iso) {
      try { const d = new Date(iso);
        return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + ", " +
          d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }); }
      catch (e) { return stamp(); }
    }

    function panelHTML(t) {
      if (openId !== t.id) return "";
      const c = cache[t.id];
      const shared = !!(scopeOf(t) && scopeOf(t).circle_id);
      const list = !c
        ? '<div class="sm-cm-empty">Загружаю…</div>'
        : (c.error
          ? '<div class="sm-cm-empty">⚠️ ' + SixMin.esc(c.error) +
            '<br>Обновите схему БД (миграция v0.6) — кнопка ⟳ справа вверху.</div>'
          : (c.comments.length
            ? c.comments.map(cmHTML).join("")
            : '<div class="sm-cm-empty">Комментариев пока нет — напишите первый или прикрепите фото, документ либо голосовое.</div>'));
      return '<div class="sm-cm-panel" data-cmpanel="' + t.id + '">' +
        '<div class="sm-cm-bar"><span class="sm-cm-cap">' +
        (shared ? "💬 Обсуждение круга" : "💬 Обсуждение") + "</span>" +
        '<button class="sm-cm-btn" type="button" data-cmact="reload" title="Обновить">⟳</button>' +
        '<button class="sm-cm-btn" type="button" data-cmact="close" title="Свернуть">✕</button></div>' +
        list +
        (pending.length
          ? '<div class="sm-cm-pend">' + pending.map((p, i) =>
            '<span class="sm-cm-chip sm-cm-pending">' + kindEmoji(p.kind) + " " + SixMin.esc(p.name) +
            ' <b data-pendel="' + i + '" title="Убрать">×</b></span>').join("") + "</div>"
          : "") +
        '<div class="sm-cm-add">' +
        '<input class="sm-cm-input" data-cminput placeholder="' +
        (shared ? "Сообщение участникам круга…" : "Комментарий…") + '" maxlength="500" value="' +
        SixMin.esc(draft) + '" autocomplete="off">' +
        '<button class="sm-cm-btn" type="button" data-cmact="file" title="Фото или документ">📎</button>' +
        '<button class="sm-cm-btn" type="button" data-cmact="voice" title="Голосовое сообщение">🎙</button>' +
        '<button class="sm-cm-btn sm-cm-send" type="button" data-cmact="send" title="Отправить">➤</button>' +
        "</div>" +
        '<div class="sm-cm-hint">' +
        (shared
          ? "Файлы видят все участники круга: 🖼 просмотр, 🎙 прослушивание, 📄 скачивание. Обновляется само каждые 20 сек."
          : "Файлы хранятся в вашем приватном облаке: 🖼 просмотр, 🎙 прослушивание, 📄 скачивание.") +
        "</div>" +
        '<input type="file" class="sm-cm-file" hidden accept="' + ACCEPT + '">' +
        "</div>";
    }

    // ---------- действия ----------
    async function send(t) {
      if (!t || busy) return;
      const body = draft.trim();
      if (!body && !pending.length) { SixMin.toast("Напишите текст или прикрепите файл"); return; }
      busy = true;
      try {
        const me = await uid();
        const { data: cm, error } = await SixMin.sb().from("task_comments")
          .insert({ task_id: t.id, user_id: me, body }).select().maybeSingle();
        if (error) throw error;
        const sc = scopeOf(t);
        for (const p of pending) {
          try {
            const path = sc && sc.circle_id
              ? "circles/" + sc.circle_id + "/" + me + "/" + Date.now() + "-" + safeName(p.name)
              : me + "/t/" + Date.now() + "-" + safeName(p.name);
            const { error: upErr } = await SixMin.sb().storage.from("attachments")
              .upload(path, p.blob, { contentType: p.type || "application/octet-stream" });
            if (upErr) throw upErr;
            const { error: insErr } = await SixMin.sb().from("task_attachments").insert({
              comment_id: (cm && cm.id) || null, task_id: t.id, user_id: me,
              kind: p.kind, storage_path: path, file_name: p.name,
            });
            if (insErr) throw insErr;
          } catch (e) {
            SixMin.toast("Вложение не загружено: " + (e.message || e));
          }
        }
        pending = []; draft = "";
        await fetchFor(t.id);
        render();
      } catch (e) {
        const hint = (e && e.code === "42501") ? " (нет прав — примените миграцию v0.6 в SQL Editor)" : "";
        SixMin.toast("Не отправлено: " + (e.message || e) + hint);
      } finally {
        busy = false;
      }
    }

    async function delComment(id) {
      if (typeof confirm === "function" && !confirm("Удалить комментарий и его вложения?")) return;
      const { error } = await SixMin.sb().from("task_comments").delete().eq("id", id);
      if (error) { SixMin.toast("Не удалено: " + error.message); return; }
      if (openId) { await fetchFor(openId).catch(() => {}); }
      render();
    }

    function addFile(f) {
      if (!f) return;
      if (f.size && f.size > MAX_MB * 1024 * 1024) {
        SixMin.toast("Файл больше " + MAX_MB + " МБ — приложите меньший");
        return;
      }
      const type = f.type || "";
      const kind = type.startsWith("image/") ? "image"
        : type.startsWith("audio/") ? "voice"
        : (extOf(f.name) === "wav" || extOf(f.name) === "mp3" || extOf(f.name) === "m4a" || extOf(f.name) === "ogg") ? "voice"
        : "doc";
      pending.push({ blob: f, name: f.name || "file", kind, type });
      render();
    }

    async function addVoice() {
      if (!window.SixMinVoice || typeof window.SixMinVoice.capture !== "function") {
        SixMin.toast("Диктофон недоступен в этом браузере");
        return;
      }
      try {
        const res = await window.SixMinVoice.capture();
        if (!res || !res.blob) return;
        const t = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }).replace(":", "_");
        pending.push({ blob: res.blob, name: "audio-" + t + ".wav", kind: "voice", type: "audio/wav" });
        render();
      } catch (e) {
        SixMin.toast("Запись не удалась: " + (e.message || e));
      }
    }

    // ---------- навешивание событий на контейнер экрана ----------
    function wire(rootEl) {
      const rf = rootEl || (typeof document !== "undefined" ? document : null);
      if (!rf || typeof rf.querySelectorAll !== "function") return;
      const taskOf = (el) => {
        const id = el && el.dataset ? el.dataset.cmopen : null;
        return id ? findTask(id) : null;
      };

      rf.querySelectorAll("[data-cmopen]").forEach((b) => b.addEventListener("click", (e) => {
        e.stopPropagation();
        toggle(taskOf(b));
      }));

      rf.querySelectorAll("[data-cmact]").forEach((b) => b.addEventListener("click", async (e) => {
        e.stopPropagation();
        const panel = b.closest ? b.closest("[data-cmpanel]") : null;
        const t = panel ? findTask(panel.dataset.cmpanel) : (openId ? findTask(openId) : null);
        const act = b.dataset.cmact;
        if (act === "close") { close(); return; }
        if (act === "reload") { await reloadOpen(); return; }
        if (!t) return;
        if (act === "file") {
          const inp = (panel || rf).querySelector(".sm-cm-file");
          if (inp) inp.click();
        }
        if (act === "voice") await addVoice();
        if (act === "send") await send(t);
      }));

      rf.querySelectorAll(".sm-cm-file").forEach((inp) => inp.addEventListener("change", () => {
        addFile(inp.files && inp.files[0]);
        try { inp.value = ""; } catch (e) {}
      }));

      rf.querySelectorAll("[data-cminput]").forEach((inp) => {
        inp.addEventListener("input", () => { draft = inp.value; });
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            draft = inp.value;
            const panel = inp.closest ? inp.closest("[data-cmpanel]") : null;
            const t = panel ? findTask(panel.dataset.cmpanel) : null;
            if (t) send(t);
          }
        });
      });

      rf.querySelectorAll("[data-pendel]").forEach((b) => b.addEventListener("click", (e) => {
        e.stopPropagation();
        pending.splice(Number(b.dataset.pendel), 1);
        render();
      }));

      rf.querySelectorAll("[data-att]").forEach((b) => b.addEventListener("click", (e) => {
        e.stopPropagation();
        openAtt(b);
      }));

      rf.querySelectorAll("[data-cmdel]").forEach((b) => b.addEventListener("click", (e) => {
        e.stopPropagation();
        delComment(b.dataset.cmdel);
      }));
    }

    function reset() {           // смена круга/вкладки: закрыть и очистить
      stopPolling();
      openId = null; pending = []; draft = ""; cache = {}; counts = {};
    }

    return {
      styles: injectStyles, loadCounts, count, buttonHTML, panelHTML,
      toggle, close, wire, reset, reloadOpen, openAtt,
      isOpen: (id) => openId === id,
      // служебный доступ для дымовых тестов (tools/smoke.js) — в UI не используется
      _test: {
        setDraft: (v) => { draft = v; },
        addPending: (p) => pending.push(p),
        send: (t) => send(t),
        state: () => ({ openId, pending: pending.length, draft, counts }),
      },
    };
  }

  return { create, kindEmoji, styles: injectStyles, openAtt };
})();
window.__v02stage = "after-sixmin-comments"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-comments");

// app/js/sixmin-voice.js — v0.2 FIX: модуль диктовки
//
// Исправляет критические баги:
//  1. ЯВНАЯ кнопка «Стоп» (большая, всегда видна во время записи).
//  2. Автосохранение буфера каждые 5 секунд в IndexedDB — при обрыве
//     (свернули приложение, iOS убила вкладку, разрядился телефон)
//     запись ВОССТАНАВЛИВАЕТСЯ при следующем открытии.
//  3. beforeunload / pagehide / visibilitychange — принудительный flush буфера.
//  4. Screen Wake Lock — экран не гаснет во время записи.
//  5. Аудио пишется через ScriptProcessor (не зависит от MediaRecorder,
//     который Safari/iOS часто убивает в фоне) — raw PCM 16 kHz mono,
//     на выходе .wav, совместимый с Telegram voice.
//
// API:
//   SixMinVoice.mount(container, { onSaved })  — встроить виджет
//   SixMinVoice.checkRecovery()                — предложить восстановить оборванную запись

(function () {
  const DB_NAME = "sixmin-voice";
  const STORE_SESSIONS = "sessions";
  const STORE_CHUNKS = "chunks";
  const META_KEY = "sixmin_voice_meta"; // зеркало метаданных в localStorage
  const AUTOFLUSH_MS = 5000;
  const SAMPLE_RATE = 16000;

  // ---------- IndexedDB helpers ----------
  function openDB() {
    return new Promise((res, rej) => {
      const rq = indexedDB.open(DB_NAME, 1);
      rq.onupgradeneeded = () => {
        const db = rq.result;
        if (!db.objectStoreNames.contains(STORE_SESSIONS))
          db.createObjectStore(STORE_SESSIONS, { keyPath: "id" });
        if (!db.objectStoreNames.contains(STORE_CHUNKS)) {
          const cs = db.createObjectStore(STORE_CHUNKS, { keyPath: ["sessionId", "seq"] });
          cs.createIndex("bySession", "sessionId");
        }
      };
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
  }
  async function idbPut(store, value) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(value);
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => { db.close(); rej(tx.error); };
    });
  }
  async function idbGet(store, key) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const rq = db.transaction(store).objectStore(store).get(key);
      rq.onsuccess = () => { db.close(); res(rq.result); };
      rq.onerror = () => { db.close(); rej(rq.error); };
    });
  }
  async function idbAllChunks(sessionId) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const idx = db.transaction(STORE_CHUNKS).objectStore(STORE_CHUNKS).index("bySession");
      const rq = idx.getAll(IDBKeyRange.only(sessionId));
      rq.onsuccess = () => { db.close(); res(rq.result.sort((a, b) => a.seq - b.seq)); };
      rq.onerror = () => { db.close(); rej(rq.error); };
    });
  }
  async function idbDeleteSession(sessionId) {
    const db = await openDB();
    const tx = db.transaction([STORE_SESSIONS, STORE_CHUNKS], "readwrite");
    tx.objectStore(STORE_SESSIONS).delete(sessionId);
    tx.objectStore(STORE_CHUNKS).index("bySession").openCursor(IDBKeyRange.only(sessionId))
      .onsuccess = (e) => { const c = e.target.result; if (c) { c.delete(); c.continue(); } };
    await new Promise((r) => { tx.oncomplete = r; tx.onerror = r; });
    db.close();
    localStorage.removeItem(META_KEY);
  }

  // ---------- WAV encoding (16-bit PCM mono) ----------
  function encodeWav(float32Arrays) {
    const total = float32Arrays.reduce((s, a) => s + a.length, 0);
    const buf = new ArrayBuffer(44 + total * 2);
    const view = new DataView(buf);
    const wStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    wStr(0, "RIFF"); view.setUint32(4, 36 + total * 2, true); wStr(8, "WAVE");
    wStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, SAMPLE_RATE, true);
    view.setUint32(28, SAMPLE_RATE * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    wStr(36, "data"); view.setUint32(40, total * 2, true);
    let off = 44;
    for (const arr of float32Arrays) {
      for (let i = 0; i < arr.length; i++, off += 2) {
        const s = Math.max(-1, Math.min(1, arr[i]));
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
    }
    return new Blob([buf], { type: "audio/wav" });
  }

  // ---------- Состояние записи ----------
  const R = {
    recording: false,
    stream: null,
    ctx: null,
    node: null,
    source: null,
    sessionId: null,
    startedAt: 0,
    seq: 0,
    pending: [],        // Float32Array chunks, ещё не сохранённые в IDB
    lastLevel: 0,
    wakeLock: null,
    ui: null,
    onSaved: null,
    uploadOpts: {},     // { slot, linkToEntry } — прокидываются в upload()
    timerInt: null,
  };

  function meta() {
    return {
      sessionId: R.sessionId, startedAt: R.startedAt,
      lastFlush: Date.now(), chunks: R.seq, active: R.recording,
    };
  }
  function saveMeta() {
    try { localStorage.setItem(META_KEY, JSON.stringify(meta())); } catch {}
  }

  // ---------- Flush: сохранить накопленные чанки в IndexedDB ----------
  async function flush() {
    if (!R.sessionId || R.pending.length === 0) return;
    const chunks = R.pending.splice(0);
    const baseSeq = R.seq - chunks.length;
    for (let i = 0; i < chunks.length; i++) {
      // храним копию буфера (ArrayBuffer) — Float32Array может быть переиспользован
      await idbPut(STORE_CHUNKS, {
        sessionId: R.sessionId, seq: baseSeq + i, data: chunks[i].slice().buffer,
      });
    }
    saveMeta();
    if (R.ui) R.ui.status(`💾 Автосохранение · ${fmtElapsed(Date.now() - R.startedAt)}`);
  }

  function fmtElapsed(ms) {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  // ---------- Wake Lock ----------
  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        R.wakeLock = await navigator.wakeLock.request("screen");
        R.wakeLock.addEventListener("release", () => { R.wakeLock = null; });
      }
    } catch {}
    // при возврате на вкладку — перезапросить (браузер снимает lock при уходе в фон)
    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "visible" && R.recording && !R.wakeLock) {
        try { R.wakeLock = await navigator.wakeLock.request("screen"); } catch {}
      }
    });
  }
  function releaseWakeLock() {
    try { R.wakeLock?.release(); } catch {}
    R.wakeLock = null;
  }

  // ---------- START ----------
  async function start() {
    if (R.recording) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      SixMin.toast?.("Диктовка не поддерживается этим браузером");
      return;
    }
    try {
      R.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
    } catch (e) {
      SixMin.toast?.("Нет доступа к микрофону: " + (e.message || e.name));
      return;
    }

    R.recording = true;
    R.startedAt = Date.now();
    R.sessionId = "v_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    R.seq = 0;
    R.pending = [];

    // сессия в IDB сразу — даже если вкладка умрёт через секунду, есть что восстанавливать
    await idbPut(STORE_SESSIONS, { id: R.sessionId, startedAt: R.startedAt });
    saveMeta();

    // AudioContext + ScriptProcessor (работает в фоне надёжнее MediaRecorder)
    R.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
    if (R.ctx.state === "suspended") await R.ctx.resume();
    R.source = R.ctx.createMediaStreamSource(R.stream);
    const bufSize = Math.max(2048, Math.pow(2, Math.round(Math.log2(R.ctx.sampleRate * 0.25))));
    R.node = R.ctx.createScriptProcessor(bufSize, 1, 1);
    R.node.onaudioprocess = (e) => {
      if (!R.recording) return;
      const input = e.inputBuffer.getChannelData(0);
      R.pending.push(new Float32Array(input));
      R.seq++;
      // уровень для индикатора
      let sum = 0;
      for (let i = 0; i < input.length; i += 8) sum += input[i] * input[i];
      R.lastLevel = Math.min(1, Math.sqrt(sum / (input.length / 8)) * 4);
    };
    R.source.connect(R.node);
    R.node.connect(R.ctx.destination);

    requestWakeLock();

    // автосохранение каждые 5 секунд
    R.flushInt = setInterval(flush, AUTOFLUSH_MS);
    R.timerInt = setInterval(() => {
      if (R.ui) {
        R.ui.timer(fmtElapsed(Date.now() - R.startedAt));
        R.ui.level(R.lastLevel);
      }
    }, 250);

    if (R.ui) R.ui.setRecording(true);
  }

  // ---------- STOP + SAVE ----------
  async function stop(opts = { save: true, silent: false }) {
    if (!R.recording) return null;
    R.recording = false;
    clearInterval(R.flushInt);
    clearInterval(R.timerInt);
    releaseWakeLock();

    // финальный flush остатка буфера
    await flush();

    // остановить микрофон и аудиограф
    try { R.node?.disconnect(); R.source?.disconnect(); } catch {}
    try { R.stream?.getTracks().forEach((t) => t.stop()); } catch {}
    try { await R.ctx?.close(); } catch {}
    R.node = R.source = R.stream = R.ctx = null;
    if (R.ui) R.ui.setRecording(false);

    if (opts.returnBlob) {
      const chunks0 = await idbAllChunks(R.sessionId);
      const arrays0 = chunks0.map((c) => new Float32Array(c.data));
      const wav0 = encodeWav(arrays0);
      const dur0 = arrays0.reduce((s0, a) => s0 + a.length, 0) / SAMPLE_RATE;
      await idbDeleteSession(R.sessionId);
      return { blob: wav0, durationSec: dur0 };
    }
    if (!opts.save) return null;

    // собрать все чанки из IDB -> wav
    const chunks = await idbAllChunks(R.sessionId);
    if (chunks.length === 0) {
      await idbDeleteSession(R.sessionId);
      if (!opts.silent) SixMin.toast?.("Запись пуста");
      return null;
    }
    const arrays = chunks.map((c) => new Float32Array(c.data));
    const wav = encodeWav(arrays);
    const durationSec = arrays.reduce((s, a) => s + a.length, 0) / SAMPLE_RATE;

    let result = null;
    try {
      result = await upload(wav, durationSec, R.startedAt, R.uploadOpts);
    } catch (e) {
      console.error(e);
      if (!opts.silent)
        SixMin.toast?.("Не удалось сохранить: " + (e.message || e) + ". Запись осталась в буфере — попробуйте снова.");
      R.recording = false;
      if (R.ui) R.ui.setRecording(false);
      return null; // НЕ удаляем сессию — данные останутся для восстановления
    }

    await idbDeleteSession(R.sessionId);
    if (!opts.silent) SixMin.toast?.(`Голос сохранён · ${fmtElapsed(durationSec * 1000)}`);
    if (typeof R.onSaved === "function") R.onSaved(result);
    return result;
  }

  // ---------- Upload в Supabase Storage + запись в voice_notes ----------
  // Схема v0.1: entries имеет unique(user_id,date,slot) и поле voice_path,
  // но несколько диктовок в день туда не поместятся -> пишем в voice_notes
  // (создаётся миграцией 20261007_v02_reminders_fix.sql).
  async function upload(blob, durationSec, startedAt, opts = {}) {
    const uid = await SixMin.uid();
    const dayKey = await SixMin.todayKey(new Date(startedAt));
    const path = `${uid}/${dayKey}/${startedAt}.wav`;

    const { error: upErr } = await SixMin.sb().storage.from("voices").upload(path, blob, {
      contentType: "audio/wav", upsert: false,
    });
    if (upErr) throw upErr;

    const { data: pub } = SixMin.sb().storage.from("voices").getPublicUrl(path);

    // 1) основная строка — voice_notes (никогда не конфликтует)
    const { data: note, error: noteErr } = await SixMin.sb()
      .from("voice_notes").insert({
        user_id: uid,
        day: dayKey,
        voice_path: path,
        duration_seconds: Math.round(durationSec),
      }).select().maybeSingle();
    if (noteErr) console.warn("voice_notes insert failed:", noteErr);

    // 2) опционально — привязать к записи entries конкретного слота
    //    (opts.slot: 'am' | 'pm' | 'quick'; вызывает ваш колбэк, т.к. логика
    //    слотов живёт в app.js)
    let entry = null;
    if (opts.slot && typeof opts.linkToEntry === "function") {
      try { entry = await opts.linkToEntry({ dayKey, path, slot: opts.slot, durationSec }); }
      catch (e) { console.warn("linkToEntry failed:", e); }
    }

    return { path, publicUrl: pub?.publicUrl, durationSec, note, entry };
  }

  // ---------- ВОССТАНОВЛЕНИЕ оборванной записи ----------
  async function checkRecovery() {
    let m = null;
    try { m = JSON.parse(localStorage.getItem(META_KEY) || "null"); } catch {}
    if (!m?.sessionId) return null;
    const session = await idbGet(STORE_SESSIONS, m.sessionId);
    if (!session) { localStorage.removeItem(META_KEY); return null; }
    const chunks = await idbAllChunks(m.sessionId);
    if (chunks.length === 0) { await idbDeleteSession(m.sessionId); return null; }

    const durMs = chunks.reduce((s, c) => s + c.data.byteLength / 2, 0) / SAMPLE_RATE * 1000;
    return new Promise((resolve) => {
      showRecoverySheet(m, durMs, async (action) => {
        if (action === "restore") {
          const arrays = chunks.map((c) => new Float32Array(c.data));
          const wav = encodeWav(arrays);
          try {
            const result = await upload(wav, durMs / 1000, m.startedAt, R.uploadOpts);
            await idbDeleteSession(m.sessionId);
            SixMin.toast?.("Оборванная запись восстановлена и сохранена ✅");
            if (typeof R.onSaved === "function") R.onSaved(result);
            resolve(result);
          } catch (e) {
            SixMin.toast?.("Ошибка восстановления: " + (e.message || e));
            resolve(null);
          }
        } else {
          await idbDeleteSession(m.sessionId);
          resolve(null);
        }
      });
    });
  }

  function showRecoverySheet(m, durMs, cb) {
    const when = new Date(m.startedAt);
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;" +
      "display:flex;align-items:center;justify-content:center;padding:20px";
    wrap.innerHTML = `
      <div style="background:#fff;color:#111;border-radius:16px;max-width:360px;width:100%;
                  padding:22px;font:15px/1.5 system-ui;box-shadow:0 20px 60px rgba(0,0,0,.4)">
        <div style="font-size:34px">🎙️</div>
        <h3 style="margin:8px 0 6px;font-size:17px">Найдена незавершённая запись</h3>
        <p style="margin:0 0 16px;color:#555">
          ${when.toLocaleString("ru-RU")} · длительность ≈ ${fmtElapsed(durMs)}.<br>
          Приложение было закрыто во время диктовки — буфер сохранён.
        </p>
        <div style="display:flex;gap:10px">
          <button id="sixmin-restore" style="flex:1;padding:12px;border:0;border-radius:12px;
                  background:var(--accent,#E30613);color:#fff;font-size:15px;font-weight:600;cursor:pointer">
            Восстановить
          </button>
          <button id="sixmin-discard" style="padding:12px 16px;border:1px solid #ddd;border-radius:12px;
                  background:transparent;color:#777;font-size:15px;cursor:pointer">
            Удалить
          </button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.querySelector("#sixmin-restore").onclick = () => { wrap.remove(); cb("restore"); };
    wrap.querySelector("#sixmin-discard").onclick = () => { wrap.remove(); cb("discard"); };
  }

  // ---------- Глобальные страховки ----------
  window.addEventListener("pagehide", () => { if (R.recording) { flush(); saveMeta(); } });
  window.addEventListener("beforeunload", () => { if (R.recording) { flush(); saveMeta(); } });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && R.recording) { flush(); saveMeta(); }
  });

  // ---------- UI виджет ----------
  function mount(container, opts = {}) {
    if (typeof container === "string") container = document.querySelector(container);
    if (!container) return;
    R.onSaved = opts.onSaved || null;
    R.uploadOpts = { slot: opts.slot || null, linkToEntry: opts.linkToEntry || null };

    container.innerHTML = `
      <div class="sixmin-vr" style="display:flex;flex-direction:column;align-items:center;gap:14px;padding:18px 0;position:relative">
        <button class="sm-ib" data-info="voice" aria-label="Как это работает" style="position:absolute;top:6px;right:6px">i</button>
        <div class="sixmin-vr-timer" style="font:600 40px/1 ui-monospace,monospace;letter-spacing:2px">00:00</div>
        <div class="sixmin-vr-meter" style="width:180px;height:8px;border-radius:4px;background:rgba(128,128,128,.25);overflow:hidden">
          <div class="sixmin-vr-meter-fill" style="width:0%;height:100%;background:#E30613;transition:width .15s"></div>
        </div>
        <div style="display:flex;gap:16px;align-items:center">
          <button class="sixmin-vr-start" aria-label="Начать запись" style="width:72px;height:72px;border-radius:50%;
                  border:0;background:#E30613;color:#fff;font-size:30px;cursor:pointer;
                  box-shadow:0 6px 20px rgba(229,72,77,.4)">🎙️</button>
          <button class="sixmin-vr-stop" aria-label="Остановить и сохранить" style="width:72px;height:72px;border-radius:50%;
                  border:3px solid #E30613;background:transparent;color:#E30613;font-size:22px;font-weight:800;
                  cursor:pointer;display:none">СТОП</button>
        </div>
        <div class="sixmin-vr-status" style="font-size:13px;opacity:.7;min-height:18px;text-align:center">
          Нажмите 🎙️ и говорите. Буфер сохраняется каждые 5 секунд.
        </div>
      </div>`;

    const q = (s) => container.querySelector(s);
    R.ui = {
      setRecording(on) {
        q(".sixmin-vr-start").style.display = on ? "none" : "";
        q(".sixmin-vr-stop").style.display = on ? "" : "none";
        if (!on) { q(".sixmin-vr-timer").textContent = "00:00"; q(".sixmin-vr-meter-fill").style.width = "0%"; }
      },
      timer(t) { q(".sixmin-vr-timer").textContent = t; },
      level(v) { q(".sixmin-vr-meter-fill").style.width = Math.round(v * 100) + "%"; },
      status(s) { q(".sixmin-vr-status").textContent = s; },
    };

    q('[data-info="voice"]')?.addEventListener("click", () => SixMin.info("Диктовка",
      "<p>Нажмите красную кнопку 🎙️ и говорите. Таймер и полоска уровня показывают, что запись идёт. Буфер сохраняется в память телефона <b>каждые 5 секунд</b>, поэтому даже если приложение закроется или телефон уснёт — запись не пропадёт: при следующем открытии появится предложение восстановить её.</p>" +
      "<p>Кнопка <b>СТОП</b> останавливает и сохраняет: файл уходит в облако, а запись — в список <b>«🎧 Голосовые записи»</b> на вкладке «Сегодня» — там её можно прослушать (▶) или удалить (×). Esc — тоже стоп.</p>" +
      "<p>Короткое аудио можно приложить и к комментарию задачи: кнопка 🎙 в панели 💬</p>"));
    q(".sixmin-vr-start").onclick = start;
    q(".sixmin-vr-stop").onclick = () => stop({ save: true });

    // горячая клавиша: Пробел во время записи = стоп (на странице записи)
    document.addEventListener("keydown", (e) => {
      if (R.recording && e.code === "Escape") { e.preventDefault(); stop({ save: true }); }
    });

    // сразу проверяем оборванные записи
    checkRecovery();
  }

  // ---------- компактная запись для вложений (возвращает blob) ----------
  async function capture() {
    const ov = document.createElement("div");
    ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10001;" +
      "display:flex;align-items:center;justify-content:center;padding:20px";
    ov.innerHTML = '<div style="background:#222;color:#fff;border-radius:16px;padding:22px 28px;text-align:center;font:14px system-ui,sans-serif">' +
      '<div class="sm-cap-t" style="font:600 30px ui-monospace,monospace;margin-bottom:10px">00:00</div>' +
      '<div class="sm-cap-dot" style="width:14px;height:14px;border-radius:50%;background:#E30613;margin:0 auto 14px"></div>' +
      '<button class="sm-cap-stop" style="padding:10px 24px;border:0;border-radius:12px;background:#E30613;color:#fff;font-weight:700;font-size:15px;cursor:pointer">Стоп</button>' +
      '<div style="margin-top:10px;opacity:.6;font-size:12px">аудио приложится к задаче</div></div>';
    document.body.appendChild(ov);
    const t0 = Date.now();
    const ti = setInterval(() => {
      const sec = Math.floor((Date.now() - t0) / 1000);
      const el = ov.querySelector(".sm-cap-t");
      if (el) el.textContent = String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
    }, 250);
    return new Promise((resolve, reject) => {
      (async () => {
        try { await start(); } catch (e) { clearInterval(ti); ov.remove(); reject(e); return; }
        ov.querySelector(".sm-cap-stop").onclick = async () => {
          clearInterval(ti); ov.remove();
          resolve(await stop({ save: false, returnBlob: true }));
        };
      })();
    });
  }

  window.SixMinVoice = { mount, start, stop, capture, checkRecovery };
})();
window.__v02stage = "after-sixmin-voice"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-voice");

// app/js/sixmin-voicelist.js — v0.2: «Мои записи» — прослушивание голосовых из voice_notes
// Замыкает цикл диктовки: записать (Трекер → Быстрая диктовка) → послушать (История → Голосовые записи).
// Аудио тянется через авторизованный клиент (storage.download) — работает
// даже при приватном бакете voices.
// API: SixMinVoiceList.mount(container)

(function () {
  let root = null;
  let rows = [];

  async function load() {
    const uid = await SixMin.uid().catch(() => "00000000-0000-0000-0000-000000000000");
    const { data, error } = await SixMin.sb().from("voice_notes")
      .select("*").eq("user_id", uid)
      .order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    rows = data || [];
  }

  const fmt = (sec) => {
    sec = Math.max(0, Math.round(sec || 0));
    return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
  };

  function render() {
    if (!root) return;
    if (!rows.length) {
      root.innerHTML =
        '<p style="font-size:13px;opacity:.65;padding:4px 2px;line-height:1.5">' +
        'Записей пока нет. Надиктуйте первую: <b>Трекер → Быстрая диктовка</b> 🎙️</p>';
      return;
    }
    root.innerHTML = '<ul class="sm-vl">' + rows.map((r) => {
      const d = SixMin.parseKey(String(r.day));
      return '<li class="sm-vl-row">' +
        '<button class="sm-vl-play" data-play="' + r.id + '" aria-label="Прослушать">▶</button>' +
        '<div class="sm-vl-meta"><b>' + SixMin.esc(d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })) + '</b>' +
        '<span>' + SixMin.esc(d.toLocaleDateString("ru-RU", { weekday: "long" })) + ' · ' + fmt(r.duration_seconds) + '</span></div>' +
        '<div class="sm-vl-player" id="sm-vl-p-' + r.id + '"></div>' +
        '<button class="sm-vl-del" data-del="' + r.id + '" aria-label="Удалить запись">×</button>' +
        '</li>';
    }).join("") + '</ul>';
    root.querySelectorAll("[data-play]").forEach((b) =>
      b.addEventListener("click", () => play(b.dataset.play)));
    root.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => del(b.dataset.del)));
  }

  async function play(id) {
    const row = rows.find((x) => x.id === id);
    const host = document.getElementById("sm-vl-p-" + id);
    if (!row || !host) return;
    const existing = host.querySelector("audio");
    if (existing) { existing.paused ? existing.play() : existing.pause(); return; }
    if (host.dataset.loading) return;
    host.dataset.loading = "1";
    host.innerHTML = '<span style="font-size:12px;opacity:.6">Загружаю…</span>';
    try {
      const { data, error } = await SixMin.sb().storage.from("voices").download(row.voice_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      host.innerHTML = '<audio controls src="' + url + '" style="width:100%;height:38px"></audio>';
      host.querySelector("audio").play().catch(() => {});
    } catch (e) {
      host.innerHTML = '<span style="font-size:12px;color:#E30613">Ошибка загрузки: ' +
        SixMin.esc(e.message || e) + '</span>';
    }
  }

  async function del(id) {
    if (!confirm("Удалить запись безвозвратно? Файл также удалится из облака.")) return;
    const row = rows.find((x) => x.id === id);
    if (!row) return;
    try {
      const { error: stErr } = await SixMin.sb().storage.from("voices").remove([row.voice_path]);
      if (stErr) console.warn("storage remove:", stErr); // запись в БД удаляем в любом случае
      const { error } = await SixMin.sb().from("voice_notes").delete().eq("id", id);
      if (error) throw error;
      SixMin.toast("Запись удалена");
      await refresh();
    } catch (e) {
      SixMin.toast("Ошибка удаления: " + (e.message || e));
    }
  }

  async function refresh() {
    try { await load(); render(); }
    catch (e) {
      if (root) root.innerHTML = '<p style="font-size:13px;opacity:.7">' +
        (/auth|session/i.test(String(e.message || e))
          ? "Войдите в облако, чтобы видеть голосовые записи со всех устройств."
          : "Не удалось загрузить записи: " + SixMin.esc(e.message || e)) +
        '</p>';
    }
  }

  function mount(container) {
    root = typeof container === "string" ? document.querySelector(container) : container;
    injectStyles();
    // кнопка [i] в заголовок карточки «🎧 Голосовые записи»
    const card = root.closest("article") || root.parentElement;
    const h = card && card.querySelector("h3");
    if (h && !h.querySelector('[data-info="voicelist"]')) {
      const b = document.createElement("button");
      b.className = "sm-ib";
      b.dataset.info = "voicelist";
      b.setAttribute("aria-label", "Как это работает");
      b.textContent = "i";
      b.style.cssText = "margin-left:8px;vertical-align:middle";
      h.appendChild(b);
      b.addEventListener("click", () => SixMin.info("Голосовые записи",
        "<p>Здесь хранятся аудиоверсии ваших диктовок: «Сегодня → Быстрая диктовка» пишёт голос, " +
        "запись сохраняется в облако и появляется в этом списке.</p>" +
        "<p>▶ — прослушать запись, × — удалить из облака безвозвратно.</p>" +
        "<p>Записи приватны: доступны только вашему аккаунту.</p>"));
    }
    refresh();
  }

  function injectStyles() {
    if (document.getElementById("sixmin-voicelist-css")) return;
    const css = document.createElement("style");
    css.id = "sixmin-voicelist-css";
    css.textContent = `
      .sm-vl{list-style:none;margin:0;padding:0}
      .sm-vl-row{display:flex;align-items:center;gap:12px;padding:9px 4px;
                 border-bottom:1px dashed rgba(128,128,128,.22);flex-wrap:wrap}
      .sm-vl-row:last-child{border-bottom:0}
      .sm-vl-play{width:40px;height:40px;border-radius:50%;border:0;background:var(--accent,#E30613);color:#fff;
                  font-size:14px;cursor:pointer;flex-shrink:0}
      .sm-vl-play:active{transform:scale(.92)}
      .sm-vl-meta{display:flex;flex-direction:column;font-size:13px;min-width:0}
      .sm-vl-meta span{opacity:.6;font-size:12px}
      .sm-vl-player{flex:1 1 100%;min-width:0}
      .sm-vl-del{border:0;background:transparent;color:inherit;opacity:.4;font-size:17px;cursor:pointer;
                 margin-left:auto;padding:4px;flex-shrink:0}
      .sm-vl-del:active{opacity:1;color:#E30613}`;
    document.head.appendChild(css);
  }

  window.SixMinVoiceList = { mount, refresh };
})();
window.__v02stage = "after-sixmin-voicelist"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-voicelist");

// app/js/sixmin-habits.js — v0.2: Трекер привычек (сетка 5 × 7, ○/●, % выполнения)
// Зависит от sixmin-common.js. API: SixMinHabits.mount(container)

(function () {
  const MAX_HABITS = 5; // как в бумажном оригинале
  let state = { habits: [], logs: {}, weekOffset: 0 };
  let root = null;

  async function load() {
    const uid = await SixMin.uid().catch(() => "00000000-0000-0000-0000-000000000000"); // v0.8.6: нет сессии — пустые данные вместо красной консоли
    const keys = SixMin.weekKeys(state.weekOffset);
    const [h, l] = await Promise.all([
      SixMin.sb().from("habits").select("*")
        .eq("user_id", uid).eq("archived", false)
        .order("position", { ascending: true }).order("created_at", { ascending: true }),
      SixMin.sb().from("habit_logs").select("habit_id, day, completed")
        .eq("user_id", uid).gte("day", keys[0]).lte("day", keys[6]),
    ]);
    state.habits = h.data || [];
    state.logs = {};
    for (const row of l.data || []) state.logs[row.habit_id + "|" + row.day] = row.completed;
  }

  function isPlanned(habit, dayIdx) {
    return (habit.active_days || [0,1,2,3,4,5,6]).includes(dayIdx);
  }

  function weekStats() {
    const keys = SixMin.weekKeys(state.weekOffset);
    let planned = 0, done = 0;
    for (const h of state.habits) {
      keys.forEach((k, i) => {
        if (!isPlanned(h, i)) return;
        planned++;
        if (state.logs[h.id + "|" + k]) done++;
      });
    }
    return { planned, done, pct: planned ? Math.round((done / planned) * 100) : 0 };
  }

  async function toggle(habitId, dayKey, dayIdx) {
    const uid = await SixMin.uid();
    const key = habitId + "|" + dayKey;
    const nowDone = !state.logs[key];
    state.logs[key] = nowDone; // оптимистично
    render();
    await SixMin.sb().from("habit_logs").upsert({
      habit_id: habitId, user_id: uid, day: dayKey, completed: nowDone, updated_at: new Date().toISOString(),
    });
  }

  async function addHabit(name) {
    if (state.habits.length >= MAX_HABITS) {
      SixMin.toast(`Максимум ${MAX_HABITS} привычек — как в бумажном блокноте. Сначала удалите лишнюю.`);
      return;
    }
    const uid = await SixMin.uid();
    const colors = ["var(--accent,#E30613)", "#E30613", "#9A9A9A", "var(--accent,#E30613)", "#6E6E6E"];
    const { error } = await SixMin.sb().from("habits").insert({
      user_id: uid, name: name.trim(),
      color: colors[state.habits.length % colors.length],
      position: state.habits.length,
    });
    if (error) { SixMin.toast("Ошибка: " + error.message); return; }
    await load(); render();
  }

  async function removeHabit(id) {
    if (!confirm("Удалить привычку и её отметки?")) return;
    await SixMin.sb().from("habits").update({ archived: true }).eq("id", id);
    await load(); render();
  }

  function render() {
    if (!root) return;
    const keys = SixMin.weekKeys(state.weekOffset);
    const todayKey = SixMin.fmtKey(new Date());
    const stats = weekStats();

    const head = SixMin.DAYS_SHORT.map((d, i) =>
      `<th class="sm-h-dow${keys[i] === todayKey ? " sm-today" : ""}">${d}<span>${keys[i].slice(8)}</span></th>`
    ).join("");

    const rows = state.habits.map((h) => {
      const cells = keys.map((k, i) => {
        const planned = isPlanned(h, i);
        const done = !!state.logs[h.id + "|" + k];
        const cls = !planned ? "sm-off" : done ? "sm-done" : "sm-empty";
        return `<td><button class="sm-cell ${cls}" data-h="${h.id}" data-d="${k}" data-i="${i}"
                  ${planned ? "" : "disabled"} aria-label="${done ? "выполнено" : "не выполнено"}">${done ? "●" : "○"}</button></td>`;
      }).join("");
      const doneCount = keys.filter((k, i) => isPlanned(h, i) && state.logs[h.id + "|" + k]).length;
      const planCount = keys.filter((k, i) => isPlanned(h, i)).length;
      return `<tr>
        <td class="sm-h-name" style="--hc:${h.color}">
          <span class="sm-h-title" title="${SixMin.esc(h.name)}">${SixMin.esc(h.name)}</span>
          <button class="sm-h-del" data-del="${h.id}" title="Удалить">×</button>
        </td>${cells}
        <td class="sm-h-pct">${planCount ? Math.round((doneCount / planCount) * 100) + "%" : "—"}</td>
      </tr>`;
    }).join("");

    root.innerHTML = `
      <div class="sm-habits">
        <div class="sm-week-nav">
          <button class="sm-nav" data-nav="-1" aria-label="Предыдущая неделя">‹</button>
          <div class="sm-week-label">
            ${SixMin.esc(SixMin.fmtRange(keys))}
            ${state.weekOffset === 0 ? '<em>· эта неделя</em>' : ""}
          </div>
          <button class="sm-nav" data-nav="1" ${state.weekOffset >= 0 ? "disabled" : ""} aria-label="Следующая неделя">›</button>
          <button class="sm-ib" data-info="habits" aria-label="Как это работает">i</button>
        </div>
        <div class="sm-progress-wrap">
          <div class="sm-progress"><div class="sm-progress-fill" style="width:${stats.pct}%"></div></div>
          <div class="sm-progress-text">${stats.pct}% <span>· ${stats.done}/${stats.planned} за неделю</span></div>
        </div>
        <div class="sm-grid-scroll">
          <table class="sm-grid">
            <thead><tr><th class="sm-h-name"></th>${head}<th class="sm-h-pct-head">%</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="9" class="sm-empty-hint">Пока нет привычек — добавьте первую 👇<br><small>В бумажном блокноте «6 минут» их ровно ${MAX_HABITS}.</small></td></tr>`}</tbody>
          </table>
        </div>
        ${state.habits.length < MAX_HABITS ? `
        <form class="sm-add">
          <input class="sm-add-input" maxlength="40" placeholder="Новая привычка (например: Медитация)" autocomplete="off">
          <button class="sm-add-btn" type="submit">+</button>
        </form>` : ""}
      </div>`;

    // события
    root.querySelectorAll(".sm-cell:not([disabled])").forEach((b) =>
      b.addEventListener("click", () => toggle(b.dataset.h, b.dataset.d, +b.dataset.i)));
    root.querySelectorAll("[data-nav]").forEach((b) =>
      b.addEventListener("click", () => {
        const n = state.weekOffset + Number(b.dataset.nav);
        if (n > 0) return;
        state.weekOffset = n; refresh();
      }));
    root.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => removeHabit(b.dataset.del)));
    root.querySelector('[data-info="habits"]')?.addEventListener("click", () => SixMin.info("Трекер привычек",
      "<p>Как в бумажном блокноте «6 минут»: до <b>5 привычек × 7 дней</b>. Кружок ○ — день не отмечен, нажмите его — станет ● (выполнено). Бледные кружки — дни, когда привычка не запланирована (её можно сделать не каждый день).</p>" +
      "<p>Полоса и процент сверху — выполнение за неделю. Цифра справа у привычки — её личный процент за неделю. Стрелки ‹ › листают недели: можно отметить пропущенное задним числом или посмотреть прошлые недели.</p>" +
      "<p>Отметки кормят инфографику: heatmap и серия 🔥 во вкладке «Прогресс» считаются по ним и по записям дневника.</p>"));
    root.querySelector(".sm-add")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = root.querySelector(".sm-add-input");
      if (inp.value.trim()) { addHabit(inp.value); }
    });
  }

  async function refresh() { await load(); render(); }

  function mount(container) {
    root = typeof container === "string" ? document.querySelector(container) : container;
    injectStyles();
    try { render(); } catch (e) { console.error("[v02] skeleton render", e); } // каркас сразу, данные подъедут
    refresh();
  }

  function injectStyles() {
    if (document.getElementById("sixmin-habits-css")) return;
    const css = document.createElement("style");
    css.id = "sixmin-habits-css";
    css.textContent = `
      .sm-habits{--bg:rgba(128,128,128,.12);font-family:system-ui,sans-serif}
      .sm-week-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
      .sm-week-label{font-weight:600;font-size:15px}
      .sm-week-label em{font-style:normal;opacity:.55;font-weight:400;font-size:13px}
      .sm-nav{width:36px;height:36px;border-radius:10px;border:1px solid var(--bg);background:transparent;
              color:inherit;font-size:20px;cursor:pointer;line-height:1}
      .sm-nav:disabled{opacity:.3;cursor:default}
      .sm-progress-wrap{margin-bottom:14px}
      .sm-progress{height:8px;border-radius:4px;background:var(--bg);overflow:hidden}
      .sm-progress-fill{height:100%;background:linear-gradient(90deg,var(--accent,#E30613),#FF6B6B);border-radius:4px;transition:width .3s}
      .sm-progress-text{font-size:13px;margin-top:5px;font-weight:600}
      .sm-progress-text span{opacity:.6;font-weight:400}
      .sm-grid-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
      .sm-grid{border-collapse:collapse;width:100%;min-width:420px}
      .sm-grid th,.sm-grid td{padding:4px;text-align:center}
      .sm-h-dow{font-size:11px;opacity:.6;font-weight:500}
      .sm-h-dow span{display:block;font-size:10px;opacity:.7}
      .sm-h-dow.sm-today{color:var(--accent,#E30613);opacity:1;font-weight:700}
      .sm-h-name{text-align:left!important;max-width:138px;min-width:100px;position:relative;padding-right:22px!important}
      .sm-h-title{font-size:12.5px;font-weight:600;line-height:1.3;word-break:break-word;
                  border-left:3px solid var(--hc,var(--accent,#E30613));padding-left:8px;
                  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
      .sm-h-del{position:absolute;right:2px;top:50%;transform:translateY(-50%);border:0;background:transparent;
                color:inherit;opacity:.3;cursor:pointer;font-size:16px;line-height:1}
      .sm-h-del:hover{opacity:.9;color:#E30613}
      .sm-cell{width:38px;height:38px;border-radius:50%;border:0;background:transparent;font-size:19px;
               cursor:pointer;color:inherit;transition:transform .1s}
      .sm-cell:active{transform:scale(.85)}
      .sm-empty{opacity:.35}
      .sm-done{color:var(--accent,#E30613)}
      .sm-off{opacity:.08;cursor:default}
      .sm-h-pct{font-size:12px;opacity:.7;font-weight:600;min-width:36px}
      .sm-h-pct-head{font-size:11px;opacity:.5}
      .sm-empty-hint{padding:26px 10px!important;text-align:center!important;opacity:.6;font-size:14px;line-height:1.6}
      .sm-add{display:flex;gap:8px;margin-top:14px}
      .sm-add-input{flex:1;padding:11px 14px;border-radius:12px;border:1px solid var(--bg);
                    background:transparent;color:inherit;font-size:14px;outline:none}
      .sm-add-input:focus{border-color:var(--accent,#E30613)}
      .sm-add-btn{width:44px;border-radius:12px;border:0;background:var(--accent,#E30613);color:#fff;font-size:22px;cursor:pointer}`;
    document.head.appendChild(css);
  }

  window.SixMinHabits = { mount, refresh };
})();
window.__v02stage = "after-sixmin-habits"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-habits");

// app/js/sixmin-focus.js — v0.2: Фокус дня / недели / месяца
//   День:   «Главная задача дня» (Антилопа 🦌)
//   Неделя: 2 главные цели + подзадачи
//   Месяц:  одна глобальная цель
// API: SixMinFocus.mount(container)

(function () {
  let root = null;
  let tab = "day"; // day | week | month
  let goals = [];
  let now = new Date();
  // v0.8.14: перенос цели недели/месяца в другой период
  let moveIdx = null; // индекс карточки, у которой открыт выбор периода
  let moveOff = 1;    // сдвиг выбранного периода от текущего

  const periodOf = (t) => {
    if (t === "day") return { type: "day", key: SixMin.fmtKey(now), count: 1 };
    if (t === "week") return { type: "week", key: SixMin.weekKeyISO(now), count: 2 };
    return { type: "month", key: SixMin.monthKey(now), count: 5 };
  };

  async function load() {
    const uid = await SixMin.uid().catch(() => "00000000-0000-0000-0000-000000000000");
    const p = periodOf(tab);
    const { data } = await SixMin.sb().from("focus_goals")
      .select("*").eq("user_id", uid).eq("period_type", p.type).eq("period_key", p.key)
      .order("goal_index");
    goals = data || [];
  }

  async function ensureGoal(index) {
    const uid = await SixMin.uid();
    const p = periodOf(tab);
    let g = goals.find((x) => x.goal_index === index);
    if (g) return g;
    const { data, error } = await SixMin.sb().from("focus_goals").insert({
      user_id: uid, period_type: p.type, period_key: p.key, goal_index: index,
      title: "", subtasks: [],
    }).select().maybeSingle();
    if (error && error.code !== "23505") throw error;
    if (data) { goals.push(data); return data; }
    await load();
    return goals.find((x) => x.goal_index === index);
  }

  const saveTitle = SixMin.debounce(async (index, title) => {
    const g = await ensureGoal(index);
    if (!g) return;
    await SixMin.sb().from("focus_goals").update({ title, updated_at: new Date().toISOString() }).eq("id", g.id);
    g.title = title;
  }, 700);

  // подзадачи: jsonb [{text, done}]; старые строки из text[] нормализуем
  const normSubs = (arr) => (Array.isArray(arr) ? arr : []).map((el) =>
    typeof el === "string" ? { text: el, done: false } : { text: String(el?.text || ""), done: !!el?.done });

  async function persistSubs(index, subs) {
    const g = await ensureGoal(index);
    if (!g) return;
    await SixMin.sb().from("focus_goals")
      .update({ subtasks: subs, updated_at: new Date().toISOString() }).eq("id", g.id);
    g.subtasks = subs;
  }
  const saveSubtasks = SixMin.debounce(persistSubs, 700);

  async function toggleDone(index) {
    const g = await ensureGoal(index);
    if (!g) return;
    g.done = !g.done;
    await SixMin.sb().from("focus_goals").update({ done: g.done, updated_at: new Date().toISOString() }).eq("id", g.id);
    render();
  }

  function shift(dir) {
    now = new Date(now);
    if (tab === "day") now.setDate(now.getDate() + dir);
    else if (tab === "week") now.setDate(now.getDate() + dir * 7);
    else now.setMonth(now.getMonth() + dir);
    moveIdx = null; // v0.8.14: листаем период — закрываем пикер переноса
    refresh();
  }

  function label() {
    if (tab === "day")
      return now.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" });
    if (tab === "week") {
      const keys = SixMin.weekKeys(0, now);
      return SixMin.fmtRange(keys) + " · " + SixMin.weekKeyISO(now);
    }
    return now.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  }

  function cardHTML(index, cfg) {
    const g = goals.find((x) => x.goal_index === index);
    const title = g?.title || "";
    const subs = normSubs(g?.subtasks);
    const done = !!g?.done;
    return `
      <div class="sm-focus-card${done ? " sm-focus-done" : ""}" style="--ac:${cfg.color}">
        <div class="sm-focus-head">
          <span class="sm-focus-emoji">${cfg.emoji}</span>
          <span class="sm-focus-cap">${cfg.caption}</span>
          ${cfg.subtasks && g?.id ? `<button class="sm-move-btn" data-mv="${index}" title="Перенести на другой месяц/неделю" aria-label="Перенести">⤳</button>` : ""}
          ${cfg.blank ? "" : `<button class="sm-focus-check" data-done="${index}" title="Отметить выполненным">${done ? "✅" : "⬜"}</button>`}
        </div>
        <textarea class="sm-focus-title" data-idx="${index}" rows="${cfg.rows || 2}"
          placeholder="${cfg.placeholder}">${SixMin.esc(title)}</textarea>
        ${cfg.subtasks ? `
        <div class="sm-focus-subs">
          ${subs.map((s, si) => `
            <div class="sm-sub-row${s.done ? " sm-sub-done" : ""}">
              <button class="sm-sub-check" data-subtog="${index}:${si}" aria-label="Выполнено">${s.done ? "☑" : "☐"}</button>
              <input class="sm-sub-input" data-idx="${index}" data-si="${si}" value="${SixMin.esc(s.text)}" maxlength="80">
              <button class="sm-sub-del" data-idx="${index}" data-si="${si}">×</button>
            </div>`).join("")}
          <button class="sm-sub-add" data-idx="${index}">+ подзадача</button>
        </div>` : ""}
        ${moveIdx === index && g?.id ? movePickerHTML(index) : ""}
      </div>`;
  }

  // v0.8.14: выбор периода, куда перенести цель (стрелки как в листалке периода)
  function moveTargetDate() {
    const d = new Date(now);
    if (tab === "week") d.setDate(d.getDate() + moveOff * 7);
    else d.setMonth(d.getMonth() + moveOff);
    return d;
  }
  function moveTargetLabel() {
    const d = moveTargetDate();
    return tab === "week"
      ? "неделя " + SixMin.fmtRange(SixMin.weekKeys(0, d))
      : d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  }
  function movePickerHTML(index) {
    return `
      <div class="sm-move-pick">
        <span class="sm-move-cap">⤳ Перенести цель (подзадачи и отметки поедут с ней)</span>
        <div class="sm-move-nav">
          <button type="button" class="sm-nav sm-move-arr" data-mvshift="-1" title="Раньше">‹</button>
          <span class="sm-move-label">${SixMin.esc(moveTargetLabel())}</span>
          <button type="button" class="sm-nav sm-move-arr" data-mvshift="1" title="Позже">›</button>
        </div>
        <div class="sm-move-acts">
          <button type="button" class="sm-move-ok" data-mvgo="${index}">Перенести сюда</button>
          <button type="button" class="sm-move-cancel" data-mvclose="${index}">Отмена</button>
        </div>
      </div>`;
  }

  // v0.8.16: цель считается заполненной, если есть текст или хотя бы одна подзадача
  const goalHasContent = (i) => {
    const g = goals.find((x) => x.goal_index === i);
    return !!g && (!!String(g.title || "").trim() || normSubs(g.subtasks).length > 0);
  };
  let addOpen = false; // спойлер «добавить цель» помнит состояние между перерисовками
  function monthCards() {
    const idxs = [0, 1, 2, 3, 4];
    const mc = (i) => ({
      emoji: "🏔️", caption: "Цель месяца №" + (i + 1),
      color: ["var(--accent,#E30613)", "var(--accent,#E30613)", "#9A9A9A", "#E30613", "#6E6E6E"][i],
      rows: 2, placeholder: "Цель месяца — своими словами", subtasks: true,
    });
    const full = idxs.filter(goalHasContent);
    const free = idxs.filter((i) => !goalHasContent(i));
    const out = full.map((i) => cardHTML(i, mc(i)));
    if (!full.length)
      out.push(`<div class="sm-focus-empty">Целей на этот месяц пока нет — добавьте первую в спойлере ниже ↓</div>`);
    out.push(free.length
      ? `<details class="sm-focus-add"${addOpen ? " open" : ""}>` +
        `<summary>➕ Добавить цель месяца · свободно ${free.length} из 5</summary>` +
        free.map((i) => cardHTML(i, Object.assign(mc(i), { blank: true }))).join("") +
        `</details>`
      : `<div class="sm-focus-empty">Все 5 целей месяца заняты ✓</div>`);
    return out;
  }

  function render() {
    if (!root) return;
    const cfgs = {
      day: [cardHTML(0, { emoji: "🦌", caption: "Антилопа дня — главная задача", color: "#E30613", rows: 2,
        placeholder: "Если сегодня сделать только ОДНО дело — то какое?" })],
      week: [
        cardHTML(0, { emoji: "🎯", caption: "Цель недели №1", color: "var(--accent,#E30613)", rows: 2,
          placeholder: "Первая главная цель недели", subtasks: true }),
        cardHTML(1, { emoji: "🎯", caption: "Цель недели №2", color: "#9A9A9A", rows: 2,
          placeholder: "Вторая главная цель недели", subtasks: true }),
      ],
      month: monthCards(),
    };

    root.innerHTML = `
      <div class="sm-focus">
        <div class="sm-focus-tabs">
          ${[["day", "День"], ["week", "Неделя"], ["month", "Месяц"]].map(([k, t]) =>
            `<button class="sm-tab${tab === k ? " sm-tab-on" : ""}" data-tab="${k}">${t}</button>`).join("")}
        </div>
        <div class="sm-focus-nav">
          <button class="sm-nav" data-shift="-1">‹</button>
          <div class="sm-focus-label">${SixMin.esc(label())}</div>
          <button class="sm-nav" data-shift="1">›</button>
          <button class="sm-ib" data-info="focus" aria-label="Как это работает">i</button>
        </div>
        ${cfgs[tab].join("")}
      </div>`;

    root.querySelector('[data-info="focus"]')?.addEventListener("click", () => SixMin.info("Фокус",
      "<p><b>День:</b> «Антилопа» — ОДНА главная задача дня (львица не гонится за всеми антилопами сразу). <b>Неделя:</b> две главные цели, у каждой — подзадачи с чекбоксами ☐/☑ (выполненные зачёркиваются). <b>Месяц:</b> до пяти целей, у каждой — свои подзадачи с чекбоксами.</p>" +
      "<p>Текст сохраняется сам через секунду после того, как вы перестали печатать. ⬜/✅ справа — отметить выполненным. Стрелки ‹ › листают дни / недели / месяцы.</p>" +
      "<p><b>Месяц без простыни:</b> в списке видны только заполненные цели, а пустые слоты спрятаны в спойлер «➕ Добавить цель месяца»: раскрыли, написали — цель уехала в общий список.</p>"));
    root.querySelectorAll("[data-tab]").forEach((b) =>
      b.addEventListener("click", () => { tab = b.dataset.tab; moveIdx = null; refresh(); }));
    // v0.8.16: запоминаем, раскрыт ли спойлер добавления целей месяца
    const addDet = root.querySelector(".sm-focus-add");
    if (addDet) addDet.addEventListener("toggle", () => { addOpen = addDet.open; });
    root.querySelectorAll("[data-shift]").forEach((b) =>
      b.addEventListener("click", () => shift(Number(b.dataset.shift))));
    root.querySelectorAll("[data-done]").forEach((b) =>
      b.addEventListener("click", () => toggleDone(Number(b.dataset.done))));
    // v0.8.14: перенос цели недели/месяца в другой период
    root.querySelectorAll("[data-mv]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = Number(b.dataset.mv);
        if (moveIdx === i) moveIdx = null;
        else { moveIdx = i; moveOff = 1; }
        render();
      }));
    root.querySelectorAll("[data-mvclose]").forEach((b) =>
      b.addEventListener("click", () => { moveIdx = null; render(); }));
    root.querySelectorAll("[data-mvshift]").forEach((b) =>
      b.addEventListener("click", () => {
        moveOff = Math.max(-52, Math.min(52, moveOff + Number(b.dataset.mvshift)));
        render();
      }));
    root.querySelectorAll("[data-mvgo]").forEach((b) =>
      b.addEventListener("click", () => moveGo(Number(b.dataset.mvgo))));
    root.querySelectorAll(".sm-focus-title").forEach((t) =>
      t.addEventListener("input", () => saveTitle(Number(t.dataset.idx), t.value)));
    root.querySelectorAll(".sm-sub-input").forEach((inp) => {
      inp.addEventListener("input", () => {
        const idx = Number(inp.dataset.idx);
        const g = goals.find((x) => x.goal_index === idx);
        const subs = normSubs(g?.subtasks);
        const si = Number(inp.dataset.si);
        if (!subs[si]) subs[si] = { text: "", done: false };
        subs[si].text = inp.value;
        saveSubtasks(idx, subs);
      });
    });
    root.querySelectorAll("[data-subtog]").forEach((b) =>
      b.addEventListener("click", async () => {
        const [idx, si] = b.dataset.subtog.split(":").map(Number);
        const g = goals.find((x) => x.goal_index === idx);
        const subs = normSubs(g?.subtasks);
        if (!subs[si]) return;
        subs[si].done = !subs[si].done;
        goals = goals.map((x) => x.goal_index === idx ? { ...x, subtasks: subs } : x);
        render();
        await persistSubs(idx, subs);
      }));
    root.querySelectorAll(".sm-sub-del").forEach((b) =>
      b.addEventListener("click", async () => {
        const idx = Number(b.dataset.idx);
        const g = goals.find((x) => x.goal_index === idx);
        const subs = normSubs(g?.subtasks);
        subs.splice(Number(b.dataset.si), 1);
        goals = goals.map((x) => x.goal_index === idx ? { ...x, subtasks: subs } : x);
        render();
        await persistSubs(idx, subs);
      }));
    root.querySelectorAll(".sm-sub-add").forEach((b) =>
      b.addEventListener("click", async () => {
        const idx = Number(b.dataset.idx);
        const g = await ensureGoal(idx);
        const subs = [...normSubs(g.subtasks), { text: "", done: false }];
        goals = goals.map((x) => x.goal_index === idx ? { ...x, subtasks: subs } : x);
        render();
        const inputs = root.querySelectorAll(`.sm-sub-input[data-idx="${idx}"]`);
        inputs[inputs.length - 1]?.focus();
      }));
  }

  const moveGo = SixMin.debounce(async (index) => {
    const g = goals.find((x) => x.goal_index === index);
    if (!g?.id) { SixMin.toast("Сначала напишите цель — пустую переносить некуда"); return; }
    await saveTitle(index, g.title || "");
    const d = moveTargetDate();
    const p = { type: tab === "week" ? "week" : "month", key: tab === "week" ? SixMin.weekKeyISO(d) : SixMin.monthKey(d) };
    if (p.key === periodOf(tab).key) { SixMin.toast("Это текущий период — цель уже здесь"); return; }
    const uid = await SixMin.uid();
    const { data: busy } = await SixMin.sb().from("focus_goals").select("goal_index")
      .eq("user_id", uid).eq("period_type", p.type).eq("period_key", p.key);
    const taken = new Set((busy || []).map((x) => x.goal_index));
    let gi = g.goal_index;
    while (taken.has(gi)) gi += 1; // в новом периоде место могло быть занято
    const { error } = await SixMin.sb().from("focus_goals")
      .update({ period_type: p.type, period_key: p.key, goal_index: gi, updated_at: new Date().toISOString() })
      .eq("id", g.id);
    if (error) { SixMin.toast("Не удалось перенести: " + error.message); return; }
    moveIdx = null;
    SixMin.toast("Цель перенесена: " + moveTargetLabel() + (gi !== g.goal_index ? " (встала на свободное место №" + (gi + 1) + ")" : ""));
    await refresh();
  }, 350);

  async function refresh() { await load(); render(); }

  function mount(container) {
    root = typeof container === "string" ? document.querySelector(container) : container;
    injectStyles();
    try { render(); } catch (e) { console.error("[v02] skeleton render", e); } // каркас сразу, данные подъедут
    refresh();
  }

  function injectStyles() {
    if (document.getElementById("sixmin-focus-css")) return;
    const css = document.createElement("style");
    css.id = "sixmin-focus-css";
    css.textContent = `
      .sm-focus{--bg:rgba(128,128,128,.12);font-family:system-ui,sans-serif}
      .sm-focus-tabs{display:flex;gap:6px;background:var(--bg);padding:4px;border-radius:12px;margin-bottom:14px}
      .sm-tab{flex:1;padding:9px;border:0;border-radius:9px;background:transparent;color:inherit;
              font-size:14px;font-weight:600;cursor:pointer;opacity:.65}
      .sm-tab-on{background:#fff;color:#111;opacity:1;box-shadow:0 1px 4px rgba(0,0,0,.15)}
      [data-theme="dark"] .sm-tab-on{background:#2a2a33;color:#fff}
      .sm-focus-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
      .sm-focus-label{font-weight:600;font-size:15px;text-transform:capitalize}
      .sm-focus-card{border:1px solid var(--bg);border-left:4px solid var(--ac);border-radius:14px;
                     padding:14px;margin-bottom:12px;background:transparent}
      .sm-focus-done{opacity:.55}
      .sm-focus-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
      .sm-focus-emoji{font-size:18px}
      .sm-focus-cap{font-size:12px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;opacity:.7;flex:1}
      .sm-focus-check{border:0;background:transparent;font-size:18px;cursor:pointer}
      .sm-focus-title{width:100%;border:0;background:transparent;color:inherit;font:600 16px/1.45 system-ui;
                      resize:none;outline:none;box-sizing:border-box}
      .sm-focus-title::placeholder{opacity:.4;font-weight:400}
      .sm-focus-subs{margin-top:10px;border-top:1px dashed var(--bg);padding-top:8px}
      .sm-focus-empty{font-size:13px;opacity:.6;margin:0 2px 10px}
      .sm-focus-add{border:1px dashed rgba(128,128,128,.35);border-radius:14px;
                      padding:2px 12px 6px;margin-bottom:12px}
      .sm-focus-add>summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px;
                            padding:11px 2px;font-size:13.5px;font-weight:700;opacity:.9}
      .sm-focus-add>summary::-webkit-details-marker{display:none}
      .sm-focus-add>summary::after{content:"⌄";margin-left:auto;font-size:16px;opacity:.7;
                                  transition:transform .18s}
      .sm-focus-add[open]>summary::after{transform:rotate(180deg)}
      .sm-focus-add .sm-focus-card{background:rgba(128,128,128,.06);margin-bottom:10px}
      .sm-sub-row{display:flex;align-items:center;gap:6px;margin-bottom:4px}
      .sm-sub-check{border:0;background:transparent;color:var(--accent,#E30613);font-size:17px;cursor:pointer;padding:0;line-height:1;flex-shrink:0}
      .sm-sub-done .sm-sub-input{text-decoration:line-through;opacity:.5}
      .sm-sub-input{flex:1;border:0;background:transparent;color:inherit;font:14px system-ui;outline:none;padding:4px 0}
      .sm-sub-del{border:0;background:transparent;color:inherit;opacity:.3;cursor:pointer;font-size:15px}
      .sm-sub-del:hover{opacity:.9;color:#E30613}
      .sm-sub-add{border:0;background:transparent;color:var(--accent,#E30613);font-size:13px;font-weight:600;cursor:pointer;padding:6px 0 0}
      .sm-nav{width:36px;height:36px;border-radius:10px;border:1px solid var(--bg);background:transparent;
              color:inherit;font-size:20px;cursor:pointer;line-height:1}
      .sm-move-btn{border:0;background:transparent;color:inherit;opacity:.45;font-size:15px;cursor:pointer;padding:2px 4px;line-height:1}
      .sm-move-btn:hover{opacity:1;color:var(--accent,#E30613)}
      .sm-move-pick{margin-top:10px;border-top:1px dashed var(--bg);padding-top:10px;display:flex;flex-direction:column;gap:8px}
      .sm-move-cap{font-size:12px;font-weight:600;opacity:.75}
      .sm-move-nav{display:flex;align-items:center;gap:8px}
      .sm-move-label{flex:1;text-align:center;font-weight:600;font-size:14px;text-transform:capitalize}
      .sm-move-arr{width:32px;height:32px;font-size:17px;flex-shrink:0}
      .sm-move-acts{display:flex;gap:8px}
      .sm-move-ok{flex:1;border:0;border-radius:10px;background:var(--accent,#E30613);color:#fff;
                  font:600 13px system-ui;padding:9px;cursor:pointer}
      .sm-move-cancel{border:1px solid var(--bg);border-radius:10px;background:transparent;color:inherit;
                      font:13px system-ui;padding:9px 14px;cursor:pointer;opacity:.7}`;
    document.head.appendChild(css);
  }

  window.SixMinFocus = { mount, refresh };
})();
window.__v02stage = "after-sixmin-focus"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-focus");

// app/js/sixmin-tasks.js — v0.2.1: To-Do с переносом, ДВЕ области: личная и рабочая
//  - чеклист на сегодня, «→ завтра» / свайп влево, блок просроченных
//  - блок «Запланировано впереди» (все будущие, включая перенесённые, ↪N)
//  - рабочая копия (area='work'): свой экран + карточка статистики
//    (сделано сегодня / за неделю / рабочая серия / переносы)
// API: SixMinTasks.mount(container, { area: 'personal'|'work', stats: bool })

(function () {
  // v0.6.6: категории без «детсадовских» эмодзи — строгие цветные точки-маркеры
  const KINDS_PERSONAL = [
    { id: "cream", emoji: "", dot: "#E30613", label: "Первостепенные" },
    { id: "cherry", emoji: "", dot: "#9A9A9A", label: "Второстепенные" },
    { id: "fun", emoji: "", dot: "#E8B4B8", label: "Отдых" },
  ];
  const KINDS_WORK = [
    { id: "high", emoji: "⚡", label: "Приоритетные" },
    { id: "low", emoji: "📋", label: "Второстепенные" },
  ];
  const kindMark = (k) => (k && k.dot) ? `<span class="sm-dot" style="background:${k.dot}"></span>` : ((k && k.emoji) || "");

  function createInstance(opts) {
    opts = opts || {};
    const AREA = opts.area === "work" ? "work" : "personal";
    const SHOW_STATS = !!opts.stats;

    const KINDS = AREA === "work" ? KINDS_WORK : KINDS_PERSONAL;
    const kindOf = (t) => KINDS.find((k) => k.id === (t.kind || KINDS[0].id)) || KINDS[0];
    let root = null, todayKey = null, newKind = KINDS[0].id;
    let today = [], overdue = [], upcoming = [], all = [], onb = [];
    // v0.8.19: шаги онбординга новичка круга (сеются seedOnboarding, v0.8.11/0.8.16)
    const IS_ONB = (t) => /^Онбординг ·/.test(t.title || "");
    // v0.8.26: ВСЕ видимые строки задач, включая блок онбординга: обработчики кнопок
    // раньше искали только в today/overdue/upcoming и не находили шаги блока —
    // чекбоксы «🎓» выглядели мёртвыми (скрин 16).
    const rowsAll = () => [...onb, ...today, ...overdue, ...upcoming];
    // комментарии + вложения: общий компонент v0.6 (тот же, что в кругах)
    const CM = SixMinComments.create({
      render: () => render(),
      scope: () => null,   // личная/рабочая задача → приватная папка <uid>/t/...
      findTask: (id) => rowsAll().find((x) => x.id === id),
    });

    async function load() {
      const uid = await SixMin.uid().catch(() => "00000000-0000-0000-0000-000000000000");
      todayKey = await SixMin.todayKey();
      const { data } = await SixMin.sb().from("tasks").select("*")
        .eq("user_id", uid).eq("area", AREA)
        .is("circle_id", null) // v0.8.30: круговые (общие и баунти) не дублируются в Трекер
        .order("due_date", { ascending: true }).order("position", { ascending: true })
        .limit(400);
      all = data || [];
      // v0.8.19: неполные шаги онбординга не теряются в общем списке —
      // их рисует отдельный блок onbBlock() сверху карточки.
      onb = all.filter((t) => !t.completed && IS_ONB(t));
      const rest = all.filter((t) => t.completed || !IS_ONB(t));
      const open = rest.filter((t) => !t.completed);
      today = [...open.filter((t) => t.due_date === todayKey),
               ...rest.filter((t) => t.completed && t.due_date === todayKey)];
      overdue = open.filter((t) => t.due_date < todayKey);
      upcoming = open.filter((t) => t.due_date > todayKey);
    const ids = rowsAll().map((t) => t.id);
    await CM.loadCounts(ids);
    }

    // ---------- статистика области (для рабочего экрана) ----------
    function statsHTML() {
      if (!todayKey) return ""; // rev.9: первый рендер до загрузки не должен падать
      const doneDates = all.filter((t) => t.completed && t.completed_at)
        .map((t) => SixMin.fmtKey(new Date(t.completed_at)));
      const doneSet = {};
      doneDates.forEach((d) => { doneSet[d] = (doneSet[d] || 0) + 1; });
      const doneToday = doneSet[todayKey] || 0;
      const week = SixMin.weekKeys(0);
      const doneWeek = week.reduce((s, d) => s + (doneSet[d] || 0), 0);
      let streak = 0;
      const cur = SixMin.parseKey(todayKey);
      if (!doneSet[todayKey]) cur.setDate(cur.getDate() - 1);
      while (doneSet[SixMin.fmtKey(cur)]) { streak++; cur.setDate(cur.getDate() - 1); }
      const postponed = all.filter((t) => !t.completed)
        .reduce((s, t) => s + (t.postpone_count || 0), 0);
      return `
        <div class="sm-stats-row">
          <div class="sm-stats-card"><div class="sm-stats-num">${doneToday}</div><div class="sm-stats-cap">сделано сегодня</div></div>
          <div class="sm-stats-card"><div class="sm-stats-num">${doneWeek}</div><div class="sm-stats-cap">за неделю</div></div>
          <div class="sm-stats-card"><div class="sm-stats-num">🔥 ${streak}</div><div class="sm-stats-cap">дней подряд</div></div>
          <div class="sm-stats-card"><div class="sm-stats-num">↪ ${postponed}</div><div class="sm-stats-cap">переносов всего</div></div>
        </div>`;
    }

    async function add(title, extra) {
      extra = extra || {};
      const uid = await SixMin.uid();
      const { error } = await SixMin.sb().from("tasks").insert({
        user_id: uid, title: title.trim(), due_date: extra.due || todayKey,
        due_time: extra.dueTime || null, remind_at: extra.remindAt || null,
        area: AREA,
        kind: newKind, position: today.length,
      });
      if (error) { SixMin.toast("Ошибка: " + error.message); return; }
      await load(); render();
    }

    async function toggle(t) {
      t.completed = !t.completed;
      t.completed_at = t.completed ? new Date().toISOString() : null;
      render();
      await SixMin.sb().from("tasks")
        .update({ completed: t.completed, completed_at: t.completed_at }).eq("id", t.id);
      await load(); render();
    }

    async function postpone(t, days = 1) {
      const d = SixMin.parseKey(t.due_date);
      d.setDate(d.getDate() + days);
      const newKey = SixMin.fmtKey(d);
      const patch = {
        due_date: newKey,
        postponed_from: t.postponed_from || t.due_date,
        postpone_count: (t.postpone_count || 0) + 1,
      };
      today = today.filter((x) => x.id !== t.id);
      overdue = overdue.filter((x) => x.id !== t.id);
      upcoming = upcoming.filter((x) => x.id !== t.id);
      render();
      SixMin.toast(days === 1 ? "Перенесено на завтра ↪" : `Перенесено на ${newKey.split("-").reverse().slice(0, 2).join(".")} ↪`);
      await SixMin.sb().from("tasks").update(patch).eq("id", t.id);
    }

    async function moveToday(t) {
      await SixMin.sb().from("tasks").update({ due_date: todayKey }).eq("id", t.id);
      SixMin.toast("Вернулась на сегодня ✅");
      await load(); render();
    }

    function upcomingHTML() {
      if (!upcoming.length) return "";
      const tom = new Date(); tom.setDate(tom.getDate() + 1);
      const tomKey = SixMin.fmtKey(tom);
      const groups = {};
      for (const t of upcoming) (groups[t.due_date] = groups[t.due_date] || []).push(t);
      let out = '<div class="sm-upcoming"><div class="sm-up-head">📅 Запланировано впереди: ' + upcoming.length + '</div>';
      for (const d of Object.keys(groups).sort()) {
        const label = d === tomKey ? "Завтра"
          : SixMin.parseKey(d).toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });
        out += '<div class="sm-up-day">' + SixMin.esc(label) + '</div><ul class="sm-task-list">';
        for (const t of groups[d]) out += taskRow(t, false, true);
        out += '</ul>';
      }
      return out + '</div>';
    }

    // v0.8.19: витрина шагов новичка: выполнено X из Y, осталось Z; отмечатся тем же
    // делегированным обработчиком задач (data-act="toggle"), удаляются так же.
    function onbBlock() {
      if (AREA !== "personal" || !onb.length) return "";
      const done = all.filter((t) => t.completed && IS_ONB(t)).length;
      const total = done + onb.length;
      return `
      <div class="sm-onb">
        <div class="sm-onb-cap">🎓 Шаги новичка круга: выполнено ${done} из ${total}, осталось ${onb.length}</div>
        <div class="sm-onb-hint">Это личные подсказки-шаги: отмечайте ☑ по мере выполнения.
          Блок исчезнет, когда выполните все шаги.</div>
        <ul class="sm-task-list">${onb.map((t) => taskRow(t, false, false)).join("")}</ul>
      </div>`;
    }

    async function remove(t) {
      // v0.8.18: сначала сервер с проверкой (та же причина, что у круговых удалений)
      // v0.8.21: circle_task_del сам проверяет владение (свои) или членство (круговые)
      const { error, data } = await SixMin.sb().rpc("circle_task_del", { p_task: t.id });
      if (error || data !== "ok") {
        console.error("task delete:", error || data);
        SixMin.toast(data === "not_owner" ? "Это не ваша задача — удалить нельзя."
          : "Не удалось удалить задачу: " + (error ? error.message : String(data)));
        await refresh(); return;
      }
      today = today.filter((x) => x.id !== t.id);
      overdue = overdue.filter((x) => x.id !== t.id);
      upcoming = upcoming.filter((x) => x.id !== t.id);
      render();
    }

    async function postponeAllOverdue() {
      // переносим все просроченные ТЕКУЩЕЙ области
      let n = 0;
      for (const t of overdue) {
        await SixMin.sb().from("tasks").update({
          due_date: todayKey,
          postponed_from: t.postponed_from || t.due_date,
          postpone_count: (t.postpone_count || 0) + 1,
        }).eq("id", t.id);
        n++;
      }
      SixMin.toast(`Перенесено на сегодня: ${n}`);
      await load(); render();
    }


    function taskRow(t, isOverdue, isUpcoming) {
      return `
      <li class="sm-task-wrap" data-id="${t.id}">
      <div class="sm-task${t.completed ? " sm-task-done" : ""}">
        <div class="sm-task-main">
          <button class="sm-task-check" data-act="toggle" data-id="${t.id}">${t.completed ? "☑" : "☐"}</button>
          <span class="sm-task-title" data-ren="${t.id}" title="Тапните, чтобы переименовать">${isUpcoming || isOverdue ? kindMark(kindOf(t)) + " " : ""}${t.title && t.title.trim() ? SixMin.esc(t.title) : "<i style='opacity:.5'>(без названия)</i>"}${t.postpone_count ? ` <em class="sm-task-moved" title="Переносов: ${t.postpone_count}">↪${t.postpone_count}</em>` : ""}</span>
          ${t.remind_at && !t.remind_sent_at && !t.completed ? `<span class="sm-task-rem-badge">⏰ ${String(t.remind_at).slice(8, 10)}.${String(t.remind_at).slice(5, 7)} ${String(t.remind_at).slice(11, 16)}</span>` : ""}
          ${isOverdue ? `<span class="sm-task-overdue-badge">${t.due_date.slice(8)}.${t.due_date.slice(5, 7)}${t.due_time ? " " + String(t.due_time).slice(0, 5) : ""}</span>` : ""}
        </div>
        <div class="sm-task-actions">
          ${!t.completed && !isUpcoming ? `<button class="sm-task-btn sm-task-postpone" data-act="postpone" data-id="${t.id}" title="Перенести на завтра">→ завтра</button>` : ""}
          ${isUpcoming ? `<button class="sm-task-btn sm-task-postpone" data-act="totoday" data-id="${t.id}">→ сегодня</button>` : ""}
          ${CM.buttonHTML(t)}
          <button class="sm-task-btn sm-task-del" data-act="del" data-id="${t.id}" title="Удалить">×</button>
        </div>
      </div>
      ${CM.panelHTML(t)}
      </li>`;
    }


    // v0.6.6 rev.5: ввод в форме добавления не должен стираться при перерисовке
    // (переключение категории, автообновление) — снимаем и возвращаем значения.
    function formKeyT(el) {
      // rev.10: уникальный ключ (scope по data-id карточки + собственный атрибут поля)
      const f = el.closest("form");
      const scope = el.closest("[data-id]") || f;
      const scopeKey = scope ? (scope.dataset?.id || scope.dataset?.role || scope.className) : "noform";
      const own = el.dataset.gidx || el.dataset.gsubin || el.name || el.id || el.placeholder || el.type;
      return scopeKey + "|" + own;
    }
    function snapFormsT() { const m = new Map(); if (!root) return m; root.querySelectorAll("input,textarea,select").forEach((el) => { if (el.hasAttribute("data-cminput")) return; m.set(formKeyT(el), el.value); }); return m; }
    function restoreFormsT(m) { if (!m || !m.size || !root) return; root.querySelectorAll("input,textarea,select").forEach((el) => { if (el.hasAttribute("data-cminput")) return; const k = formKeyT(el); if (m.has(k) && document.activeElement !== el) el.value = m.get(k); }); }

    function render() {
      if (!root) return;
      const snap = snapFormsT();
      const doneCount = today.filter((t) => t.completed).length;
      const headLabel = AREA === "work" ? "Рабочие задачи на сегодня" : "Задачи на сегодня";
      const ph = AREA === "work" ? "Новая рабочая задача…" : "Новая задача…";
      root.innerHTML = `
      <div class="sm-tasks">
        ${onbBlock()}
        ${SHOW_STATS ? statsHTML() : ""}
        <div class="sm-kind-row">
          ${KINDS.map((k) => `<button type="button" class="sm-kind-chip${newKind === k.id ? " on" : ""}" data-kind="${k.id}">${kindMark(k)} ${k.label}</button>`).join("")}
        </div>
        <form class="sm-task-add">
          <textarea class="sm-task-add-input" rows="1" maxlength="120" placeholder="${ph}" autocomplete="off"></textarea>
          <button class="sm-task-add-btn" type="submit">+</button>
          <div class="sm-task-add-opts">
            <label class="sm-add-lbl">Дедлайн<span class="sm-add-wrap"><input type="date" class="sm-add-due"><i class="sm-add-hint">Укажите дату</i></span><span class="sm-add-wrap"><input type="time" class="sm-add-duetime"><i class="sm-add-hint">Укажите время</i></span></label>
            <label class="sm-add-lbl">Напоминание<span class="sm-add-wrap"><input type="datetime-local" class="sm-add-remind"><i class="sm-add-hint">Укажите дату и время</i></span></label>
          </div>
        </form>
        ${overdue.length ? `
        <div class="sm-overdue">
          <div class="sm-overdue-head">⚠️ Не завершено раньше (${overdue.length})
            <button class="sm-overdue-all" data-act="postpone-all">Перенести всё на сегодня</button>
          </div>
          <ul class="sm-task-list">${overdue.map((t) => taskRow(t, true, false)).join("")}</ul>
        </div>` : ""}
        <div class="sm-tasks-head">
          <span>${headLabel}</span>
          <span class="sm-tasks-count">${doneCount}/${today.length}</span>
          <button class="sm-ib" data-info="tasks" aria-label="Как это работает">i</button>
        </div>
        ${KINDS.map((k, ki) => {
          // v0.8.20: задача с типом, которого нет в списке типов области (например,
          // старый посев онбординга с kind="high" в личных), попадает в первую группу,
          // а не в невидимость (кейс 18.10: счётчик 0/6 при «Список пуст»).
          const rows = today.filter((t) => (t.kind || KINDS[0].id) === k.id ||
            (ki === 0 && !KINDS.some((kk) => kk.id === t.kind)));
          if (!rows.length) return "";
          return `<div class="sm-kind-head">${kindMark(k)} ${k.label}</div>
            <ul class="sm-task-list">${rows.map((t) => taskRow(t, false, false)).join("")}</ul>`;
        }).join("") ||
          `<ul class="sm-task-list"><li class="sm-tasks-empty">Список пуст. Добавьте первую задачу 👇<br><small>Свайпните задачу влево или нажмите «→ завтра», чтобы перенести.</small></li></ul>`}
        ${upcomingHTML()}
      </div>`;

      root.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = b.dataset.id;
        const t = rowsAll().find((x) => x.id === id);
        if (b.dataset.act === "toggle" && t) toggle(t);
        if (b.dataset.act === "postpone" && t) postpone(t, 1);
        if (b.dataset.act === "totoday" && t) moveToday(t);
        if (b.dataset.act === "del" && t) remove(t);
        if (b.dataset.act === "postpone-all") postponeAllOverdue();
      }));

      root.querySelector('[data-info="tasks"]')?.addEventListener("click", () => SixMin.info(
        AREA === "work" ? "Рабочие задачи" : "Задачи",
        (AREA === "work"
          ? "<p>Рабочий список <b>не смешивается</b> с личным. Задачи делятся на <b>⚡ Приоритетные</b> и <b>📋 Второстепенные</b> — переключатель над формой добавления. Быстро поймать задачу можно из Telegram: <code>/work текст</code> (попадёт в приоритетные на сегодня).</p><p>Карточки сверху — рабочая статистика: сделано сегодня и за неделю, 🔥 серия дней с выполненными задачами, ↪ суммарные переносы.</p>"
          : "<p>Чек-лист на сегодня в трёх категориях, по образцу бумажного блокнота: <b>Первостепенные</b>, <b>Второстепенные</b> и <b>Отдых</b> (цветные точки-маркеры) — переключатель над формой. Квадратик слева — выполнить; «→ завтра» или свайп влево — перенести (↪N — сколько раз переносили: больше двух — пора разбить задачу или удалить).</p><p>В форме добавления можно задать <b>дедлайн</b> (дата и время) и <b>напоминание</b> (дата и время): бот пришлёт напоминание о задаче в Telegram в назначенный час (значок ⏰ у задачи).</p>") +
        "<p><b>💬 у каждой задачи</b> — комментарии и вложения: 📎 фото/документ и 🎙 голосовое (хранятся в вашем приватном облаке, видите только вы). Блок <b>«Запланировано впереди»</b> показывает все будущие задачи по датам, включая перенесённые; «→ сегодня» возвращает задачу в сегодняшний список.</p>"));

      root.querySelectorAll("[data-ren]").forEach((sp) =>
      sp.addEventListener("click", (e) => {
        e.stopPropagation();
        const t = rowsAll().find((x) => x.id === sp.dataset.ren);
        if (!t || sp.querySelector("input")) return;
        // v0.6.6: инлайн-переименование вместо системного prompt (удобно для длинных текстов)
        const input = document.createElement("input");
        input.className = "sm-task-ren";
        input.value = t.title || "";
        input.maxLength = 120;
        sp.replaceWith(input);
        input.focus();
        input.select();
        let done = false;
        const save = async () => {
          if (done) return;
          done = true;
          const v = input.value.trim();
          if (v && v !== t.title) {
            t.title = v;
            await SixMin.sb().from("tasks").update({ title: v }).eq("id", t.id);
          }
          render();
        };
        input.addEventListener("blur", save);
        input.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") { ev.preventDefault(); input.blur(); }
          if (ev.key === "Escape") { done = true; render(); }
        });
      }));
    root.querySelectorAll("[data-kind]").forEach((b) =>
        b.addEventListener("click", () => { newKind = b.dataset.kind; render(); }));
      const addForm = root.querySelector(".sm-task-add");
      const addInp = root.querySelector(".sm-task-add-input");
      // v0.6.6: авторесайз поля новой задачи (до ~4 строк)
      addInp?.addEventListener("input", () => {
        addInp.style.height = "auto";
        addInp.style.height = Math.min(addInp.scrollHeight, 96) + "px";
      });
      // rev.8: прозрачные подсказки в полях даты/времени гаснут, когда значение выбрано
      root.querySelectorAll(".sm-add-wrap").forEach((w) => {
        const inp = w.querySelector("input");
        const set = () => w.classList.toggle("filled", !!inp.value);
        inp.addEventListener("input", set);
        inp.addEventListener("change", set);
        set();
      });
      addForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        // v0.6.6: FIX — значение захватывается ДО очистки (раньше задача создавалась пустой)
        const v = addInp.value;
        if (!v.trim()) return;
        const due = root.querySelector(".sm-add-due")?.value || "";
        const dueTime = root.querySelector(".sm-add-duetime")?.value || "";
        const remind = root.querySelector(".sm-add-remind")?.value || "";
        addInp.value = "";
        addInp.style.height = "auto";
        const dt = root.querySelector(".sm-add-duetime"); if (dt) dt.value = "";
        const rm = root.querySelector(".sm-add-remind"); if (rm) rm.value = "";
        add(v, { due, dueTime, remindAt: remind ? new Date(remind).toISOString() : null });
        addInp.focus();
      });

      // комментарии и вложения (общий компонент v0.6)
      CM.wire(root);
      restoreFormsT(snap);

    // свайп влево = перенести на завтра
      root.querySelectorAll(".sm-task-wrap").forEach((li) => {
        let x0 = null;
        li.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
        li.addEventListener("touchmove", (e) => {
          if (x0 === null) return;
          const dx = e.touches[0].clientX - x0;
          li.style.transform = dx < 0 ? `translateX(${Math.max(dx, -90)}px)` : "";
          li.style.opacity = dx < -60 ? ".6" : "1";
        }, { passive: true });
        li.addEventListener("touchend", (e) => {
          const dx = (e.changedTouches[0].clientX - (x0 ?? 0));
          li.style.transform = ""; li.style.opacity = "";
          if (dx < -70) {
            const t = rowsAll().find((x) => x.id === li.dataset.id);
            if (t && !t.completed) postpone(t, 1);
          }
          x0 = null;
        });
      });
    }

    async function refresh() { await load(); render(); }

    function mount(container) {
      root = typeof container === "string" ? document.querySelector(container) : container;
      injectStyles();
      try { render(); } catch (e) { console.error("[v02] skeleton render", e); }
      refresh();
    }

    function injectStyles() {
      if (document.getElementById("sixmin-tasks-css")) return;
      const css = document.createElement("style");
      css.id = "sixmin-tasks-css";
      css.textContent = `
      .sm-tasks{--bg:rgba(128,128,128,.12);font-family:system-ui,sans-serif}
      .sm-onb{border:1px solid rgba(227,6,19,.5);background:rgba(227,6,19,.10);
              border-radius:14px;padding:10px 12px;margin-bottom:12px}
      .sm-onb-cap{font-weight:800;font-size:13.5px;margin-bottom:6px}
      .sm-onb-hint{font-size:12px;opacity:.8;margin-bottom:8px;line-height:1.45}
      .sm-onb .sm-task-list{margin:0}
      .sm-stats-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}
      .sm-stats-card{border:1px solid rgba(128,128,128,.18);border-radius:12px;padding:10px;text-align:center}
      .sm-stats-num{font-size:19px;font-weight:800}
      .sm-stats-cap{font-size:11px;opacity:.6;margin-top:2px}
      .sm-tasks-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:700;font-size:15px;margin-bottom:8px}
      .sm-tasks-count{opacity:.6;font-weight:500;font-size:13px;flex:1;text-align:right}
      .sm-task-list{list-style:none;margin:0;padding:0}
      .sm-task-wrap{margin-bottom:6px}
      .sm-task{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;
               border-radius:12px;background:var(--bg);transition:transform .15s,opacity .15s;
               touch-action:pan-y}
      .sm-task-cm b{font-size:10px;background:var(--accent,#E30613);color:#fff;border-radius:8px;padding:1px 5px;margin-left:2px;vertical-align:middle}
      .sm-cm-panel{border:1px solid rgba(128,128,128,.2);border-top:0;border-radius:0 0 12px 12px;
                   padding:10px;background:rgba(128,128,128,.06)}
      .sm-cm{padding:7px 2px;border-bottom:1px dashed rgba(128,128,128,.18)}
      .sm-cm:last-of-type{border-bottom:0}
      .sm-cm-head{font-size:11px;opacity:.55;margin-bottom:2px}
      .sm-cm-body{font-size:13.5px;line-height:1.45;white-space:pre-wrap}
      .sm-cm-chip{border:1px solid rgba(127,111,240,.4);color:inherit;background:var(--accent-soft,#FDE9E9);border-radius:999px;
                  padding:4px 10px;font-size:12px;cursor:pointer;margin:4px 4px 0 0}
      .sm-cm-pending b{color:#E30613;margin-left:4px}
      .sm-cm-empty{font-size:12.5px;opacity:.6;padding:4px 2px}
      .sm-cm-add{display:flex;gap:6px;align-items:center;margin-top:8px}
      .sm-cm-input{flex:1;padding:9px 12px;border-radius:10px;border:1px solid rgba(128,128,128,.25);
                   background:transparent;color:inherit;font-size:13.5px;outline:none;min-width:0}
      .sm-cm-btn{border:0;background:transparent;font-size:17px;cursor:pointer;padding:6px;border-radius:8px}
      .sm-cm-send{color:var(--accent,#E30613);font-weight:700}
      .sm-task-main{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
      .sm-task-check{border:0;background:transparent;font-size:20px;cursor:pointer;color:var(--accent,#E30613);line-height:1;padding:0}
      .sm-task-title{font-size:14.5px;line-height:1.35;white-space:normal;word-wrap:break-word;overflow-wrap:break-word;overflow:visible;flex:1;min-width:0}
      .sm-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:middle}
      .sm-task-rem-badge{font-size:10px;background:rgba(227,6,19,.15);color:#E30613;padding:2px 6px;border-radius:6px;font-weight:700;white-space:nowrap;margin-left:6px}
      .sm-task-ren{flex:1;font:inherit;font-size:14.5px;background:var(--inset,#1c1c1c);border:1px solid var(--line,#333);border-radius:8px;padding:4px 8px;color:inherit;min-width:0}
      .sm-task-done .sm-task-title{text-decoration:line-through;opacity:.5}
      .sm-task-moved{font-style:normal;font-size:11px;color:var(--accent,#E30613);font-weight:700}
      .sm-task-overdue-badge{font-size:10px;background:var(--accent-soft,#FDE9E9);color:#E30613;padding:2px 6px;border-radius:6px;font-weight:700;white-space:nowrap}
      .sm-task-actions{display:flex;gap:3px;flex-shrink:0}
      /* v0.6.6 rev.7: на узких экранах заголовок задачи получает всю ширину,
         а компактные кнопки уходят на вторую строку справа */
      @media (max-width:480px){
        .sm-task{flex-wrap:wrap}
        .sm-task-main{flex:1 1 100%;order:1}
        .sm-task-actions{order:2;margin-left:auto}
        .sm-task-btn{padding:4px 7px;font-size:11px}
        .sm-task-check{font-size:18px}
        .sm-task-overdue-badge{font-size:9px;padding:1px 5px}
        .sm-cm-btn{font-size:14px;padding:3px}
        .sm-task-del{font-size:14px}
      }
      .sm-task-btn{border:0;border-radius:8px;cursor:pointer;font-size:12px;padding:6px 8px;background:transparent;color:inherit}
      .sm-task-postpone{color:var(--accent,#E30613);font-weight:700;background:var(--accent-soft,#FDE9E9)}
      .sm-task-del{opacity:.4;font-size:15px}
      .sm-task-del:hover{opacity:1;color:#E30613}
      .sm-tasks-empty{padding:22px 10px;text-align:center;opacity:.55;font-size:14px;line-height:1.6;list-style:none}
      .sm-overdue{border:1px solid #E3061344;border-radius:14px;padding:10px;margin-bottom:14px;background:#E306130d}
      .sm-overdue-head{display:flex;justify-content:space-between;align-items:center;gap:8px;
                       font-size:13px;font-weight:700;color:#E30613;margin-bottom:8px;flex-wrap:wrap}
      .sm-overdue-all{border:0;background:#E30613;color:#fff;border-radius:8px;padding:6px 10px;
                      font-size:12px;font-weight:700;cursor:pointer}
      .sm-upcoming{margin-top:14px;border-top:1px dashed rgba(128,128,128,.25);padding-top:10px}
      .sm-up-head{font-size:13px;font-weight:700;opacity:.75;margin-bottom:4px}
      .sm-up-day{font-size:12px;font-weight:700;opacity:.55;margin:8px 0 4px;text-transform:capitalize}
      .sm-kind-row{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}
      .sm-kind-chip{border:1px solid rgba(128,128,128,.25);border-radius:999px;padding:6px 11px;font-size:12px;
                    background:transparent;color:inherit;cursor:pointer;opacity:.7}
      .sm-kind-chip.on{background:var(--accent,#E30613);border-color:var(--accent,#E30613);color:#fff;opacity:1}
      .sm-kind-head{font-size:12px;font-weight:700;opacity:.6;margin:10px 0 4px}
      .sm-task-add{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
      .sm-task-add-opts{display:flex;gap:8px;flex-wrap:wrap;width:100%}
      .sm-add-lbl{display:flex;align-items:center;gap:4px;font-size:11px;opacity:.85}
      .sm-add-lbl input{background:var(--inset,#1c1c1c);border:1px solid var(--line,#333);border-radius:8px;color:inherit;padding:4px 6px;font-size:12px;color-scheme:dark}
      .sm-add-wrap{position:relative;display:inline-block}
      .sm-add-hint{display:none;position:absolute;left:8px;top:50%;transform:translateY(-50%);font-style:normal;font-size:12px;opacity:.45;pointer-events:none;white-space:nowrap}
      /* rev.11: подсказки видны только на сенсорных устройствах (там нативной подсказки нет);
         на десктопе её показывает сам браузер (дд.мм.гггг) — без наложения текстов */
      @media (hover:none) and (pointer:coarse){
        .sm-add-hint{display:block}
        .sm-add-wrap.filled .sm-add-hint{display:none}
      }
      .sm-task-add-input{flex:1;padding:11px 14px;border-radius:12px;border:1px solid var(--bg);
                         background:transparent;color:inherit;font-size:14px;outline:none}
      .sm-task-add-input:focus{border-color:var(--accent,#E30613)}
      textarea.sm-task-add-input{resize:none;overflow:hidden;font:inherit;line-height:1.3}
      .sm-task-add-btn{width:44px;border-radius:12px;border:0;background:var(--accent,#E30613);color:#fff;font-size:22px;cursor:pointer}`;
      document.head.appendChild(css);
    }

    return { mount, refresh };
  }

  window.SixMinTasks = {
    mount: (container, opts) => createInstance(opts).mount(container),
  };
})();
window.__v02stage = "after-sixmin-tasks"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-tasks");

// app/js/sixmin-donetoday.js — v0.7.1: «Сегодня выполнено» на ПЕРВОМ экране (☀️ Сегодня)
//  Карточка-спойлер: сколько задач выполнено сегодня (личные 🍰🍒🎈 + рабочие ⚡📋),
//  полоса прогресса «N из M», а сам список сделанного — внутри спойлера (тап → раскрыть).
//  Данные: таблица tasks (completed_at = сегодня ИЛИ due_date = сегодня и completed).
//  Обновление: при тапе на вкладку «Сегодня» + каждые 45 с, пока вкладка открыта.
// API: SixMinDoneToday.mount(container)

(function () {
  const KIND_EMOJI = { cream: "🍰", cherry: "🍒", fun: "🎈", high: "⚡", low: "📋" };
  const POLL_MS = 45000;

  let root = null;
  let done = [];      // выполненные сегодня (хронологически)
  let openToday = 0;  // осталось на сегодня
  let wasOpen = false; // спойлер был раскрыт — не захлопываем при обновлении
  let started = false;

  function timeOf(iso) {
    try {
      return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return ""; }
  }

  async function load() {
    const uid = await SixMin.uid().catch(() => "00000000-0000-0000-0000-000000000000");
    const todayKey = await SixMin.todayKey();
    const sb = SixMin.sb();
    const [d, o] = await Promise.all([
      sb.from("tasks").select("*").eq("user_id", uid).eq("completed", true)
        .is("circle_id", null) // v0.8.30: выполнения круговых заданий — не личный ритуал
        .order("completed_at", { ascending: false }).limit(100),
      sb.from("tasks").select("id,title,kind,area").eq("user_id", uid).neq("completed", true)
        .is("circle_id", null).eq("due_date", todayKey).limit(300),
    ]);
    const dayOf = (t) => (t.completed_at ? SixMin.fmtKey(new Date(t.completed_at)) : (t.due_date || ""));
    done = (d.data || []).filter((t) => dayOf(t) === todayKey).reverse(); // утром сверху
    window.__sixminTodayOpen = o.data || []; // v0.8.45: кэш для строки «Задачи на сегодня»
    openToday = (o.data || []).length;
    if (window.SixMinAmRedraw) window.SixMinAmRedraw();
  }

  function render() {
    if (!root) return;
    const n = done.length;
    const total = n + openToday;
    if (!total) { root.innerHTML = ""; return; } // задач на сегодня нет — карточку не показываем
    const pct = Math.max(0, Math.min(100, Math.round((n / total) * 100)));
    const list = done.map((t) => `
      <li class="sm-dt-item">
        <span class="sm-dt-em">${KIND_EMOJI[t.kind] || "✅"}</span>
        <span class="sm-dt-title">${SixMin.esc(t.title && t.title.trim() ? t.title : "(без названия)")}</span>
        ${t.area === "work" ? '<span class="sm-dt-area" title="рабочая">💼</span>' : ""}
        <span class="sm-dt-time">${t.completed_at ? timeOf(t.completed_at) : ""}</span>
      </li>`).join("");
    root.innerHTML = `
      <article class="card sm-dt-card">
        <details class="sm-dt"${wasOpen ? " open" : ""}>
          <summary>
            <span class="sm-dt-sum">✅ Сегодня выполнено: <b>${n}</b> из ${total}</span>
            <span class="sm-dt-bar"><i style="width:${pct}%"></i></span>
            <span class="sm-dt-arrow">▾</span>
          </summary>
          <div class="sm-dt-body">
            ${n ? `<ul class="sm-dt-list">${list}</ul>`
                : '<p class="sm-dt-empty">Пока ни одной — задачи отмечаются квадратиком ☑ в Трекере и на вкладке Работа.</p>'}
            ${n && n === total ? '<p class="sm-dt-all">🎉 Все задачи на сегодня выполнены!</p>'
              : openToday ? `<p class="sm-dt-rest">Осталось на сегодня: ${openToday}</p>` : ""}
          </div>
        </details>
      </article>`;
    const d = root.querySelector("details");
    if (d && d.addEventListener) d.addEventListener("toggle", () => { wasOpen = !!d.open; });
  }

  async function refresh() {
    try { await load(); } catch (e) { done = []; openToday = 0; }
    render();
  }

  function injectStyles() {
    if (document.getElementById("sixmin-donetoday-css")) return;
    const css = document.createElement("style");
    css.id = "sixmin-donetoday-css";
    css.textContent = `
      .sm-dt-card{padding:6px 8px}
      .sm-dt summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;
                     padding:10px 8px;user-select:none}
      .sm-dt summary::-webkit-details-marker{display:none}
      .sm-dt-sum{font-size:14px;font-weight:700;flex-shrink:0}
      .sm-dt-sum b{color:var(--accent,#E30613);font-size:16px}
      .sm-dt-bar{flex:1;height:6px;border-radius:99px;background:rgba(128,128,128,.18);overflow:hidden;min-width:36px}
      .sm-dt-bar i{display:block;height:100%;background:var(--accent,#E30613);border-radius:99px;transition:width .3s}
      .sm-dt-arrow{opacity:.5;font-size:12px;transition:transform .2s;flex-shrink:0}
      .sm-dt[open] .sm-dt-arrow{transform:rotate(180deg)}
      .sm-dt-body{padding:2px 8px 10px;border-top:1px dashed rgba(128,128,128,.25)}
      .sm-dt-list{list-style:none;margin:8px 0 0;padding:0}
      .sm-dt-item{display:flex;align-items:center;gap:8px;padding:6px 0;
                  border-bottom:1px dashed rgba(128,128,128,.15);font-size:13.5px}
      .sm-dt-item:last-child{border-bottom:0}
      .sm-dt-em{flex-shrink:0}
      .sm-dt-title{flex:1;min-width:0;text-decoration:line-through;opacity:.75;
                   overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .sm-dt-area{font-size:12px;flex-shrink:0;opacity:.8}
      .sm-dt-time{font-size:11px;opacity:.5;flex-shrink:0;font-variant-numeric:tabular-nums}
      .sm-dt-empty{font-size:13px;opacity:.6;margin:10px 0 2px;line-height:1.5}
      .sm-dt-all{font-size:13px;font-weight:700;color:#30a46c;margin:8px 0 2px}
      .sm-dt-rest{font-size:12px;opacity:.6;margin:8px 0 2px}`;
    document.head.appendChild(css);
  }

  function startAutoRefresh() {
    if (started) return;
    started = true;
    // тап по вкладке «Сегодня» — обновить (например, после отметки задачи в Трекере)
    document.addEventListener("click", (e) => {
      const b = e.target && e.target.closest && e.target.closest('[data-tab="today"]');
      if (b) setTimeout(refresh, 200);
    });
    // мягкий опрос, пока открыта первая вкладка (задачи могли прийти от бота)
    setInterval(() => {
      try {
        if (document.visibilityState !== "visible") return;
        const s = document.getElementById("screen-today");
        if (s && s.classList && s.classList.contains("active")) refresh();
      } catch (e) { /* тихо */ }
    }, POLL_MS);
  }

  function mount(container) {
    root = typeof container === "string" ? document.querySelector(container) : container;
    injectStyles();
    startAutoRefresh();
    refresh();
  }

  window.SixMinDoneToday = { mount, refresh };
})();
window.__v02stage = "after-sixmin-donetoday"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-donetoday");

// app/js/sixmin-analytics.js — v0.2: Инфографика и сводки
//  - Heatmap-календарь как на GitHub (последние ~17 недель)
//  - Текущая и лучшая серия (streak) по привычкам
//  - Автоматические выводы: самая частая благодарность, пропущенные дни,
//    самая стабильная привычка, самые переносимые задачи
// API: SixMinAnalytics.mount(container)

(function () {
  let root = null;

  const LEVEL_COLORS = ["rgba(128,128,128,.10)", "#F7CCCC", "#EF8A8A", "#E34040", "#A80303"];
  const DAYS = 17 * 7; // ~4 месяца

  async function loadAll() {
    const uid = await SixMin.uid().catch(() => "00000000-0000-0000-0000-000000000000");
    const to = SixMin.fmtKey(new Date());
    const fromD = new Date(); fromD.setDate(fromD.getDate() - DAYS + 1);
    const from = SixMin.fmtKey(fromD);

    const [heat, habits, logs, tasks, entries] = await Promise.all([
      SixMin.sb().rpc("heatmap_levels", { p_from: from, p_to: to }),
      SixMin.sb().from("habits").select("*").eq("user_id", uid).eq("archived", false),
      SixMin.sb().from("habit_logs").select("habit_id,day,completed")
        .eq("user_id", uid).gte("day", from).lte("day", to),
      SixMin.sb().from("tasks").select("title,postpone_count,completed,due_date")
        .eq("user_id", uid).gte("due_date", from),
      // живая схема: ответы плоские (a1..a3 утро, e1..e3 вечер, w1..w5 неделя);
      // благодарность — утренний первый ответ a1
      SixMin.sb().from("entries").select("date,slot,a1")
        .eq("user_id", uid).gte("date", from).lte("date", to).limit(500)
        .then((r) => (r.error ? { data: [] } : r)),
    ]);

    return {
      heat: Object.fromEntries((heat.data || []).map((r) => [r.day, r.level])),
      habits: habits.data || [],
      logs: logs.data || [],
      tasks: tasks.data || [],
      entries: entries.data || [],
      entriesDays: new Set((entries.data || []).map((e) => e.date)),
      from, to,
    };
  }

  // ---------- Streak ----------
  // День «зачтён», если выполнены все плановые привычки ИЛИ есть запись в дневнике.
  function computeStreaks(habits, logs, entriesDays) {
    if (!habits.length && !entriesDays?.size) return { current: 0, best: 0 };
    const doneSet = new Set(logs.filter((l) => l.completed).map((l) => l.habit_id + "|" + l.day));

    const dayOk = (key) => {
      if (entriesDays?.has(key)) return true;
      const dow = (SixMin.parseKey(key).getDay() + 6) % 7;
      const active = habits.filter((h) => (h.active_days || [0,1,2,3,4,5,6]).includes(dow));
      if (!active.length) return null; // день без плановых привычек — не считается
      return active.every((h) => doneSet.has(h.id + "|" + key));
    };

    const today = SixMin.fmtKey(new Date());
    let current = 0;
    let d = SixMin.parseKey(today);
    // сегодня ещё не закончилось — начинаем проверку со вчера, если сегодня не ок
    if (dayOk(today) === false) d.setDate(d.getDate() - 1);
    for (let i = 0; i < 400; i++) {
      const ok = dayOk(SixMin.fmtKey(d));
      if (ok === true) current++;
      else if (ok === false) break;
      d.setDate(d.getDate() - 1);
    }

    let best = 0, run = 0;
    const start = new Date(); start.setDate(start.getDate() - DAYS);
    for (let t = new Date(start); t <= new Date(); t.setDate(t.getDate() + 1)) {
      const ok = dayOk(SixMin.fmtKey(t));
      if (ok === true) { run++; best = Math.max(best, run); }
      else if (ok === false) run = 0;
    }
    return { current, best: Math.max(best, current) };
  }

  // ---------- Выводы ----------
  function buildInsights(D) {
    const out = [];
    const to = SixMin.parseKey(D.to), from = SixMin.parseKey(D.from);

    // 1. Самая стабильная привычка
    if (D.habits.length) {
      const pct = D.habits.map((h) => {
        const hl = D.logs.filter((l) => l.habit_id === h.id);
        const planned = hl.length || 1;
        const done = hl.filter((l) => l.completed).length;
        return { h, pct: done / planned, done };
      }).filter((x) => x.done > 0).sort((a, b) => b.pct - a.pct);
      if (pct[0]) out.push(`🏆 Самая стабильная привычка: <b>${SixMin.esc(pct[0].h.name)}</b> — ${Math.round(pct[0].pct * 100)}% дней`);
      const worst = pct[pct.length - 1];
      if (pct.length > 1 && worst.pct < 0.5)
        out.push(`📉 Проседает: <b>${SixMin.esc(worst.h.name)}</b> — всего ${Math.round(worst.pct * 100)}%. Может, сделать её легче?`);
    }

    // 2. Пропущенные дни (были плановые привычки, но ни одной отметки)
    let missed = 0;
    for (let t = new Date(from); t <= to; t.setDate(t.getDate() + 1)) {
      const key = SixMin.fmtKey(t);
      const dow = (t.getDay() + 6) % 7;
      const planned = D.habits.some((h) => (h.active_days || [0,1,2,3,4,5,6]).includes(dow));
      const any = D.logs.some((l) => l.day === key);
      if (planned && !any && key !== D.to) missed++;
    }
    if (missed > 0) out.push(`🕳️ Пропущенных дней за период: <b>${missed}</b>`);

    // 3. Самая частая благодарность (тексты ищем в answers jsonb по типовым ключам)
    const words = {};
    const STOP = new Set("это что как для и в на с не но а из за то все весь очень меня мой моя мне нас вам вам был была были спасибо".split(" "));
    for (const e of D.entries) {
      const texts = (typeof e.a1 === "string" && e.a1.trim()) ? [e.a1] : [];
      for (const txt of texts) {
        for (const w of txt.toLowerCase().replace(/[^a-zа-яё\s]/gi, " ").split(/\s+/)) {
          if (w.length >= 4 && !STOP.has(w)) words[w] = (words[w] || 0) + 1;
        }
      }
    }
    const top = Object.entries(words).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 3) out.push(`🙏 Самая частая благодарность: <b>«${SixMin.esc(top[0])}»</b> (${top[1]} раз)`);

    // 4. Задачи-«беглецы»
    const runners = D.tasks.filter((t) => (t.postpone_count || 0) >= 2)
      .sort((a, b) => b.postpone_count - a.postpone_count)[0];
    if (runners) out.push(`↪ Чаще всего переносится: <b>«${SixMin.esc(runners.title)}»</b> — уже ${runners.postpone_count} раз. Разбить на части?`);

    if (!out.length) out.push("✨ Начните отмечать привычки и писать благодарности — через неделю здесь появятся первые выводы.");
    return out;
  }

  // ---------- Heatmap (GitHub-style) ----------
  function heatmapHTML(D) {
    // колонки = недели (Пн..Вс), последняя колонка — текущая неделя
    const to = SixMin.parseKey(D.to);
    const endSundayOffset = 6 - ((to.getDay() + 6) % 7);
    const end = new Date(to); end.setDate(end.getDate() + endSundayOffset);
    const weeks = Math.ceil(DAYS / 7) + 1;

    let cols = "";
    for (let w = weeks - 1; w >= 0; w--) {
      let cells = "";
      for (let d = 0; d < 7; d++) {
        const date = new Date(end);
        date.setDate(date.getDate() - w * 7 - (6 - d));
        const key = SixMin.fmtKey(date);
        const inRange = key >= D.from && key <= D.to;
        const level = inRange ? (D.heat[key] || 0) : -1;
        const bg = level < 0 ? "transparent" : LEVEL_COLORS[level];
        const isToday = key === D.to;
        cells += `<div class="sm-hm-cell" style="background:${bg}" title="${key}${level > 0 ? " · уровень " + level : ""}"></div>`;
        if (isToday) cells = cells.replace('class="sm-hm-cell"', 'class="sm-hm-cell sm-hm-today"');
      }
      cols += `<div class="sm-hm-col">${cells}</div>`;
    }
    return `<div class="sm-hm"><div class="sm-hm-cols">${cols}</div>
      <div class="sm-hm-legend">Меньше ${LEVEL_COLORS.map((c) => `<span style="background:${c}"></span>`).join("")} Больше</div></div>`;
  }

  async function render() {
    if (!root) return;
    root.innerHTML = `<div class="sm-analytics" style="opacity:.5">Загружаем статистику…</div>`;
    let D;
    try { D = await loadAll(); }
    catch (e) { root.innerHTML = `<div class="sm-analytics">Ошибка загрузки: ${SixMin.esc(e.message || e)}</div>`; return; }

    const streaks = computeStreaks(D.habits, D.logs, D.entriesDays);
    const insights = buildInsights(D);

    root.innerHTML = `
      <div class="sm-analytics">
        <div style="display:flex;justify-content:flex-end;margin-bottom:6px">
          <button class="sm-ib" data-info="analytics" aria-label="Как это работает">i</button>
        </div>
        <div class="sm-streak-row">
          <div class="sm-streak-card">
            <div class="sm-streak-num">🔥 ${streaks.current}</div>
            <div class="sm-streak-cap">дней подряд сейчас</div>
          </div>
          <div class="sm-streak-card">
            <div class="sm-streak-num">🏅 ${streaks.best}</div>
            <div class="sm-streak-cap">лучшая серия</div>
          </div>
        </div>
        <h4 class="sm-an-title">Активность за ${Math.round(DAYS / 7)} недель</h4>
        ${heatmapHTML(D)}
        <h4 class="sm-an-title">Выводы</h4>
        <ul class="sm-insights">${insights.map((i) => `<li>${i}</li>`).join("")}</ul>
      </div>`;
    root.querySelector('[data-info="analytics"]')?.addEventListener("click", () => SixMin.info("Инфографика",
      "<p><b>Heatmap</b> — календарь активности как на GitHub: чем темнее квадратик дня, тем больше привычек выполнено и была ли запись дневника. Сегодняшний день обведён.</p>" +
      "<p>🔥 — текущая серия дней подряд (день с любой записью или всеми привычками засчитывается; сегодня ещё не закончилось и не рвёт серию). 🏅 — лучшая серия за период.</p>" +
      "<p><b>Выводы</b> — автоматические наблюдения: самая стабильная и проседающая привычка, пропущенные дни, самая частая благодарность (по утренним ответам), задачи-«беглецы» с переносами.</p>" +
      "<p>Данные: отметки привычек, записи дневника и задачи обеих областей — личной и рабочей.</p>"));
  }

  function mount(container) {
    root = typeof container === "string" ? document.querySelector(container) : container;
    injectStyles();
    render();
  }

  function injectStyles() {
    if (document.getElementById("sixmin-analytics-css")) return;
    const css = document.createElement("style");
    css.id = "sixmin-analytics-css";
    css.textContent = `
      .sm-analytics{font-family:system-ui,sans-serif}
      .sm-streak-row{display:flex;gap:10px;margin-bottom:18px}
      .sm-streak-card{flex:1;border:1px solid rgba(128,128,128,.15);border-radius:14px;padding:14px;text-align:center}
      .sm-streak-num{font-size:26px;font-weight:800}
      .sm-streak-cap{font-size:12px;opacity:.6;margin-top:2px}
      .sm-an-title{font-size:13px;text-transform:uppercase;letter-spacing:.5px;opacity:.6;margin:18px 0 10px}
      .sm-hm{overflow-x:auto;padding-bottom:4px}
      .sm-hm-cols{display:flex;gap:3px;width:max-content}
      .sm-hm-col{display:flex;flex-direction:column;gap:3px}
      .sm-hm-cell{width:13px;height:13px;border-radius:3px}
      .sm-hm-today{outline:2px solid var(--accent,#E30613);outline-offset:1px}
      .sm-hm-legend{display:flex;align-items:center;gap:4px;font-size:11px;opacity:.6;margin-top:8px}
      .sm-hm-legend span{width:11px;height:11px;border-radius:3px;display:inline-block}
      .sm-insights{list-style:none;margin:0;padding:0}
      .sm-insights li{padding:11px 14px;border-radius:12px;background:rgba(128,128,128,.10);
                      margin-bottom:8px;font-size:14px;line-height:1.5}
      .sm-insights b{font-weight:700}`;
    document.head.appendChild(css);
  }

  window.SixMinAnalytics = { mount, refresh: render };
})();
window.__v02stage = "after-sixmin-analytics"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-analytics");

// app/js/sixmin-theory.js — v0.2: Теория, мотивация и цитаты
//  - Карточки принципов «6 минут» (80/20, Львица/Антилопа и т.д.)
//  - Пул цитат (36+) — случайная цитата на экране успеха
// API:
//   SixMinTheory.mountCards(container)   — вкладка с принципами
//   SixMinTheory.randomQuote()           — {text, author}
//   SixMinTheory.showSuccessQuote(host)  — вставить цитату в блок "День записан"

(function () {
  // ---------- Принципы ----------
  const PRINCIPLES = [
    { emoji: "🦁", title: "Львица и Антилопа", text: "Львица не бегает за всеми антилопами сразу — она выбирает одну и догоняет. Ваша «Антилопа дня» — главная задача, которая двигает вас вперёд. Всё остальное может подождать. Поэтому утро начинается с 1–3 пунктов плана, а не с десяти." },
    { emoji: "📊", title: "Принцип 80/20", text: "80% результата дают 20% усилий. Найдите те самые 20% дел — и поставьте их первыми пунктами утреннего плана. Остальные 80% суеты можно смело делегировать, упростить или отложить." },
    { emoji: "⏱️", title: "6 минут — это много", text: "3 минуты плана утром и 3 минуты итогов вечером = 73 часа стратегии в год. План, записанный за три минуты, бьёт час тревожного хаоса: маленькое действие, повторённое 365 раз, сильнее разового подвига." },
    { emoji: "🔥", title: "Сила серии", text: "Цепочка дней — актив системы, а не настроения. Пропущенный день — сноска, два подряд — уже новая привычка. Никогда не пропускайте дважды подряд." },
    { emoji: "📝", title: "План со временем — решение", text: "«После обеда» — не время. «14:00» — решение. Утренний вопрос «с чего начнёшь — и во сколько» превращает мечту в запись в календаре." },
    { emoji: "🎯", title: "Одна цель на месяц", text: "Много целей — это ноль целей. На месяц — ОДНА цель, и она режется планами на недели и дни. Если хочется вторую — значит, первая выбрана неверно." },
    { emoji: "↪", title: "Перенос — не провал", text: "Перенос — нормально, хвост без решения — нет. Вечером каждый хвост получает вердикт: завтра (с временем), отказаться или делегировать. Пятый перенос — разбейте задачу или честно удалите: она не ваша." },
    { emoji: "🌅", title: "Утро задаёт день", text: "Первые три минуты дня — руль всего дня. Сначала план, потом почта и соцсети: пусть чужие повестки не определяют ваш фокус." },
    { emoji: "🌙", title: "Вечер закрывает петли", text: "Вечер — не про вину, а про решения: сделано / завтра / отказаться / делегировать. Хвост с решением — план, хвост без решения — тревога, которая крутится в голове и мешает спать." },
    { emoji: "📉", title: "Прогресс нелинеен", text: "Будут дни на 20% и недели провалов. Считайте не дни, а среднее за месяц: стратегия измеряется на дистанции, 70% выполнения — отличный результат." },
    { emoji: "✍️", title: "Записанное становится реальным", text: "Мысль в голове — фантазия. Записанная мысль — обязательство: сам акт записи повышает вероятность выполнения в 1.5–2 раза. Поэтому план утром записывают, а не обдумывают." },
    { emoji: "🧘", title: "Пауза — часть работы", text: "Отдых — часть плана: день отдыха, запланированный заранее, не ломает серию. Пауза между стимулом и реакцией учит выбирать реакцию, а не действовать на автопилоте." },
  ];

  // v0.8.1: принципы под новые возможности + тематические группы
  const PRINCIPLES_MORE = [
    { g: "work", emoji: "🏭", title: "График — договор, а не приговор", text: "Сменная сетка — не судьба, а договор с собой и семьёй. Поменялся договор — меняется цепочка дней, а не человек." },
    { g: "work", emoji: "⏳", title: "Пересечения считаются в минутах", text: "«Занят весь день» — лень мысли. Завод до 19:30 и бассейн с 20:30 — две жизни в один вечер. Точность уважает обе." },
    { g: "work", emoji: "🛌", title: "Отсыпной — не выходной", text: "Тело не врёт: после ночной смены отдых — это производственное время. Не планируйте подвигов на отсыпной." },
    { g: "family", emoji: "🤝", title: "Семья — это расписание, которое договорилось", text: "Любовь живёт не в намерениях, а в найденных общих вечерах. Общие свободные дни — любовь, которую положили в календарь." },
    { g: "family", emoji: "🎁", title: "Договор лучше нотации", text: "Баунти: взял — сделал — сдал — автор одобрил — баллы в копилку. Правила, видимые обеим сторонам, растят человека, а не обиду." },
    { g: "family", emoji: "📅", title: "Приглашение — забота по часам", text: "Событие с приглашением — способ сказать «ты мне важен» не словом, а слотом календаря. Ответ «иду» — это обещание, которое видно всем." },
    { g: "family", emoji: "🎂", title: "Помнить хорошо — не забывать лучше", text: "Дни рождения за вас помнит круг: утром приложение подскажет, у кого праздник и в какие общие свободные дни круг может собраться. Можно попросить не напоминать или перенести напоминание на удобный день." },
    { g: "voice", emoji: "🎙️", title: "Проговорённое — значит записанное", text: "Руки, занятые поводком или коляской, — не повод терять день. Диктовка сохраняет честность мысли на скорости 90 км/ч." },
    { g: "voice", emoji: "🧊", title: "Заморозка — тоже забота", text: "Болезнь, дорога, тяжёлая неделя: день можно заморозить без вины. Серия не прервана — она поставлена на паузу вместе с вами." },
  ];
  const PRINCIPLES_ALL = PRINCIPLES.map((p) => Object.assign({ g: "self" }, p)).concat(PRINCIPLES_MORE);
  const GROUPS = [
    { id: "self", emoji: "🕰️", title: "Время и себя" },
    { id: "work", emoji: "🏭", title: "Работа и смены" },
    { id: "family", emoji: "🤝", title: "Семья и круги" },
    { id: "voice", emoji: "🎙️", title: "Голос и забота" },
  ];

  // ---------- Цитаты: пул v0.1 (quotes.js, 36 шт.) + новые, с дедупликацией ----------
  const QUOTES_V01 = [
    { text: "Сделанное — всегда лучше, чем идеальное.", author: "Шерил Сэндберг" },
    { text: "Не то, что мы живём мало, а то, что много теряем.", author: "Сенека" },
    { text: "Счастье зависит от нас самих.", author: "Аристотель" },
    { text: "Путь в тысячу ли начинается с первого шага.", author: "Лао-цзы" },
    { text: "Будущее принадлежит тем, кто верит в красоту своих мечтаний.", author: "Элеонора Рузвельт" },
    { text: "Единственный способ делать великие дела — любить то, что вы делаете.", author: "Стив Джобс" },
    { text: "Успех — это способность идти от поражения к поражению, не теряя энтузиазма.", author: "Уинстон Черчилль" },
    { text: "Не считай дни, извлекай из них пользу.", author: "Мухаммед Али" },
    { text: "Всё, что вы можете представить — реально.", author: "Пабло Пикассо" },
    { text: "Сначала они тебя не замечают, потом смеются над тобой, потом борются с тобой, а потом ты побеждаешь.", author: "Махатма Ганди" },
    { text: "Жизнь — это то, что с тобой происходит, пока ты строишь другие планы.", author: "Джон Леннон" },
    { text: "Стань тем изменением, которое хочешь увидеть в мире.", author: "Махатма Ганди" },
    { text: "Через двадцать лет вы будете больше разочарованы тем, чего не сделали, чем тем, что сделали.", author: "Марк Твен" },
    { text: "Лучшее время посадить дерево было 20 лет назад. Второе лучшее время — сейчас.", author: "Китайская пословица" },
    { text: "Ваше время ограничено, не тратьте его, живя чужой жизнью.", author: "Стив Джобс" },
    { text: "Победа — это ещё не всё, всё — это постоянное желание побеждать.", author: "Винс Ломбарди" },
    { text: "Разница между невозможным и возможным заключается в решимости человека.", author: "Томми Ласорда" },
    { text: "Не бойся отказаться от хорошего ради великого.", author: "Джон Рокфеллер" },
    { text: "Я не терпел поражений. Я просто нашёл 10 000 способов, которые не работают.", author: "Томас Эдисон" },
    { text: "Если вы слышите внутренний голос, который говорит: «Вы не сможете рисовать», рисуйте во что бы то ни стало, и этот голос замолкнет.", author: "Винсент Ван Гог" },
    { text: "Единственная невозможная поездка — это та, которую вы никогда не начинаете.", author: "Тони Роббинс" },
    { text: "Успех обычно приходит к тем, кто слишком занят, чтобы его просто ждать.", author: "Генри Дэвид Торо" },
    { text: "Не позволяйте вчерашнему дню занимать слишком много места в сегодняшнем.", author: "Уилл Роджерс" },
    { text: "Вы учитесь большему на успехах, чем на неудачах. Не позволяйте неудачам останавливать вас. Неудача воспитывает характер.", author: "Неизвестно" },
    { text: "Если вы работаете над чем-то, что вас действительно волнует, вас не нужно подталкивать. Видение тянет вас.", author: "Стив Джобс" },
    { text: "Люди редко добиваются успеха, если они не довольны тем, что делают.", author: "Дейл Карнеги" },
    { text: "Единственный человек, с которым вы должны сравнивать себя, — это вы в прошлом.", author: "Зигмунд Фрейд" },
    { text: "Наш величайший страх не в том, что мы неспособны. Наш величайший страх в том, что мы могущественны без меры.", author: "Марианна Уильямсон" },
    { text: "Слишком многие из нас не живут своими мечтами, потому что живут своими страхами.", author: "Лес Браун" },
    { text: "Я приписываю свой успех этому: я никогда не давал и не принимал оправданий.", author: "Флоренс Найтингейл" },
    { text: "Самый верный способ добиться успеха — всегда пробовать ещё один раз.", author: "Томас Эдисон" },
    { text: "Упади семь раз — встань восемь.", author: "Японская пословица" },
    { text: "Большое дело не делается сразу.", author: "Пословица" },
    { text: "День, который ты заметил, прожит дважды.", author: "Авторская" },
    { text: "Шесть минут сегодня — это привычка, которая держится годами.", author: "Авторская" },
    { text: "Маленькие шаги каждый день приводят к большим результатам.", author: "Авторская" },
  ];

  const QUOTES_NEW = [
    { text: "Мы — то, что постоянно делаем. Совершенство — не действие, а привычка.", author: "Аристотель" },
    { text: "Не бойся идти медленно, бойся стоять на месте.", author: "Китайская пословица" },
    { text: "Дисциплина — это мост между целями и достижениями.", author: "Джим Рон" },
    { text: "Успех — это сумма небольших усилий, повторяемых изо дня в день.", author: "Роберт Кольер" },
    { text: "Великие дела состоят из малых.", author: "Демокрит" },
    { text: "Мотивация заставляет начать. Привычка заставляет продолжать.", author: "Джим Рон" },
    { text: "Сложнее всего начать действовать, всё остальное зависит только от упорства.", author: "Амелия Эрхарт" },
    { text: "Каждый день — это новая возможность изменить свою жизнь.", author: "Неизвестный автор" },
    { text: "Победители никогда не сдаются, а сдающиеся никогда не побеждают.", author: "Винс Ломбарди" },
    { text: "Делай, что можешь, с тем, что имеешь, там, где ты есть.", author: "Теодор Рузвельт" },
    { text: "Будь собой; прочие роли уже заняты.", author: "Оскар Уайльд" },
    { text: "Ежедневное маленькое улучшение — путь к большому результату.", author: "Робин Шарма" },
    { text: "Упорство важнее таланта: талант без труда — это просто потенциал.", author: "Анджела Дакворт" },
    { text: "Хочешь быть счастливым — будь им.", author: "Козьма Прутков" },
    { text: "Секрет перемен в том, чтобы направить энергию не на борьбу со старым, а на создание нового.", author: "Сократ (приписывается)" },
    { text: "Начинать всегда стоит с того, что сеет сомнения.", author: "Борис Стругацкий" },
    { text: "Тишина — источник великой силы.", author: "Лао-цзы" },
    { text: "Когда ты хочешь чего-то, вся Вселенная будет способствовать тому, чтобы желание твоё сбылось.", author: "Пауло Коэльо" },
    { text: "Не ошибается тот, кто ничего не делает.", author: "Теодор Рузвельт" },
    { text: "Счастье — это не станция назначения, а способ путешествия.", author: "Маргарет Ли Ранбек" },
    { text: "Привычка — вторая натура. Но сначала — первая победа.", author: "Народная мудрость" },
    { text: "Если ты не строишь свои планы, тебя впишут в чужие.", author: "Джим Рон" },
    { text: "Умение сосредоточиться — это умение сказать «нет» хорошему ради лучшего.", author: "Грег Маккеон" },
    { text: "Медленно — это тоже движение.", author: "Неизвестный автор" },
    { text: "Ваш уровень жизни — это уровень ваших привычек.", author: "Брайан Трейси" },
    { text: "Доведи до конца дело — и день прожит не зря.", author: "Народная мудрость" },
    { text: "Самый лучший момент — тот, в котором ты сейчас.", author: "Дзен-изречение" },
    { text: "Маленькие ежедневные победы складываются в большие жизненные результаты.", author: "Неизвестный автор" },
    { text: "Терпение и труд всё перетрут.", author: "Русская пословица" },
    { text: "Не откладывай на завтра то, что можно сделать за 6 минут сегодня.", author: "Дневник «6 минут»" },
    { text: "Знать путь и пройти его — не одно и то же.", author: "Морфеус" },
    { text: "Сначала мы создаём привычки, потом привычки создают нас.", author: "Джон Драйден" },
  ];

  // Итоговый пул: сначала v0.1 (как в вашем quotes.js), затем новые без дублей.
  // ЖИВОЙ бандл может хранить цитаты в любом формате (строки / {text} / {q}) —
  // нормализуем دفاعивно, иначе undefined.toLowerCase() ронял весь v0.2 (WebKit).
  const _qtext = (q) => (typeof q === "string") ? q : String((q && (q.text || q.t || q.q || q.quote)) || "");
  const _qauthor = (q) => (typeof q === "object" && q) ? String(q.author || q.a || q.author_name || "") : "";
  const _norm = (t) => String(t || "").toLowerCase().replace(/[^a-zа-яё0-9]/gi, "");
  const _ext = (typeof window !== "undefined" && Array.isArray(window.QUOTES)) ? window.QUOTES : null;
  const _raw = (_ext && _ext.length) ? _ext : QUOTES_V01;
  // единая форма с ОБЕИМИ парами ключей: {text,author} для v0.2 и {t,a} для прод-экрана успеха
  const _shape = (q) => { const t = _qtext(q), a = _qauthor(q); return { text: t, author: a, t: t, a: a }; };
  const _base = _raw.map(_shape).filter((q) => q.text);
  const _seen = new Set(_base.map((q) => _norm(q.text)));
  const QUOTES = _base.concat(QUOTES_NEW.map(_shape).filter((q) => !_seen.has(_norm(q.text))));

  function randomQuote() {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }
  // алиас, совместимый с вашим quotes.js
  function getRandomQuote() { return randomQuote(); }

  // ---------- Экран успеха ----------
  function showSuccessQuote(host) {
    if (typeof host === "string") host = document.querySelector(host);
    if (!host) return null;
    const q = randomQuote();
    host.innerHTML = `
      <div class="sm-quote">
        <div class="sm-quote-mark">“</div>
        <div class="sm-quote-text">${SixMin.esc(q.text)}</div>
        <div class="sm-quote-author">— ${SixMin.esc(q.author)}</div>
      </div>`;
    injectStyles();
    return q;
  }

  // ---------- Вкладка с принципами ----------
  function mountCards(container) {
    const root = typeof container === "string" ? document.querySelector(container) : container;
    if (!root) return;
    injectStyles();
    root.innerHTML = `
      <details class="sm-theory-wrap">
        <summary>
          <span class="sm-card-emoji">📖</span> Мудрость «6 минут»: стратегия дня
          <em class="sm-theory-count">${PRINCIPLES_ALL.length} принципа</em>
          <button class="sm-ib" data-info="theory" aria-label="Как это работает">i</button>
        </summary>
        <div class="sm-theory">
          <p style="margin:8px 4px;opacity:.85;font-size:13px;line-height:1.5">«6 минут» — не дневник успеха, а штаб дня: утром три минуты на план, вечером три минуты на итоги и решения. Принципы ниже — рабочие правила штаба.</p>
          ${GROUPS.map((g, gi) => `
          <details class="sm-card sm-card-group" data-g="${g.id}" ${gi === 0 ? "open" : ""}>
            <summary><span class="sm-card-emoji">${g.emoji}</span> ${g.title}
              <em class="sm-theory-count">${PRINCIPLES_ALL.filter((p) => p.g === g.id).length}</em></summary>
            ${PRINCIPLES_ALL.filter((p) => p.g === g.id).map((p) => `
            <details class="sm-card">
              <summary><span class="sm-card-emoji">${p.emoji}</span> ${SixMin.esc(p.title)}</summary>
              <p>${SixMin.esc(p.text)}</p>
            </details>`).join("")}
          </details>`).join("")}
        </div>
      </details>`;
    // спойлер: свёрнут по умолчанию, выбор пользователя запоминается
    const wrap = root.querySelector(".sm-theory-wrap");
    try { if (localStorage.getItem("sixmin-theory-open") === "1") wrap.open = true; } catch (e) {}
    wrap.addEventListener("toggle", () => {
      try { localStorage.setItem("sixmin-theory-open", wrap.open ? "1" : "0"); } catch (e) {}
    });
    root.querySelector('[data-info="theory"]')?.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      SixMin.info("Мудрость «6 минут»",
      "<p>Блок свёрнут в спойлер: тап по заголовку «Мудрость «6 минут»» раскрывает карточки-принципы (80/20, Львица и Антилопа, сила серии…), повторный тап сворачивает; состояние запоминается. Первая карточка раскрыта по умолчанию.</p>" +
      "<p>Случайная цитата из пула 68 появляется на экране «День записан» — маленькая награда за заполненный блок.</p>");
    });
  }

  function injectStyles() {
    if (document.getElementById("sixmin-theory-css")) return;
    const css = document.createElement("style");
    css.id = "sixmin-theory-css";
    css.textContent = `
      .sm-theory{font-family:system-ui,sans-serif}
      .sm-theory-wrap{border:1px solid rgba(128,128,128,.18);border-radius:14px;overflow:hidden}
      .sm-theory-wrap>summary{display:flex;align-items:center;gap:10px;padding:14px 16px;font-weight:700;
                               font-size:15px;cursor:pointer;list-style:none;user-select:none}
      .sm-theory-wrap>summary::-webkit-details-marker{display:none}
      .sm-theory-wrap>summary::after{content:"⌄";margin-left:auto;opacity:.45;transition:transform .2s;font-size:14px}
      .sm-theory-wrap[open]>summary::after{transform:rotate(180deg)}
      .sm-theory-count{font-style:normal;opacity:.55;font-size:12px;font-weight:500}
      .sm-theory-wrap .sm-theory{padding:4px 12px 12px}
      .sm-theory-wrap .sm-ib{margin-left:4px}
      .sm-card{border:1px solid rgba(128,128,128,.18);border-radius:14px;margin-bottom:10px;overflow:hidden}
      .sm-card-group{margin:14px 0}
      .sm-card-group>summary{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;
                               padding:10px 12px;border-radius:12px;cursor:pointer;list-style:none;
                               border:1px solid rgba(227,6,19,.40);background:rgba(227,6,19,.10)}
      .sm-card-group>summary::-webkit-details-marker{display:none}
      .sm-card-group>summary::after{content:"⌄";margin-left:auto;opacity:.5;transition:transform .2s;font-size:13px}
      .sm-card-group[open]>summary::after{transform:rotate(180deg)}
      .sm-card-group[data-g="work"]>summary{border-color:rgba(59,130,246,.45);background:rgba(59,130,246,.12)}
      .sm-card-group[data-g="family"]>summary{border-color:rgba(244,114,182,.45);background:rgba(244,114,182,.12)}
      .sm-card-group[data-g="voice"]>summary{border-color:rgba(34,197,94,.45);background:rgba(34,197,94,.12)}
      .sm-card-group .sm-card{margin:8px 0 8px 14px;border-left:3px solid rgba(227,6,19,.45)}
      .sm-card-group[data-g="work"] .sm-card{border-left-color:rgba(59,130,246,.55)}
      .sm-card-group[data-g="family"] .sm-card{border-left-color:rgba(244,114,182,.55)}
      .sm-card-group[data-g="voice"] .sm-card{border-left-color:rgba(34,197,94,.55)}
      .sm-card summary{padding:14px 16px;font-weight:600;font-size:15px;cursor:pointer;list-style:none;
                       display:flex;align-items:center;gap:10px;user-select:none}
      .sm-card summary::-webkit-details-marker{display:none}
      .sm-card summary::after{content:"⌄";margin-left:auto;opacity:.4;transition:transform .2s}
      .sm-card[open] summary::after{transform:rotate(180deg)}
      .sm-card p{padding:0 16px 14px;margin:0;font-size:14px;line-height:1.6;opacity:.85}
      .sm-card-emoji{font-size:20px}
      .sm-quote{text-align:center;padding:18px 10px}
      .sm-quote-mark{font-size:44px;line-height:.5;color:var(--accent,#E30613);font-family:Georgia,serif}
      .sm-quote-text{font-size:16px;line-height:1.55;font-style:italic;margin:10px 0 8px}
      .sm-quote-author{font-size:13px;opacity:.6;font-weight:600}`;
    document.head.appendChild(css);
  }

  function mountDaily(container) {
    const root = typeof container === "string" ? document.querySelector(container) : container;
    if (!root) return;
    const now = new Date();
    const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const p = PRINCIPLES_ALL[doy % PRINCIPLES_ALL.length];
    root.innerHTML = '<details class="sm-card" open style="margin-bottom:8px"><summary><span class="sm-card-emoji">' + p.emoji +
      '</span> Принцип дня: ' + SixMin.esc(p.title) + '</summary><p>' + SixMin.esc(p.text) + "</p></details>";
  }
  window.SixMinTheory = { mountCards, mountDaily, randomQuote, getRandomQuote, showSuccessQuote, QUOTES, PRINCIPLES: PRINCIPLES_ALL };
})();
window.__v02stage = "after-sixmin-theory"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-theory");

// app/js/sixmin-shifts.js — v0.6.10: модуль смен (порт ShiftMeet, MWM studio)
//  - цикл 5 дней от якорной даты; терминология владельца: «🏭 На заводе» только смены,
//    «🏢 В офисе» все свободные дни; приоритет: отпуск > завод > офис/праздник;
//  - НЕТ чужого графика по умолчанию: пока пользователь не сохранил свой профиль смен,
//    показывается карточка настройки («Настройте свой график»), а не расписание по умолчанию;
//  - дни рождения (опционально): свои в настройках + участников кругов из серверной функции;
//  - общие свободные дни круга (пересечение графиков участников, кто поделился);
//  - статистика «дни в офисе / часы на заводе», поиск свободных дней (сворачиваемый),
//    отпуска, табло праздников, настройки якоря/часов/цикла/видимости.
// API: SixMinShifts.mount(container)
(function () {
  const HOLIDAYS = {
    "2026-05-01": "1 Мая", "2026-05-04": "4 Мая", "2026-05-09": "9 Мая",
    "2026-05-11": "11 Мая", "2026-06-12": "12 Июня", "2026-11-04": "4 Ноября",
  };
  const DEF = { anchor: "2026-04-27", cycle: ["night", "rest", "off", "day", "off"], hours: 12, name: "Мой график" };
  const SHIFT_NAMES = { night: "🌙 Ночь", rest: "💤 Отсыпной", off: "🏠 Выходной", day: "☀️ День", hol: "🎉 Праздник", bday: "🎂 День рождения" };
  // v0.7.0: графиков может быть НЕСКОЛЬКО (офис + завод): у каждого свой цикл.
  // J — списки работ; P — личные настройки человека (день рождения, видимость для кругов).
  let root = null, P = null, J = [], V = [], loggedOut = false, resCache = null, CIRC = [], editing = null, E = [];
  let editingTypes = {}; // v0.7.8: кастомные типы дней редактируемого графика
  const plRu = (n, f) => { const a = Math.abs(n) % 100, b = a % 10; return (a > 10 && a < 20) ? f[2] : (b > 1 && b < 5) ? f[1] : (b === 1) ? f[0] : f[2]; };

  const parse = (k) => SixMin.parseKey(k);
  const key = (d) => SixMin.fmtKey(d);
  const esc = SixMin.esc;

  const jobCycle = (job) => (Array.isArray(job.cycle) && job.cycle.length >= 2) ? job.cycle : DEF.cycle;
  // v0.7.4: начало/конец смены по типам дня (день/ночь) у каждого графика
  const DEF_TIMES = { day: ["07:30", "19:30"], night: ["19:30", "07:30"] };
  function timesOf(job) {
    const st = (job && job.shift_times) || {};
    const g = (tp) => (Array.isArray(st[tp]) && st[tp][0] && st[tp][1]) ? [String(st[tp][0]), String(st[tp][1])] : DEF_TIMES[tp];
    return { day: g("day"), night: g("night") };
  }
  function jobShift(k, job) {
    const cyc = jobCycle(job);
    const a = parse(job.anchor_date || DEF.anchor);
    const diff = Math.round((parse(k) - a) / 86400000);
    return cyc[((diff % cyc.length) + cyc.length) % cyc.length];
  }
  // v0.7.8: кастомные типы дней (тренировка/выгул/спа…) = занятое время с интервалом
  const namesOf = (job) => Object.assign({}, SHIFT_NAMES,
    Object.fromEntries(Object.entries((job && job.shift_types) || {}).map(([k, v]) => [k, (v && v.label) || k])));
  const isWorkType = (job, tp) => tp === "day" || tp === "night" || !!(((job && job.shift_types) || {})[tp]);
  function timesOfType(job, tp) {
    const ct = ((job && job.shift_types) || {})[tp];
    if (ct) return [ct.from || "00:00", ct.to || "00:00"];
    return timesOf(job)[tp] || [];
  }
  const curNames = () => Object.assign({}, SHIFT_NAMES,
    Object.fromEntries(Object.entries(editingTypes || {}).map(([k, v]) => [k, (v && v.label) || k])));
  // v0.8.29: область действия отпуска — по графикам (job_ids; пусто = все, как раньше).
  let VM = null; // кэш день->отпуск, сбрасывается в load()
  function vacMap() {
    const m = new Map();
    for (const v of V || []) {
      let d = parse(v.start_date);
      for (let i = 0; i < v.days; i++) { m.set(key(d), v); d = new Date(d.getTime() + 86400000); }
    }
    return m;
  }
  const vacOn = (k) => (VM || (VM = vacMap())).get(k) || null;
  const vacFully = (k) => {
    const v = vacOn(k);
    if (!v) return false;
    const ids = v.job_ids || [];
    return !ids.length || (J || []).every((j) => ids.includes(j.id));
  };
  function jobsActive(k) {
    const v = vacOn(k);
    if (!v) return J || [];
    const ids = v.job_ids || [];
    if (!ids.length) return [];
    return (J || []).filter((j) => !ids.includes(j.id));
  }
  // v0.8.28: «занято» (любой график с интервалом в этот тип дня, включая ритуалы)
  // и «работа» (только графики с флагом work) — разные вещи: день с одним выгулом
  // собак — свободный день с занятым вечером, а не смена.
  const occupiedOn = (k) => jobsActive(k).filter((j) => isWorkType(j, jobShift(k, j))); // v0.8.29: отпуск выводит график из дня
  const workJobsOn = (k) => occupiedOn(k).filter((j) => j.work !== false);
  // v0.7.6: перекрытие считаем ПО ВРЕМЕНИ: интервалы смены в минутах суток
  // (ночь через полночь = два отрезка). Нижний по приоритету график перекрывается
  // только если его интервал ПЕРЕСЕКАЕТСЯ с интервалом старшего; иначе оба активны
  // (завод до 19:30 и спортзал с 20:30 — не пересекаются, день занят оба интервала).
  const toMin = (hm) => { const p = String(hm || "").split(":"); return (+p[0] || 0) * 60 + (+p[1] || 0); };
  const minToHM = (m) => String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  function dayIntervals(k, job) {
    const tp = jobShift(k, job);
    const tm = timesOfType(job, tp) || [];
    if (!tm.length) return [[0, 1440]];
    const s = toMin(tm[0]), e = toMin(tm[1]);
    if (e === s) return [[0, 1440]];
    return e > s ? [[s, e]] : [[s, 1440], [0, e]];
  }
  function splitWork(k) {
    const act = [], masked = [];
    for (const j of occupiedOn(k)) { // v0.8.28: ритуалы участвуют в интервалах/перекрытиях/окнах
      const iv = dayIntervals(k, j);
      const hit = act.some((a) => a.iv.some((r1) => iv.some((r2) => r1[0] < r2[1] && r2[0] < r1[1])));
      if (hit) masked.push(j); else act.push({ j, iv });
    }
    return { act, masked };
  }

  function vacSet() {
    const s = new Set();
    for (const v of V || []) {
      let d = parse(v.start_date);
      for (let i = 0; i < v.days; i++) { s.add(key(d)); d = new Date(d.getTime() + 86400000); }
    }
    return s;
  }
  // v0.8.28: единая строка «интервалы · перекрывает · окна · свободен после».
  // «свободен после X» показываем, только если после X ничего не начинается:
  // кейс 21.10 — ночь с 19:30, а строка обещала «свободен после 18:00».
  function busyMsg(k) {
    const { act, masked } = splitWork(k);
    const parts = act.map((a) => {
      const tp = jobShift(k, a.j);
      const tm = timesOfType(a.j, tp) || [];
      const lb = tp === "night" ? "🌙 ночь" : tp === "day" ? "☀️ день" : esc(namesOf(a.j)[tp] || tp);
      return lb + (tm.length ? " " + tm[0] + "–" + tm[1] : "") +
        ((J || []).length > 1 && lb.indexOf(a.j.name) < 0 ? " · " + a.j.name : ""); // v0.8.44: без дубля имени
    }).join(" + ");
    const ivs = act.flatMap((a) => a.iv);
    const ends = ivs.filter((r) => r[1] > r[0] && r[1] < 1440).map((r) => r[1]);
    const maxEnd = ends.length ? Math.max.apply(null, ends) : 0;
    const freeAfter = maxEnd && !ivs.some((r) => r[0] > maxEnd) ? minToHM(maxEnd) : "";
    const sorted = ivs.slice().sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const r of sorted) {
      const L = merged[merged.length - 1];
      if (L && r[0] <= L[1]) L[1] = Math.max(L[1], r[1]); else merged.push([r[0], r[1]]);
    }
    const wins = [];
    for (let i = 1; i < merged.length; i++)
      if (merged[i][0] - merged[i - 1][1] >= 60) wins.push(minToHM(merged[i - 1][1]) + "–" + minToHM(merged[i][0]));
    // v0.8.48: хвост «перекрывает: …» убран (вода по слову владельца): в строке дня
    // видим только приоритетные графики; masked не светится в интерфейсе.
    return { act, masked, msg: parts +
      (wins.length ? " · окно: " + wins.join(", ") : "") +
      (freeAfter ? " · свободен после " + freeAfter : "") };
  }

  // v0.7.0: «на заводе/в офисе» больше нет; v0.8.28: день СМЕНА только по РАБОЧИМ
  // графикам; ритуалы (work=false) дают свободный день с занятыми интервалами.
  function infoDay(k, vs) {
    if (vacFully(k)) return { loc: "🏖 отпуск", free: true, msg: "отпуск · полностью свободен" +
      (vacOn(k) && (vacOn(k).job_ids || []).length ? " (по выбранным графикам)" : ""), dot: "#f9ab00", kind: "vac" };
    if (HOLIDAYS[k]) return { loc: "🏖 праздник", free: true, msg: "праздник • полностью свободен", dot: "#f9ab00", kind: "hol" };
    const wj = workJobsOn(k);
    if (wj.length) {
      const bm = busyMsg(k);
      return { loc: "🏭 смена", free: false, msg: bm.msg, dot: "#E30613", kind: jobShift(k, bm.act[0].j) };
    }
    // v0.8.28: работы нет, но время занято ритуалами — день СВОБОДЕН с честной строкой
    if (occupiedOn(k).length) {
      const bm = busyMsg(k);
      return { loc: "🏢 свободен", free: true, msg: "занято: " + bm.msg, dot: "#30a46c", kind: jobShift(k, bm.act[0].j) };
    }
    const sp = (J || []).map((j) => ({ j, tp: jobShift(k, j) })).find((x) => x.tp === "bday" || x.tp === "hol");
    if (sp) return {
      loc: sp.tp === "bday" ? "🎂 день рождения" : "🎉 праздник",
      free: true,
      msg: (sp.tp === "bday" ? "день рождения" : "праздничный день") + " · полностью свободен" + ((J || []).length > 1 ? " · " + sp.j.name : ""),
      dot: "#f9ab00", kind: sp.tp,
    };
    const rests = (J || []).some((j) => jobShift(k, j) === "rest");
    return { loc: "🏢 свободен", free: true, msg: rests ? "💤 отсыпной · полностью свободен" : "выходной · полностью свободен", dot: "#30a46c", kind: rests ? "rest" : "off" };
  }
  function monthStats(y, m) {
    const vs = vacSet();
    let free = 0, work = 0, hours = 0, vac = 0;
    const perJob = {};
    const d = new Date(y, m, 1, 12);
    while (d.getMonth() === m) {
      const k = key(d);
      if (vacFully(k) || HOLIDAYS[k]) { free++; vac++; } // v0.8.29: частичный отпуск — день считается по оставшимся графикам
      else {
        const wj = workJobsOn(k);
        if (wj.length) {
          work++;
          // перекрытые другими графиками смены не считаем (splitWork)
          const { act } = splitWork(k);
          for (const a of act) {
            const pj = perJob[a.j.id] || (perJob[a.j.id] = { name: a.j.name, shifts: 0, hours: 0 });
            pj.shifts++; // v0.8.29: активные дни каждого графика отдельно (и ритуалов тоже)
            if (a.j.work === false) continue; // v0.8.28: часы ритуалов — не рабочие часы
            const h = parseInt(a.j.shift_hours, 10) || 0;
            hours += h;
            pj.hours += h;
          }
        } else free++;
      }
      d.setDate(d.getDate() + 1);
    }
    return { free, work, hours, vac, perJob };
  }
  // v0.7.7: живые текущие дата и время наверху карточки
  let nowTimer = null;
  function updateNow() {
    const el = root && root.querySelector(".sm-sh-now");
    if (!el) return;
    const s = new Date().toLocaleString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    el.textContent = "Сегодня: " + s;
  }
  function bdayInfo(birthday, fromKey) {
    if (!birthday) return null;
    const md = String(birthday).slice(5, 10);
    const base = parse(fromKey);
    for (let add = 0; add < 366; add++) {
      const d = new Date(base.getTime() + add * 86400000);
      if (key(d).slice(5, 10) === md) return { key: key(d), inDays: add };
    }
    return null;
  }

  async function load() {
    let uid = null;
    try { uid = await SixMin.uid(); } catch (e) { uid = null; }
    loggedOut = !uid;
    CIRC = [];
    if (!uid) { P = null; J = []; V = []; return; }
    const sb = SixMin.sb();
    const { data: pr } = await sb.from("shift_profiles").select("*").eq("user_id", uid).maybeSingle();
    P = pr || null;
    const { data: jb } = await sb.from("shift_jobs").select("*").eq("user_id", uid)
      .order("sort", { ascending: true }).order("updated_at", { ascending: true });
    J = jb || [];
    const { data: vc } = await sb.from("shift_vacations").select("*").eq("user_id", uid).order("start_date");
    V = vc || [];
    VM = null; // v0.8.29: сброс кэша день->отпуск
    if (J.length) {
      const { data: ms } = await sb.from("circle_members").select("circle_id").eq("user_id", uid);
      const ids = (ms || []).map((r) => r.circle_id);
      if (ids.length) {
        const { data: cs } = await sb.from("circles").select("id, name").in("id", ids);
        for (const c of cs || []) {
          const { data: rows } = await sb.rpc("circle_shifts_and_birthdays", { p_circle: c.id });
          const rj = await sb.rpc("circle_jobs", { p_circle: c.id });
          CIRC.push({ id: c.id, name: c.name, members: rows || [], jobs: (rj.error ? [] : (rj.data || [])) });
        }
        // v0.8.0: мероприятия с приглашениями (мои круги, неделя назад и дальше)
        const { data: ev } = await sb.from("shift_events")
          .select("*, shift_event_rsvp(user_id,status)")
          .in("circle_id", ids)
          .gte("date", key(new Date(Date.now() - 7 * 86400000)))
          .order("date");
        E = ev || [];
      }
    }
    redrawAmExtra(); // v0.8.43: круги загружены — обновляем утреннюю подсказку
  }

  const canonTypes = (o) => JSON.stringify(Object.keys(o || {}).sort().map((k) => [k, (o[k] || {}).label, (o[k] || {}).from, (o[k] || {}).to]));
  // v0.6.13+: сохранение с ОБРАТНЫМ ЧТЕНИЕМ: облако должно вернуть ровно то, что записали
  async function saveJob(job, insert) {
    const uid = await SixMin.uid();
    const row = {
      user_id: uid, name: job.name, anchor_date: job.anchor_date,
      cycle: job.cycle, shift_hours: job.shift_hours,
      shift_times: job.shift_times || DEF_TIMES, shift_types: job.shift_types || {},
      work: job.work !== false, // v0.8.28
      pay_per_day: job.pay_per_day == null ? null : Number(job.pay_per_day), // v0.8.29
      updated_at: new Date().toISOString(),
    };
    if (!insert) row.id = job.id;
    const { error } = await SixMin.sb().from("shift_jobs").upsert(row, { onConflict: "id" });
    if (error) { SixMin.toast("Ошибка: " + error.message); return false; }
    const q = insert
      ? await SixMin.sb().from("shift_jobs").select("id,name,anchor_date,cycle,shift_hours,shift_times,shift_types,work,pay_per_day").eq("user_id", uid).order("updated_at", { ascending: false }).limit(1).maybeSingle()
      : await SixMin.sb().from("shift_jobs").select("id,name,anchor_date,cycle,shift_hours,shift_times,shift_types,work,pay_per_day").eq("id", row.id).maybeSingle();
    const chk = q.data;
    const same = chk && String(chk.anchor_date) === String(row.anchor_date) &&
      JSON.stringify(chk.cycle) === JSON.stringify(row.cycle) &&
      parseInt(chk.shift_hours, 10) === parseInt(row.shift_hours, 10) && chk.name === row.name &&
      chk.work === row.work &&
      Number(chk.pay_per_day || 0) === Number(row.pay_per_day || 0) &&
      (chk.shift_times || DEF_TIMES).day[0] === row.shift_times.day[0] &&
      (chk.shift_times || DEF_TIMES).day[1] === row.shift_times.day[1] &&
      (chk.shift_times || DEF_TIMES).night[0] === row.shift_times.night[0] &&
      (chk.shift_times || DEF_TIMES).night[1] === row.shift_times.night[1] &&
      canonTypes(chk.shift_types) === canonTypes(row.shift_types);
    if (!same) {
      console.error("shift_jobs readback mismatch:", chk, row);
      SixMin.toast("⚠️ Запись ушла в облако, но вернулись другие данные — обновите страницу и проверьте");
    } else {
      SixMin.toast((insert ? "График добавлен: " : "График сохранён: ") + row.name + " (" + row.cycle.length + " дн.)");
    }
    editing = null;
    await load().catch((e) => console.error("shifts reload after save:", e));
    render(); renderBday();
    return true;
  }
  async function savePerson() {
    const uid = await SixMin.uid();
    const row = { user_id: uid, shared: !!(P && P.shared), birthday: (P && P.birthday) || null };
    const { error } = await SixMin.sb().from("shift_profiles").upsert(row, { onConflict: "user_id" });
    if (error) { SixMin.toast("Ошибка: " + error.message); return; }
    SixMin.toast("Сохранено: день рождения и видимость для кругов");
    await load().catch(() => {});
    render(); renderBday();
  }

  // ── редактор цепочки (v0.6.11, Video 16) ──
  function cycleEditorInner(cycle) {
    const NM = curNames();
    const opts = (sel) => Object.keys(NM).map((s) => '<option value="' + s + '"' + (s === sel ? " selected" : "") + ">" + esc(NM[s]) + "</option>").join("");
    const a0 = NM[cycle[0]] ? cycle[0] : "off";
    return '<label class="sm-sh-lbl">Какой день был в эту дату? <select class="sm-sh-atype">' + opts(a0) + "</select></label>" +
      '<p class="sm-sh-note">Цепочка дней по порядку, начиная с этого дня (минимум 2):</p>' +
      '<div class="sm-sh-cycle">' + cycle.map((c, i) =>
        '<span class="sm-sh-slot"><select data-cyc="' + i + '">' + opts(NM[c] ? c : "off") + "</select>" +
        (cycle.length > 2 ? '<button type="button" class="sm-sh-del" data-cycdel="' + i + '" title="Убрать этот день">×</button>' : "") + "</span>").join("") +
      '</div><div class="sm-sh-lbl"><button class="sm-sh-cycadd" type="button" data-cycadd="1">+ Добавить день</button></div>' +
      '<p class="sm-sh-note sm-sh-preview"></p>';
  }
  const cycleEditor = (cycle) => '<div class="sm-sh-editor">' + cycleEditorInner(cycle) + "</div>";
  function cycleOk(cycle) {
    if (!cycle || cycle.length < 2) { SixMin.toast("Цикл: минимум 2 дня"); return false; }
    if (!cycle.some((c) => c === "night" || c === "day" || !!(editingTypes || {})[c])) { SixMin.toast("Нужна хотя бы одна рабочая смена: ночь, день или свой тип"); return false; }
    return true;
  }
  function updatePreview(ed) {
    const pv = ed && ed.querySelector(".sm-sh-preview");
    if (!pv) return;
    const ld = ed.querySelector(".sm-sh-times-day"), ln = ed.querySelector(".sm-sh-times-night");
    const cyc0 = Array.from(ed.querySelectorAll("[data-cyc]")).map((s) => s.value);
    if (ld) ld.style.display = cyc0.includes("day") ? "" : "none";
    if (ln) ln.style.display = cyc0.includes("night") ? "" : "none";
    const anchorEl = root && root.querySelector(".sm-sh-anchor");
    const cyc = cyc0;
    const a = parse((anchorEl && anchorEl.value) || DEF.anchor);
    if (!a || !cyc.length) { pv.textContent = ""; return; }
    const idxOf = (d) => { const n = Math.round((d - a) / 86400000); return ((n % cyc.length) + cyc.length) % cyc.length; };
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const NM = curNames();
    pv.textContent = "Сегодня по этому циклу: " + (NM[cyc[idxOf(t)]] || cyc[idxOf(t)]) +
      ", завтра: " + (NM[cyc[idxOf(new Date(t.getTime() + 86400000))]] || cyc[idxOf(new Date(t.getTime() + 86400000))]) + ".";
  }
  function typesChipsHTML() {
    const es = Object.entries(editingTypes || {});
    if (!es.length) return '<span class="sm-sh-note">пока нет — добавьте, например, «тренировка» или «выгул собак».</span>';
    return es.map(([k, v]) => '<span class="sm-sh-day">' + esc(v.label) + " " + esc(v.from) + "–" + esc(v.to) +
      ' <b class="sm-sh-del" data-tdel="' + k + '" title="Убрать тип">×</b></span>').join("");
  }
  function refreshTypes(ed) {
    const NM = curNames();
    const opts = Object.keys(NM).map((s) => '<option value="' + s + '">' + esc(NM[s]) + "</option>").join("");
    const chips = ed.querySelector(".sm-sh-types-chips");
    if (chips) chips.innerHTML = typesChipsHTML();
    ed.querySelectorAll("[data-cyc]").forEach((s) => { const v = s.value; s.innerHTML = opts; s.value = NM[v] ? v : "off"; });
    const at = ed.querySelector(".sm-sh-atype");
    if (at) { const v = at.value; at.innerHTML = opts; at.value = NM[v] ? v : "off"; }
    updatePreview(ed);
  }
  function readEditor(ed) {
    const nameEl = root.querySelector(".sm-sh-name");
    const anchorEl = root.querySelector(".sm-sh-anchor");
    const hoursEl = root.querySelector(".sm-sh-hours");
    return {
      name: ((nameEl && nameEl.value.trim()) || DEF.name).slice(0, 40),
      anchor_date: (anchorEl && anchorEl.value) || DEF.anchor,
      cycle: Array.from(ed.querySelectorAll("[data-cyc]")).map((s) => s.value),
      shift_hours: parseInt((hoursEl && hoursEl.value), 10) || DEF.hours,
      shift_times: {
        day: [(root.querySelector(".sm-sh-dayfrom") || {}).value || DEF_TIMES.day[0], (root.querySelector(".sm-sh-dayto") || {}).value || DEF_TIMES.day[1]],
        night: [(root.querySelector(".sm-sh-nightfrom") || {}).value || DEF_TIMES.night[0], (root.querySelector(".sm-sh-nightto") || {}).value || DEF_TIMES.night[1]],
      },
      shift_types: JSON.parse(JSON.stringify(editingTypes || {})),
      work: !((root.querySelector(".sm-sh-work") || {}).checked === false), // v0.8.28
      pay_per_day: (() => { const v = (root.querySelector(".sm-sh-pay") || {}).value; return (v === "" || v == null) ? null : Number(v); })(), // v0.8.29
    };
  }
  function jobEditorHTML(job) {
    return '<div class="sm-sh-editor">' +
      '<label class="sm-sh-lbl">Название графика <input type="text" class="sm-sh-name" maxlength="40" value="' + esc((job && job.name) || DEF.name) + '"></label>' +
      '<label class="sm-sh-lbl"><input type="checkbox" class="sm-sh-work" ' + ((job && job.work === false) ? "" : "checked") + '> Это работа: даёт «смены», часы и занятые дни. Снять галочку — график-ритуал (выгул, треня, спа): время занято, но день свободный</label>' +
      '<label class="sm-sh-lbl">Дата, про которую точно знаете (например, последняя смена) <input type="date" class="sm-sh-anchor" value="' + ((job && job.anchor_date) || DEF.anchor) + '"></label>' +
      '<div class="sm-sh-cycwrap">' + cycleEditorInner(jobCycle(job || {})) + "</div>" +
      '<div class="sm-sh-types"><div class="sm-sh-note">Свои типы дней (кроме день/ночь/отсыпной/выходной):</div>' +
      '<div class="sm-sh-types-chips sm-sh-dayslist">' + typesChipsHTML() + '</div>' +
      '<div class="sm-sh-lbl"><input type="text" class="sm-sh-tname" placeholder="Название, напр. 🏋️ Треня" maxlength="24">' +
      '<input type="time" class="sm-sh-tfrom" value="20:30"><input type="time" class="sm-sh-tto" value="22:30">' +
      '<button class="sm-sh-cycadd" type="button" data-tadd="1">+ тип</button></div></div>' +
      '<label class="sm-sh-lbl sm-sh-times-day"' + (jobCycle(job || {}).includes("day") ? "" : ' style="display:none"') + '>☀️ Дневная смена: с <input type="time" class="sm-sh-dayfrom" value="' + timesOf(job).day[0] + '"> до <input type="time" class="sm-sh-dayto" value="' + timesOf(job).day[1] + '"></label>' +
      '<label class="sm-sh-lbl sm-sh-times-night"' + (jobCycle(job || {}).includes("night") ? "" : ' style="display:none"') + '>🌙 Ночная смена: с <input type="time" class="sm-sh-nightfrom" value="' + timesOf(job).night[0] + '"> до <input type="time" class="sm-sh-nightto" value="' + timesOf(job).night[1] + '"></label>' +
      '<label class="sm-sh-lbl">Смена, часов <input type="number" class="sm-sh-hours" min="1" max="24" value="' + ((job && job.shift_hours) || DEF.hours) + '"></label>' +
      '<label class="sm-sh-lbl">Оплата за день, ₽ (необязательно) <input type="number" class="sm-sh-pay" min="0" max="1000000" placeholder="—" value="' + ((job && job.pay_per_day != null) ? esc(String(job.pay_per_day)) : "") + '"></label>' +
      '<div class="sm-sh-lbl"><button class="sm-sh-save" type="button" data-jsave="1">' + (job ? "Сохранить график" : "Создать график") + "</button>" +
      (job ? ' <button class="sm-sh-cycadd" type="button" data-jcancel="1">Отмена</button>' : "") +
      "</div></div>";
  }

  function setupHTML() {
    return '<div class="sm-sh">' +
      '<div class="sm-sh-head">🔥 Мои смены</div>' +
      '<p class="sm-sh-note">График смен личный у каждого: расскажите приложению про свой цикл — ' +
      "и оно покажет ВАШИ смены, отпуска и праздники, а в кругах найдёт общие свободные дни и дни рождения. " +
      "Работы две или больше? Создайте по графику на каждую — свободные дни считаются по всем сразу. " +
      "График без галочки «это работа» — ритуал (выгул, треня): время занято, но день считается свободным.</p>" +
      jobEditorHTML(null) +
      "</div>";
  }

  async function refresh() { await load().catch((e) => console.error("shifts load:", e)); render(); renderBday(); }

  function render() {
    if (!root) return;
    if (loggedOut) {
      root.innerHTML = '<div class="sm-sh"><div class="sm-sh-head">🔥 Мои смены</div>' +
        '<p class="sm-sh-note">Смены, отпуска и поиск свободных дней живут в облаке. ' +
        'Войдите в аккаунт — и карточка появится здесь.</p></div>';
      return;
    }
    if (!J.length) { editingTypes = {}; root.innerHTML = setupHTML(); wireSetup(); return; }
    const vs = vacSet();
    const today = key(new Date());
    const ti = infoDay(today, vs);
    const bdaysMine = (P && P.birthday && key(new Date()).slice(5, 10) === String(P.birthday).slice(5, 10)) ? " · 🎂 у вас день рождения!" : "";
    const strip = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(parse(today).getTime() + i * 86400000);
      const k = key(d);
      const inf = infoDay(k, vs);
      const bmark = circleBirthdaysOn(k);
      strip.push('<i class="sm-sh-dot' + (k === today ? " now" : "") + '" data-dayk="' + k + '" style="background:' + inf.dot + '" title="' +
        k.slice(8) + "." + k.slice(5, 7) + " · " + esc(inf.loc) + " · " + esc(inf.msg) +
        (bmark ? " · 🎂 " + esc(bmark) : "") + '"></i>');
    }
    const now = new Date();
    const cur = monthStats(now.getFullYear(), now.getMonth());
    const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prev = monthStats(prevD.getFullYear(), prevD.getMonth());
    const mName = (d) => d.toLocaleString("ru-RU", { month: "long", year: "numeric" });
    const jobsRows = (J || []).map((j) =>
      '<div class="sm-sh-row"><span><b>' + esc(j.name) + "</b> · цикл " + (jobCycle(j).length) + " дн · якорь " +
      String(j.anchor_date || "").slice(8, 10) + "." + String(j.anchor_date || "").slice(5, 7) +
      " · " + (parseInt(j.shift_hours, 10) || 0) + " ч" + (j.work === false ? " · ритуал (не работа)" : "") + " · сегодня " + esc(SHIFT_NAMES[jobShift(today, j)] || "") +
      '</span><span><button class="sm-sh-icbtn" type="button" data-jup="' + j.id + '" title="Выше приоритетом">↑</button> ' +
      '<button class="sm-sh-icbtn" type="button" data-jdown="' + j.id + '" title="Ниже приоритетом">↓</button> ' +
      '<button class="sm-sh-icbtn" type="button" data-jedit="' + j.id + '" title="Редактировать график">✏️</button> ' +
      '<button class="sm-sh-icbtn" type="button" data-jdel="' + j.id + '" title="Удалить график">×</button></span></div>').join("");
    const editJob = (editing && editing !== "__new") ? (J || []).find((j) => j.id === editing) : null;
    const editorHtml = (editing === "__new" || editJob) ? jobEditorHTML(editJob || null) : "";
    const perJobOn = (() => { try { return localStorage.getItem("sm-sh-perjob") !== "0"; } catch (e) { return true; } })();
    const pjLine = (st) => {
      const rows = Object.values(st.perJob || {});
      return rows.length ? rows.map((p) => esc(p.name) + ": " + p.shifts + " " + plRu(p.shifts, ["смена", "смены", "смен"]) + " · " + p.hours + " ч").join(" · ") : "смен не было";
    };
    const vacRows = (V || []).map((v) =>
      '<div class="sm-sh-row"><span>' + v.start_date.slice(8, 10) + "." + v.start_date.slice(5, 7) + "." + v.start_date.slice(0, 4) +
      " · " + v.days + " дн · " + esc(v.kind === "harm" ? "вредность (+7)" : v.kind === "extra" ? "дополнительный" : "основной") +
      ((v.job_ids || []).length ? " · графики: " + esc((v.job_ids || []).map((id) => (((J || []).find((j) => j.id === id)) || {}).name || "?").join(", ")) : " · все графики") +
      '</span><b class="sm-sh-del" data-vdel="' + v.id + '" title="Удалить отпуск">×</b></div>').join("");
    const holRows = Object.keys(HOLIDAYS).map((k) => {
      const inf = infoDay(k, vs);
      const wj = workJobsOn(k);
      return '<div class="sm-sh-row"><span>' + esc(HOLIDAYS[k]) + " · " + (wj.length ? "смена: " + esc(wj.map((x) => x.name).join(", ")) : "свободный день") +
        '</span><b style="color:' + (inf.free ? "#30a46c" : "#E30613") + '">' + (inf.free ? "свободен ✅" : "занят 🔴") + "</b></div>";
    }).join("");
    const resHtml = resCache
      ? '<details open class="sm-sh-reswrap"><summary>Результаты: ' + resCache.length +
        ' дн. <span class="sm-sh-hide">× скрыть</span></summary><div class="sm-sh-res">' +
        resCache.map((r) => '<div class="sm-sh-row sm-sh-dayrow' + (r.inf.free ? " free" : "") + '" data-dayk="' + r.k + '" title="Открыть детали дня"><span>' + r.k.slice(8, 10) + "." + r.k.slice(5, 7) +
        " " + r.wd + '</span><b>' + esc(r.inf.loc) + '</b><i class="sm-sh-msg">' + esc(r.inf.msg) +
        (r.bday ? " · 🎂 " + esc(r.bday) : "") + "</i></div>").join("") + "</div></details>"
      : "";
    root.innerHTML =
      '<div class="sm-sh">' +
      '<div class="sm-sh-head">🔥 Мои смены <button class="sm-ib" data-shinfo="1">i</button></div>' +
      '<div class="sm-sh-now"></div>' +
      '<div class="sm-sh-today">' + (ti.free ? esc(ti.loc) + ' · ' : '🏭 Сегодня работа в: ') + esc(ti.msg) + esc(bdaysMine) + '</div>' +
      '<div class="sm-sh-strip">' + strip.join("") + '</div>' +
      '<div class="sm-sh-legend"><span><i style="background:#E30613"></i>смена</span><span><i style="background:#30a46c"></i>свободен</span><span><i style="background:#f9ab00"></i>праздник/отпуск</span></div>' +
      '<div class="sm-sh-stats">' +
      // v0.8.30: итоги месяца — две карточки (влезают на телефон), а разбивка по
      // графикам — СТРОКАМИ в свёрнутом спойлере: флекс-карточки вылезали за экран (скрин 20.10).
      '<div class="sm-sh-stat"><b>🏭 ' + cur.work + ' дн. · ' + cur.hours + ' ч.</b><span>итого рабочие · ' + esc(mName(now)) + '</span><em>🏢 свободен: ' + cur.free + ' дн. · 🏖 отпуск/праздники: ' + cur.vac + ' дн.</em></div>' +
      '<div class="sm-sh-stat"><b>🏭 ' + prev.work + ' дн. · ' + prev.hours + ' ч.</b><span>итого рабочие · ' + esc(mName(prevD)) + '</span><em>🏢 свободен: ' + prev.free + ' дн.</em></div>' +
      '</div>' +
      '<details class="sm-sh-pjwrap"><summary>📊 По графикам: ' + esc(mName(now)) + ' — дни, часы и деньги каждого</summary>' +
      '<div class="sm-sh-pjrows">' + ((J || []).map((j) => {
        const st = cur.perJob[j.id];
        const shifts = st ? st.shifts : 0;
        const pay = j.pay_per_day != null ? Number(j.pay_per_day) : null;
        return '<div class="sm-sh-pjrow"><b>' + (j.work === false ? "🧘 " : "🏭 ") + esc(j.name) + '</b>' +
          '<span>' + shifts + " " + plRu(shifts, ["день", "дня", "дней"]) + " · " + (st ? st.hours : 0) + " ч.</span>" +
          (pay != null && shifts ? '<em>💰 ≈ ' + Math.round(shifts * pay).toLocaleString("ru-RU") + " ₽ (" + shifts + " × " + pay + ")</em>" : "") +
          (j.work === false ? "<span>ритуал · не рабочие дни</span>" : "") +
          "</div>";
      }).join("") || '<div class="sm-sh-pjrow"><span>графиков пока нет</span></div>') + '</div></details>' +
      '<div class="sm-sh-sec">Мои графики (' + (J || []).length + ')</div>' + jobsRows + editorHtml +
      '<div class="sm-sh-lbl"><button class="sm-sh-cycadd" type="button" data-jadd="1">+ Добавить график</button></div>' +
      circlesHTML(today) +
      eventsHTML() + eventFormHTML() +
      '<details class="sm-sh-secwrap"' + (resCache ? " open" : "") + '><summary>🔍 Найти свободные дни</summary>' +
      '<form class="sm-sh-find"><input type="date" class="sm-sh-from" value="' + today + '"><input type="date" class="sm-sh-to" value="' +
      key(new Date(now.getTime() + 30 * 86400000)) + '"><button class="sm-add-btn" type="submit">🧮</button></form>' +
      resHtml + '</details>' +
      '<details class="sm-sh-secwrap"><summary>🏖 Отпуски</summary>' +
      '<form class="sm-sh-vac"><input type="date" class="sm-sh-vstart"><input type="number" class="sm-sh-vdays" min="1" max="366" value="14" title="Дней">' +
      '<select class="sm-sh-vkind"><option value="main">основной</option><option value="harm">вредность (+7)</option><option value="extra">дополнительный</option></select>' +
      '<button class="sm-add-btn" type="submit">+</button>' +
      '<div class="sm-sh-vacjobs">Отпуск на графики: ' + ((J || []).map((j) =>
        '<label class="sm-sh-vacjob"><input type="checkbox" class="sm-vac-job" data-jid="' + j.id + '"> ' + esc(j.name) + '</label>').join("") || "нет графиков") +
      '<span class="sm-sh-note">ничего не отмечено — на все графики</span></div></form>' +
      (vacRows || '<p class="sm-sh-note">Отпусков не запланировано.</p>') + '</details>' +
      '<details class="sm-sh-secwrap"><summary>🎉 Праздники 2026</summary>' + holRows + '</details>' +
      '</div>';
    updateNow();
    wire();
  }

  // v0.7.9: клик по дню (лента или сводка поиска) → карточка деталей дня
  async function openDay(k) {
    const d = parse(k);
    const wd = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][d.getDay()];
    const vs = vacSet();
    const inf = infoDay(k, vs);
    const { act, masked } = splitWork(k);
    const rows = [];
    for (const a of act) {
      const tp = jobShift(k, a.j);
      const tm = timesOfType(a.j, tp) || [];
      rows.push("🏭 " + esc(namesOf(a.j)[tp] || tp) + (tm.length ? " " + tm[0] + "–" + tm[1] : "") + " · " + esc(a.j.name));
    }
    // v0.8.48: перекрытые графики в деталях не перечисляем (владелец: скрыть всё,
    // что перекрывается, оставить приоритет). Переменная masked больше не используется.
    if (inf.kind === "vac") rows.push("🏖 отпуск");
    if (HOLIDAYS[k]) rows.push("🎉 " + esc(HOLIDAYS[k]));
    const bday = circleBirthdaysOn(k);
    if (bday) rows.push("🎂 день рождения: " + esc(bday));
    for (const ev of (E || []).filter((x) => String(x.date) === k)) {
      const yes = (ev.shift_event_rsvp || []).filter((r) => r.status === "yes").length;
      rows.push("📅 событие " + (ev.time_from ? String(ev.time_from).slice(0, 5) + " " : "") + "«" + esc(ev.title) + "» · хозяин: " +
        esc(memberName(ev.owner_id)) + " · идут: " + yes);
    }
    let tasksNote = "";
    try {
      const uid = await SixMin.uid();
      const { data: tk } = await SixMin.sb().from("tasks")
        .select("title,due_date,due_time,remind_at,completed")
        .eq("user_id", uid)
        .or("due_date.eq." + k + ",remind_at.gte." + k + "T00:00,remind_at.lte." + k + "T23:59");
      for (const t of (tk || [])) {
        if (t.due_date === k)
          rows.push("⏰ дедлайн" + (t.due_time ? " " + String(t.due_time).slice(0, 5) : "") + ": " + esc(t.title) + (t.completed ? " ✅" : ""));
        if (t.remind_at && String(t.remind_at).slice(0, 10) === k)
          rows.push("🔔 напоминание " + String(t.remind_at).slice(11, 16) + ": " + esc(t.title));
      }
    } catch (e) { tasksNote = "<p>Задачи не загрузились: " + esc(String(e.message || e)) + "</p>"; }
    const html = '<p><b>' + esc(inf.loc) + " · " + esc(inf.msg) + "</b></p>" +
      (rows.length ? "<ul>" + rows.map((r) => "<li>" + r + "</li>").join("") + "</ul>"
        : "<p>Ни смен, ни задач — день полностью свободен.</p>") + tasksNote;
    SixMin.info(k.slice(8, 10) + "." + k.slice(5, 7) + " " + wd, html);
  }
  function memberName(uid) {
    if (P && uid === P.user_id) return "вы";
    for (const c of CIRC) for (const m of c.members) if (m.user_id === uid) return m.name;
    return "участник";
  }
  function pickOptions() {
    const today = key(new Date());
    const opts = [];
    for (const k of Object.keys(HOLIDAYS)) if (k >= today) opts.push('<option value="' + k + '">🎉 ' + esc(HOLIDAYS[k]) + "</option>");
    const bds = [];
    if (P && P.birthday) bds.push({ name: "у вас", b: P.birthday });
    for (const c of CIRC) for (const m of c.members) if (m.birthday && m.user_id !== (P && P.user_id)) bds.push({ name: m.name, b: m.birthday });
    const seen = new Set();
    for (const x of bds) {
      const bi = bdayInfo(x.b, today);
      if (bi && !seen.has(bi.key)) { seen.add(bi.key); opts.push('<option value="' + bi.key + '">🎂 ' + esc(x.name) + "</option>"); }
    }
    return opts.join("");
  }
  function eventsHTML() {
    if (!E.length) return "";
    const rows = (E || []).map((ev) => {
      const rsvps = ev.shift_event_rsvp || [];
      const yes = rsvps.filter((r) => r.status === "yes").length;
      const mine = rsvps.find((r) => r.user_id === (P && P.user_id));
      const circ = (CIRC.find((c) => c.id === ev.circle_id) || {}).name || "";
      const when = String(ev.date).slice(8, 10) + "." + String(ev.date).slice(5, 7) + (ev.time_from ? " " + String(ev.time_from).slice(0, 5) : "");
      return '<div class="sm-sh-row"><span>📅 ' + when + " · " + esc(ev.title) + " · " + esc(circ) + " · 👥 идут: " + yes +
        (ev.owner_id === (P && P.user_id) ? " · вы хозяин" : "") + "</span>" +
        (ev.owner_id === (P && P.user_id)
          ? '<b class="sm-sh-del" data-evdel="' + ev.id + '" title="Отменить событие">×</b>'
          : '<span><button class="sm-sh-icbtn" type="button" data-rsvp="' + ev.id + '" data-s="yes"' + (mine && mine.status === "yes" ? ' style="border-color:var(--accent,#E30613)"' : "") + '>иду</button> ' +
            '<button class="sm-sh-icbtn" type="button" data-rsvp="' + ev.id + '" data-s="no"' + (mine && mine.status === "no" ? ' style="border-color:var(--accent,#E30613)"' : "") + '>не могу</button></span>') +
        "</div>";
    }).join("");
    return '<div class="sm-sh-sec">📅 События моих кругов</div>' + rows;
  }
  function eventFormHTML() {
    if (!CIRC.length) return "";
    return '<details class="sm-sh-secwrap"><summary>📅 Событие с приглашением круга</summary>' +
      '<form class="sm-sh-ev" data-role="event">' +
      '<input class="sm-sh-ev-i" name="t" placeholder="Что: баня, кино, торт…" maxlength="60">' +
      '<select class="sm-sh-ev-i sm-sh-evpick" name="pick"><option value="">дата: выбрать из списка…</option>' + pickOptions() + '</select>' +
      '<input type="date" class="sm-sh-ev-i" name="d">' +
      '<input type="time" class="sm-sh-ev-i" name="f" value="19:00"><input type="time" class="sm-sh-ev-i" name="tt">' +
      '<select class="sm-sh-ev-i" name="c">' + CIRC.map((c) => '<option value="' + c.id + '">' + esc(c.name) + "</option>").join("") + '</select>' +
      '<button class="sm-sh-cycadd" type="submit">+ пригласить круг</button></form></details>';
  }
  function circleBirthdaysOn(k) {
    const names = new Set();
    for (const c of CIRC) for (const m of c.members) {
      if (m.birthday && String(m.birthday).slice(5, 10) === k.slice(5, 10)) names.add(m.name);
    }
    return Array.from(names).join(", ");
  }
  // ── v0.8.43: утренняя подсказка о ДР круга: «не напоминать / напомнить в дату» ──
  function bdayNoteState() {
    try { return JSON.parse(localStorage.getItem("sm-bday-note") || "{}"); } catch (e) { return {}; }
  }
  function bdayNoteSave(st) { try { localStorage.setItem("sm-bday-note", JSON.stringify(st)); } catch (e) {} }
  function circleSharedWin(c, today) {
    const memberJobs = {};
    for (const jr of (c.jobs || [])) (memberJobs[jr.user_id] = memberJobs[jr.user_id] || []).push(jr);
    const sharers = c.members.filter((m) => m.shared !== false && (memberJobs[m.user_id] || []).length);
    if (!sharers.length) return [];
    const win = [];
    for (let i = -90; i < 90; i++) {
      const k = key(new Date(parse(today).getTime() + i * 86400000));
      const freeAll = sharers.every((m) => (memberJobs[m.user_id] || []).filter((j) => j.work !== false).every((j) => {
        const s = jobShift(k, j);
        return s !== "day" && s !== "night" && !((j.shift_types || {})[s]);
      }));
      if (freeAll) win.push(k);
    }
    return win;
  }
  const fmtBD = (kk) => kk.slice(8, 10) + "." + kk.slice(5, 7) + " " + ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][parse(kk).getDay()];
  function bdayNotes(today) {
    const tk = key(parse(today));
    const st = bdayNoteState();
    const out = [];
    for (const c of CIRC) {
      const win = circleSharedWin(c, today);
      for (const m of c.members) {
        if (!m.birthday || m.user_id === (P && P.user_id)) continue;
        const md = String(m.birthday).slice(5, 10);
        const yr = parse(today).getFullYear();
        const cands = [];
        const bi = bdayInfo(m.birthday, today);
        if (bi) cands.push({ k: key(new Date(parse(today).getTime() + bi.inDays * 86400000)), inDays: bi.inDays, past: false });
        const kp = (md <= tk.slice(5, 10) ? yr + "-" + md : (yr - 1) + "-" + md);
        if (kp < tk) cands.push({ k: kp, inDays: 0, past: true });
        for (const cd of cands) {
          let dB = win.filter((x) => x < cd.k).pop() || "";
          let dA = win.find((x) => x > cd.k) || "";
          if (dB && (parse(cd.k) - parse(dB)) / 86400000 > 45) dB = "";
          if (dA && (parse(dA) - parse(cd.k)) / 86400000 > 45) dA = "";
          if (!dB && !dA) continue;
          const start = dB || cd.k, end = dA || cd.k;
          if (tk < start || tk > end) continue;
          const id = c.id + "|" + m.user_id + "|" + cd.k.slice(0, 4);
          const s = st[id];
          if (s && (s.d === 1 || (s.s && tk < s.s))) continue;
          out.push({ id: id, circle: c.name, name: m.name, k: cd.k, inDays: cd.inDays, past: cd.past,
            candDays: win.filter((x) => x >= tk && x <= end).slice(0, 2) });
          break;
        }
      }
    }
    return out.slice(0, 2);
  }
  function ritualsToday(today) {
    const tk = key(parse(today));
    const out = [];
    for (const j of (J || [])) {
      if (j.work !== false) continue;
      const tp = jobShift(tk, j);
      if (!tp) continue;
      const tm = timesOfType(j, tp) || [];
      out.push(esc(j.name) + (tm.length ? " " + tm[0] + "–" + tm[1] : ""));
    }
    return out;
  }
  // v0.8.45: «сколько сегодня свободно по силам» — бодрое окно 07:00–23:00 минус
  // занятые интервалы (смены + ритуалы, merge как в busyMsg). Ночь не считаем:
  // решение владельца 21.10.2026 (вариант «бодрое время 07–23 минус занято»).
  const WAKE_FROM = 420, WAKE_TO = 1380;
  const TASK_EM = { cream: "🍰", cherry: "🍒", fun: "🎈", high: "⚡", low: "📋" };
  function fmtDur(min) {
    const h = Math.floor(min / 60), m = min % 60;
    return h && m ? h + " ч " + m + " м" : (h ? h + " ч" : m + " м");
  }
  function freeDayInfo(k) {
    const { act } = splitWork(k);
    const ivs = act.flatMap((a) => a.iv).slice().sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const r of ivs) {
      const L = merged[merged.length - 1];
      if (L && r[0] <= L[1]) L[1] = Math.max(L[1], r[1]); else merged.push([r[0], r[1]]);
    }
    let busy = 0;
    for (const r of merged) {
      const s = Math.max(r[0], WAKE_FROM), e = Math.min(r[1], WAKE_TO);
      if (e > s) busy += e - s;
    }
    return { busy: busy, free: (WAKE_TO - WAKE_FROM) - busy };
  }
  function amExtraHTML(today) {
    const tk = key(parse(today));
    const fi = freeDayInfo(tk); // v0.8.45: строка «планируйте по силам»
    const freeLine = fi.busy > 0
      ? '<div class="sm-free-note"><span>⏳ Сегодня по графикам свободно около ' + fmtDur(fi.free) +
        ' (занято ' + fmtDur(fi.busy) + ') — планируйте по силам.</span></div>'
      : "";
    const open = window.__sixminTodayOpen || []; // v0.8.45: кэш задач от donetoday
    const rit = ritualsToday(today); // v0.8.44: напомнить о ритуалах на сегодня
    const actLine = open.length
      ? '<div class="sm-tasks-note"><span>📌 Задачи на сегодня: ' +
        open.slice(0, 4).map((t) => (TASK_EM[t.kind] || "✅") + " " +
        esc(t.title && t.title.trim() ? t.title : "(без названия)")).join(", ") +
        (open.length > 4 ? " + ещё " + (open.length - 4) : "") + '.</span></div>'
      : (rit.length ? '<div class="sm-bday-note"><span>🐾 Ритуалы сегодня: ' + rit.join(", ") + '.</span></div>' : "");
    const notesHtml = bdayNotes(today).map((n) =>
      '<div class="sm-bday-note"><span>🎂 Вы в курсе? В круге «' + esc(n.circle) + '» у ' + esc(n.name) +
      (n.past ? " ДР был " + fmtBD(n.k) : " ДР " + fmtBD(n.k) + (n.inDays ? " (через " + n.inDays + " дн.)" : "")) +
      (n.candDays.length ? ". Всем кругом можно собраться: " + n.candDays.map(fmtBD).join(", ") : "") +
      '.</span><span class="sm-bday-btns"><button class="sm-bday-btn" type="button" data-bday-dismiss="' + esc(n.id) + '">Больше не напоминать</button>' +
      n.candDays.map((d) => '<button class="sm-bday-btn" type="button" data-bday-snooze="' + esc(n.id + "|" + d) + '">Напомнить ' + fmtBD(d) + "</button>").join("") +
      "</span></div>").join("");
    return freeLine + actLine + notesHtml;
  }
  function redrawAmExtra() {
    if (!document.getElementById("sm-bday-css")) {
      const s = document.createElement("style");
      s.id = "sm-bday-css";
      s.textContent = ".sm-bday-note{margin:8px 0;padding:8px 10px;border-left:3px solid var(--accent,#E30613);background:rgba(227,6,19,.08);border-radius:8px;font-size:13px;line-height:1.5}" +
        ".sm-bday-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}" +
        ".sm-bday-btns button{background:transparent;border:1px solid var(--accent,#E30613);color:var(--accent,#E30613);border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer}" +
        ".sm-tasks-note{margin:8px 0;padding:8px 10px;border-left:3px solid #30a46c;background:rgba(48,164,108,.10);border-radius:8px;font-size:13px;line-height:1.5}" +
        ".sm-free-note{margin:8px 0;padding:8px 10px;border-left:3px solid #4f8cff;background:rgba(79,138,255,.10);border-radius:8px;font-size:13px;line-height:1.5}";
      document.head.appendChild(s);
    }
    const host = document.getElementById("am-extra");
    if (host) host.innerHTML = amExtraHTML(key(new Date()));
  }
  window.SixMinAmExtraHTML = amExtraHTML;
  window.SixMinAmRedraw = redrawAmExtra; // v0.8.45: donetoday дёргает после load()
  document.addEventListener("click", (e) => {
    const dis = e.target.closest("[data-bday-dismiss]");
    const sno = e.target.closest("[data-bday-snooze]");
    if (!dis && !sno) return;
    const st = bdayNoteState();
    if (dis) st[dis.getAttribute("data-bday-dismiss")] = { d: 1 };
    else { const pp = sno.getAttribute("data-bday-snooze").split("|"); st[pp[0]] = { s: pp[1] }; }
    bdayNoteSave(st);
    redrawAmExtra();
  });

  function circlesHTML(today) {
    if (!CIRC.length) return "";
    const nextBlocks = []; // v0.8.38: общие выходные кругов — одним спойлером внизу
    const bdayPeople = new Map(); // v0.8.41: именинник = одна строка со списком кругов
    const fmtK = (kk) => kk.slice(8, 10) + "." + kk.slice(5, 7) + " " + ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][parse(kk).getDay()]; // v0.8.41: на уровне функции
    let out = '<div class="sm-sh-sec">В моих кругах</div>';
    for (const c of CIRC) {
      const memberJobs = {};
      for (const jr of (c.jobs || [])) (memberJobs[jr.user_id] = memberJobs[jr.user_id] || []).push(jr);
      const sharers = c.members.filter((m) => m.shared !== false && (memberJobs[m.user_id] || []).length);
      // v0.8.35: прозрачность расчёта — кого считаем, кого нет и почему
      const counted = sharers.map((m) => memberName(m.user_id));
      const silent = c.members.filter((m) => sharers.indexOf(m) < 0)
        .map((m) => memberName(m.user_id) + (m.shared === false ? " — скрыл(а) график" : " — пока без графика"));
      const legend = "Учтены: " + (counted.length ? esc(counted.join(", ")) : "никто") +
        (silent.length ? " · Не учтены: " + esc(silent.join("; ")) : "");
      const sharedDays = [];
      const sharedAll = []; // v0.8.36: общие свободные за 90 дней — для «ближайших трёх»
      const sharedWin = []; // v0.8.39: общие свободные ±90 дней — окно предупреждения о ДР
      const whyRows = []; // v0.8.34: кто занят по дням — объяснение «почему нет общих»
      for (let i = -90; i < 90; i++) {
        const k = key(new Date(parse(today).getTime() + i * 86400000));
        if (!sharers.length) break;
        const busy = [];
        const busyIds = {}; // v0.8.37: чтобы показать, кто свободен в этот день
        for (const m of sharers) for (const j of (memberJobs[m.user_id] || []).filter((x) => x.work !== false)) {
          const s = jobShift(k, j);
          if (s === "day" || s === "night" || (j.shift_types || {})[s]) { busy.push(memberName(m.user_id) + ": " + j.job_name); busyIds[m.user_id] = 1; }
        }
        const freeNames = sharers.filter((m) => !busyIds[m.user_id]).map((m) => memberName(m.user_id));
        if (i >= 0 && i < 14) whyRows.push(k.slice(8, 10) + "." + k.slice(5, 7) + " " + ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][parse(k).getDay()] + " — " +
          (busy.length ? esc(busy.join(", ")) + (freeNames.length ? " · свободны: " + esc(freeNames.join(", ")) : "") : "все свободны"));
        const freeAll = sharers.every((m) => (memberJobs[m.user_id] || []).filter((j) => j.work !== false).every((j) => {
          // v0.8.28: общий свободный день портят только РАБОЧИЕ графики (любой занятый тип);
          // ритуалы участников (work=false) день круга не отменяют
          const s = jobShift(k, j);
          return s !== "day" && s !== "night" && !((j.shift_types || {})[s]);
        }));
        if (freeAll) {
          if (i >= 0 && i < 14) sharedDays.push(k.slice(8) + "." + k.slice(5, 7));
          if (i >= 0) sharedAll.push(k.slice(8, 10) + "." + k.slice(5, 7) + " " + ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][parse(k).getDay()]);
          sharedWin.push(k);
        }
      }
      // v0.8.39: предупреждение о ДР — только внутри интервала общих свободных дней вокруг даты
      const tk = key(parse(today));
      for (const m of c.members) {
        if (!m.birthday) continue;
        if (m.user_id === (P && P.user_id)) continue; // v0.8.40: своё ДР имениннику не показываем (кругу — да)
        const md = String(m.birthday).slice(5, 10);
        const yr = parse(today).getFullYear();
        const cands = [];
        const bi = bdayInfo(m.birthday, today);
        if (bi) cands.push({ k: key(new Date(parse(today).getTime() + bi.inDays * 86400000)), inDays: bi.inDays, past: false });
        const kp = (md <= tk.slice(5, 10) ? yr + "-" + md : (yr - 1) + "-" + md);
        if (kp < tk) cands.push({ k: kp, inDays: 0, past: true });
        for (const cd of cands) {
          const bef = sharedWin.filter((x) => x < cd.k);
          const aft = sharedWin.filter((x) => x > cd.k);
          let dB = bef.length ? bef[bef.length - 1] : "";
          let dA = aft.length ? aft[0] : "";
          // v0.8.39b: общий свободный день учитывается, только если он в 45 днях от ДР
          if (dB && (parse(cd.k) - parse(dB)) / 86400000 > 45) dB = "";
          if (dA && (parse(dA) - parse(cd.k)) / 86400000 > 45) dA = "";
          if (!dB && !dA) continue;
          const start = dB || cd.k, end = dA || cd.k;
          if (tk < start || tk > end) continue;
          const ago = Math.round((parse(today) - parse(cd.k)) / 86400000);
          const rec = bdayPeople.get(m.user_id) || {
            name: m.name,
            label: cd.past ? "ДР был " + fmtK(cd.k) + " (" + ago + " дн. назад)" : (cd.inDays === 0 ? "сегодня!" : "через " + cd.inDays + " дн. (" + fmtK(cd.k) + ")"),
            sortKey: cd.past ? -ago : cd.inDays,
            circles: [],
          };
          rec.circles.push(c.name);
          bdayPeople.set(m.user_id, rec);
          break;
        }
      }
      if (sharers.length) nextBlocks.push({ name: c.name, all: sharedAll });
      out += '<div class="sm-sh-circle"><b>🤝 ' + esc(c.name) + "</b>" +
        (sharedDays.length ? '<details class="sm-sh-days"><summary class="sm-sh-row free"><span>Общие свободные дни (14 дн): ' + sharedDays.length + " дн. — развернуть</span></summary>" +
          '<div class="sm-sh-dayslist">' + sharedDays.map((d) => '<span class="sm-sh-day">' + esc(d) + "</span>").join("") + "</div>" +
          '<div class="sm-sh-day-busy">' + legend + "</div></details>"
          : (sharers.length ? '<details class="sm-sh-days"><summary class="sm-sh-row"><span>Общих свободных дней на ближайших 14 нет — почему? кто занят по дням</span></summary>' +
            '<div class="sm-sh-dayslist"><div class="sm-sh-day-busy">' + legend + '</div>' + whyRows.map((r) => '<div class="sm-sh-day-busy">' + r + '</div>').join("") + '</div></details>' :
            '<div class="sm-sh-row"><span>' + legend + "</span></div>")) +
        "</div>";
    }
    if (bdayPeople.size) {
      const recs = Array.from(bdayPeople.values()).sort((a, b) => a.sortKey - b.sortKey);
      out += '<details class="sm-sh-secwrap"><summary>🎂 Ближайшие дни рождения</summary>' +
        recs.map((r) => '<div class="sm-sh-row"><span>🎂 ' + esc(r.name) + " — " + r.label +
          " · круги: " + esc(r.circles.join(", ")) + "</span></div>").join("") +
        "</details>";
    }
    if (nextBlocks.length) {
      out += '<details class="sm-sh-secwrap"><summary>🗓 Общие выходные в моих кругах</summary>' +
        nextBlocks.map((b) => b.all.length
          ? '<details class="sm-sh-days"><summary class="sm-sh-row free"><span>🤝 ' + esc(b.name) + ": " + b.all.length +
            " дн. за 90 дней · ближайший " + esc(b.all[0]) + '</span></summary><div class="sm-sh-dayslist">' +
            b.all.map((d) => '<span class="sm-sh-day">' + esc(d) + "</span>").join("") + "</div></details>"
          : '<div class="sm-sh-row"><span>🤝 ' + esc(b.name) + ": в ближайшие 90 дней нет</span></div>").join("") +
        "</details>";
    }
    return out;
  }

  function wireSetup() {
    root.querySelector("[data-jsave]")?.addEventListener("click", async () => {
      const ed = root.querySelector(".sm-sh-editor");
      const job = readEditor(ed);
      if (!cycleOk(job.cycle)) return;
      if (!P) {
        const uid = await SixMin.uid();
        const r = await SixMin.sb().from("shift_profiles").upsert({ user_id: uid, shared: true }, { onConflict: "user_id" });
        if (!r.error) P = { user_id: uid, shared: true, birthday: null };
      }
      await saveJob(job, true);
    });
    updatePreview(root.querySelector(".sm-sh-editor"));
  }
  function wire() {
    root.querySelector("[data-shinfo]")?.addEventListener("click", () => SixMin.info("Мои смены",
      "<p>Графиков может быть несколько (например, офис и завод): у каждого свой цикл дней от своей якорной даты. " +
      "День считается <b>🏭 сменой</b>, если занята хотя бы одна работа; <b>🏢 свободен</b> — если свободны все. " +
      "Если смены нескольких графиков пересекаются ПО ВРЕМЕНИ, верхний в списке «Мои графики» " +
      "(порядок = приоритет, стрелки ↑↓) перекрывает нижний. Если интервалы не пересекаются " +
      "(завод до 19:30, спортзал с 20:30) — день занят оба интервала, и то и другое видно в статусе." +
      "Приоритет: отпуск → праздник → смена. Графики видят участники ваших кругов, если в «Настройках» " +
      "включена видимость; дни рождения приходят из кругов и попадают в подсказки и поиск.</p>"));
    root.querySelector(".sm-sh-reswrap .sm-sh-hide")?.addEventListener("click", (e) => {
      e.preventDefault(); resCache = null; render();
    });
    root.querySelector(".sm-sh-find")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const a = root.querySelector(".sm-sh-from").value, b = root.querySelector(".sm-sh-to").value;
      if (!a || !b) { SixMin.toast("Выберите даты"); return; }
      const wd = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
      resCache = [];
      let d = parse(a);
      const end = parse(b);
      while (d <= end && resCache.length < 90) {
        const k = key(d);
        resCache.push({ k, wd: wd[d.getDay()], inf: infoDay(k, vs()), bday: circleBirthdaysOn(k) });
        d = new Date(d.getTime() + 86400000);
      }
      render();
    });
    function vs() { return vacSet(); }
    root.querySelector(".sm-sh-vac")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const s = root.querySelector(".sm-sh-vstart").value;
      const days = parseInt(root.querySelector(".sm-sh-vdays").value, 10) || 0;
      const kind = root.querySelector(".sm-sh-vkind").value;
      if (!s || days < 1) { SixMin.toast("Укажите дату начала и число дней"); return; }
      const uid = await SixMin.uid();
      // v0.8.29: область отпуска: отмеченные графики; пусто = все (прежнее поведение)
      const jobIds = Array.from(root.querySelectorAll(".sm-vac-job:checked")).map((el) => el.dataset.jid);
      const { error } = await SixMin.sb().from("shift_vacations").insert({ user_id: uid, start_date: s, days, kind, job_ids: jobIds });
      if (error) { SixMin.toast("Ошибка: " + error.message); return; }
      SixMin.toast("Отпуск добавлен");
      await load().catch(() => {}); render();
    });
    root.querySelectorAll("[data-vdel]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Удалить этот отпуск из плана?")) return;
      const rv = await SixMin.sb().from("shift_vacations").delete().eq("id", b.dataset.vdel);
      if (rv.error) { SixMin.toast("Не удалось удалить отпуск: " + rv.error.message); return; }
      await load().catch(() => {}); render();
    }));
    const moveJob = async (id, dir) => {
      const arr = (J || []).slice();
      const i = arr.findIndex((j) => j.id === id);
      const t = i + dir;
      if (i < 0 || t < 0 || t >= arr.length) return;
      [arr[i], arr[t]] = [arr[t], arr[i]];
      const sb = SixMin.sb();
      for (let k2 = 0; k2 < arr.length; k2++) await sb.from("shift_jobs").update({ sort: k2 }).eq("id", arr[k2].id);
      await load().catch(() => {}); render();
    };
    root.querySelectorAll("[data-jup]").forEach((b) => b.addEventListener("click", () => moveJob(b.dataset.jup, -1)));
    root.querySelectorAll("[data-jdown]").forEach((b) => b.addEventListener("click", () => moveJob(b.dataset.jdown, 1)));
    root.querySelector('form[data-role="event"]')?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const title = f.t.value.trim(), date = f.d.value, circle = f.c.value;
      if (!title || !date || !circle) { SixMin.toast("Нужны название, дата и круг"); return; }
      const uid = await SixMin.uid();
      const { error } = await SixMin.sb().from("shift_events").insert({
        owner_id: uid, circle_id: circle, title, date,
        time_from: f.f.value || null, time_to: f.tt.value || null,
      });
      if (error) { SixMin.toast("Ошибка: " + error.message); return; }
      SixMin.toast("Событие создано: круг увидит его в «Мои смены» и в деталях дня");
      await load().catch(() => {}); render();
    });
    root.querySelector(".sm-sh-evpick")?.addEventListener("change", (e) => {
      const d = root.querySelector('form[data-role="event"] [name="d"]');
      if (d && e.target.value) d.value = e.target.value;
    });
    root.querySelectorAll("[data-rsvp]").forEach((b) => b.addEventListener("click", async () => {
      const uid = await SixMin.uid();
      const { error } = await SixMin.sb().from("shift_event_rsvp")
        .upsert({ event_id: b.dataset.rsvp, user_id: uid, status: b.dataset.s }, { onConflict: "event_id,user_id" });
      if (error) { SixMin.toast("Ошибка: " + error.message); return; }
      await load().catch(() => {}); render();
    }));
    root.querySelectorAll("[data-evdel]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Отменить событие и убрать приглашения?")) return;
      const re = await SixMin.sb().from("shift_events").delete().eq("id", b.dataset.evdel);
      if (re.error) { SixMin.toast("Не удалось отменить событие: " + re.error.message); return; }
      await load().catch(() => {}); render();
    }));
    root.querySelector("[data-perjob]")?.addEventListener("click", (e) => {
      try { localStorage.setItem("sm-sh-perjob", e.currentTarget.dataset.perjob); } catch (err) {}
      render();
    });
    root.querySelector("[data-jadd]")?.addEventListener("click", () => {
      editing = "__new"; editingTypes = {}; render();
      root.querySelector(".sm-sh-editor")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    root.querySelectorAll("[data-jedit]").forEach((b) => b.addEventListener("click", () => {
      editing = b.dataset.jedit;
      const ej = (J || []).find((x) => x.id === editing);
      editingTypes = JSON.parse(JSON.stringify((ej && ej.shift_types) || {}));
      render();
      root.querySelector(".sm-sh-editor")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
    root.querySelectorAll("[data-jdel]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Удалить этот график? Остальные графики останутся.")) return;
      const rj = await SixMin.sb().from("shift_jobs").delete().eq("id", b.dataset.jdel);
      if (rj.error) { SixMin.toast("Не удалось удалить график: " + rj.error.message); return; }
      editing = null;
      await load().catch(() => {}); render();
    }));
    root.querySelector("[data-jcancel]")?.addEventListener("click", () => { editing = null; render(); });
    root.querySelector("[data-jsave]")?.addEventListener("click", async () => {
      const ed = root.querySelector(".sm-sh-editor");
      const job = readEditor(ed);
      if (!cycleOk(job.cycle)) return;
      const insert = !editing || editing === "__new";
      if (!insert) job.id = editing;
      await saveJob(job, insert);
    });
    updatePreview(root.querySelector(".sm-sh-editor"));
  }

  function injectStyles() {
    if (document.getElementById("sm-shifts-css")) return;
    const st = document.createElement("style");
    st.id = "sm-shifts-css";
    st.textContent = `
      .sm-sh{font-size:14px}
      .sm-sh-head{font-weight:800;font-size:16px;margin-bottom:8px;display:flex;gap:8px;align-items:center}
      .sm-sh-today{font-size:15px;font-weight:700;margin-bottom:8px}
      .sm-sh-now{font-size:12.5px;opacity:.75;margin:-2px 0 8px}
      .sm-sh-perjob{font-size:11.5px;opacity:.85;margin:-4px 0 10px;display:flex;flex-direction:column;gap:2px}
      .sm-sh-perjob-tgl{align-self:flex-start;background:none;border:0;color:var(--accent,#E30613);font-size:11.5px;cursor:pointer;padding:2px 0}
      .sm-sh-stat-rit{opacity:.8;border-style:dashed}
      .sm-sh-vacjobs{display:flex;gap:10px;flex-wrap:wrap;width:100%;font-size:12px;opacity:.9;margin-top:2px;align-items:center}
      .sm-sh-vacjob{display:inline-flex;gap:4px;align-items:center}
      .sm-sh-pjwrap{margin:-2px 0 10px;border:1px dashed rgba(128,128,128,.35);border-radius:12px;padding:2px 12px}
      .sm-sh-pjwrap>summary{cursor:pointer;list-style:none;font-size:12.5px;font-weight:700;opacity:.9;padding:9px 0}
      .sm-sh-pjwrap>summary::-webkit-details-marker{display:none}
      .sm-sh-pjwrap>summary::after{content:" ⌄";opacity:.7}
      .sm-sh-pjwrap[open]>summary::after{content:" ⌃"}
      .sm-sh-pjrows{display:flex;flex-direction:column;gap:7px;padding:0 0 10px}
      .sm-sh-pjrow{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;font-size:13px;width:100%}
      .sm-sh-pjrow b{flex:1 1 45%;min-width:0}
      .sm-sh-pjrow span{opacity:.85}
      .sm-sh-pjrow em{font-style:normal;color:var(--accent,#E30613);font-weight:700}
      .sm-sh-types{margin:8px 0;padding:8px;border:1px dashed var(--line,#333);border-radius:10px}
      .sm-sh-ev{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
      .sm-sh-ev-i{background:var(--inset,#1c1c1c);border:1px solid var(--line,#333);border-radius:8px;color:inherit;padding:6px;font-size:12px;color-scheme:dark}
      .sm-sh-strip{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px}
      .sm-sh-dot{width:14px;height:14px;border-radius:50%;display:inline-block;opacity:.85;cursor:pointer}
      .sm-sh-dayrow{cursor:pointer}
      .sm-sh-dayrow:hover{border-color:var(--accent,#E30613)}
      .sm-sh-dot.now{outline:2px solid var(--accent,#E30613);outline-offset:2px}
      .sm-sh-legend{display:flex;gap:12px;font-size:11px;opacity:.75;margin-bottom:10px;flex-wrap:wrap}
      .sm-sh-legend i{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:4px}
      .sm-sh-stats{display:flex;gap:8px;margin-bottom:10px}
      .sm-sh-stat{flex:1;background:var(--inset,#1c1c1c);border:1px solid var(--line,#333);border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:2px}
      .sm-sh-stat b{font-size:15px}.sm-sh-stat span{font-size:11px;opacity:.65}.sm-sh-stat em{font-style:normal;font-size:12px;color:var(--accent,#E30613)}
      .sm-sh-sec{font-weight:700;font-size:13px;margin:10px 0 6px;opacity:.85}
      .sm-sh-circle{margin-bottom:8px}
      .sm-sh-circle b{font-size:13px}
      .sm-sh-find,.sm-sh-vac{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
      .sm-sh-find input,.sm-sh-vac input,.sm-sh-vac select,.sm-sh-reswrap summary input{background:var(--inset,#1c1c1c);border:1px solid var(--line,#333);border-radius:8px;color:inherit;padding:6px;font-size:12px;color-scheme:dark}
      .sm-sh-row{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:6px 8px;border-radius:8px;background:var(--inset,#1c1c1c);margin-bottom:4px;font-size:13px;flex-wrap:wrap}
      .sm-sh-row.free{border-left:3px solid #30a46c}
      .sm-sh-msg{font-style:normal;font-size:11px;opacity:.7;width:100%}
      .sm-sh-del{cursor:pointer;opacity:.7;font-size:16px}
      .sm-sh-del:hover{color:var(--accent,#E30613);opacity:1}
      .sm-sh-note{font-size:12.5px;opacity:.7;line-height:1.5}
      .sm-sh-reswrap{margin-bottom:8px}
      .sm-sh-reswrap summary{cursor:pointer;font-size:13px;font-weight:700;opacity:.9}
      .sm-sh-hide{color:var(--accent,#E30613);font-weight:400;font-size:12px;margin-left:8px;cursor:pointer}
      .sm-sh-cfg{margin-top:10px;font-size:13px}
      .sm-sh-cfg summary{cursor:pointer;opacity:.85}
      .sm-sh-lbl{display:flex;gap:8px;align-items:center;margin:8px 0;font-size:12px;flex-wrap:wrap}
      .sm-sh-lbl input{background:var(--inset,#1c1c1c);border:1px solid var(--line,#333);border-radius:8px;color:inherit;padding:6px;font-size:12px;color-scheme:dark}
      .sm-sh-cycle{display:flex;gap:4px;flex-wrap:wrap}
      .sm-sh-cycle select{background:var(--inset,#1c1c1c);border:1px solid var(--line,#333);border-radius:8px;color:inherit;padding:5px;font-size:12px}
      .sm-sh-save{margin-top:8px;border:0;border-radius:10px;background:var(--accent,#E30613);color:#fff;font-weight:700;padding:8px 14px;cursor:pointer}
      .sm-sh-slot{display:inline-flex;align-items:center;gap:2px;padding:2px 6px 2px 0;border-right:1px dashed var(--line,#333);margin-right:4px}
      .sm-sh-slot:last-child{border-right:0;margin-right:0}
      .sm-sh-cycadd{white-space:nowrap;border:0;border-radius:10px;background:var(--accent,#E30613);color:#fff;font-weight:700;padding:7px 12px;cursor:pointer;font-size:12px}
      .sm-sh-cfg .sm-sh-save{position:sticky;bottom:12px;box-shadow:0 6px 14px rgba(0,0,0,.45)}
      .sm-sh-days summary{list-style:none;cursor:pointer}
      .sm-sh-days summary::-webkit-details-marker{display:none}
      .sm-sh-dayslist{display:flex;flex-wrap:wrap;gap:4px;padding:6px 8px}
      .sm-sh-day{background:var(--inset,#1c1c1c);border:1px solid var(--line,#333);border-radius:8px;padding:4px 8px;font-size:12px}
      .sm-sh-day-busy{font-size:12px;opacity:.85;margin:3px 0;line-height:1.45}
      .sm-sh-editor{margin:6px 0}
      .sm-sh-icbtn{background:var(--inset,#1c1c1c);border:1px solid var(--line,#333);border-radius:8px;padding:2px 9px;cursor:pointer;font-size:14px;color:inherit}
      .sm-sh-icbtn:hover{border-color:var(--accent,#E30613)}
      .sm-sh-secwrap{margin:10px 0}
      .sm-sh-secwrap summary{cursor:pointer;font-weight:700;font-size:13px;opacity:.85;list-style:none;padding:4px 0}
      .sm-sh-secwrap summary::-webkit-details-marker{display:none}
      .sm-sh-secwrap summary::before{content:"▶ ";font-size:10px;opacity:.6}
      .sm-sh-secwrap[open] summary::before{content:"▼ ";font-size:10px;opacity:.6}
    `;
    document.head.appendChild(st);
  }

  let bhost = null;
  function mountBdayCard() {
    const content = document.querySelector("#screen-settings .content");
    if (!content || document.getElementById("sm-bday-card")) return;
    const card = document.createElement("div");
    card.className = "card"; card.id = "sm-bday-card";
    card.innerHTML = '<h3>🎂 День рождения и видимость</h3><div class="sm-bd-host"></div>';
    // v0.8.44: владелец попросил место между «Облако» и «Telegram-бот»
    const tgH = Array.from(content.querySelectorAll("h3")).find((h) => h.textContent.indexOf("Telegram-бот") >= 0);
    const tgCard = tgH ? tgH.closest(".card") : null;
    if (tgCard) content.insertBefore(card, tgCard);
    else { const foot = content.querySelector("p.version"); content.insertBefore(card, foot || null); }
    bhost = card.querySelector(".sm-bd-host");
    bhost.addEventListener("click", async (e) => {
      if (!e.target.closest("[data-bdsave]")) return;
      if (!P) { const uid = await SixMin.uid(); P = { user_id: uid, birthday: null, shared: true }; }
      const bv = bhost.querySelector(".sm-bd-input").value || null;
      P.birthday = (bv && bv.slice(0, 4) >= "1900") ? bv : null;
      P.shared = bhost.querySelector(".sm-bd-shared").checked;
      await savePerson();
    });
    renderBday();
  }
  function renderBday() {
    if (!bhost) return;
    if (loggedOut) { bhost.innerHTML = '<p class="sm-sh-note">Войдите в облако — и здесь появятся день рождения и настройка видимости для кругов.</p>'; return; }
    bhost.innerHTML = '<label class="sm-sh-lbl">День рождения <input type="date" class="sm-bd-input" min="1900-01-01" max="' + key(new Date()) + '" value="' + ((P && P.birthday) || "") + '"></label>' +
      '<label class="sm-sh-lbl"><input type="checkbox" class="sm-bd-shared"' + (!P || P.shared ? " checked" : "") + '> показывать кругам мои графики и день рождения</label>' +
      '<button class="sm-sh-save" type="button" data-bdsave="1">Сохранить</button>' +
      '<p class="sm-sh-note">Поздравления придут участникам ваших кругов; при выключенной галочке круг не видит ни графиков, ни дня рождения.</p>';
  }

  // v0.8.1: данные для экспорта .ics: смены на 90 дней, события, отпуска, ДР
  function icsData() {
    const out = { shifts: [], events: [], vacations: (V || []).slice(), birthday: (P && P.birthday) || null };
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    for (let i = 0; i < 90; i++) {
      const k = key(new Date(t0.getTime() + i * 86400000));
      for (const j of (J || [])) {
        const tp = jobShift(k, j);
        if (!isWorkType(j, tp)) continue;
        const tm = timesOfType(j, tp) || [];
        out.shifts.push({ date: k, from: tm[0] || null, to: tm[1] || null, title: "Смена: " + j.name + " (" + (namesOf(j)[tp] || tp) + ")" });
      }
    }
    for (const ev of (E || [])) out.events.push({ date: String(ev.date), from: ev.time_from || null, to: ev.time_to || null, title: ev.title });
    return out;
  }
  function mount(container) {
    root = typeof container === "string" ? document.querySelector(container) : container;
    injectStyles();
    // делегированные события редактора цепочки (переживают перерисовки карточки)
    root.addEventListener("click", (e) => {
      const dr = e.target.closest("[data-dayk]");
      if (dr) { openDay(dr.dataset.dayk); return; }
      const tadd = e.target.closest("[data-tadd]");
      const tdel = e.target.closest("[data-tdel]");
      if (tadd || tdel) {
        const ed = (tadd || tdel).closest(".sm-sh-editor");
        if (!ed) return;
        if (tadd) {
          const nm = (ed.querySelector(".sm-sh-tname").value || "").trim();
          const f = ed.querySelector(".sm-sh-tfrom").value, t2 = ed.querySelector(".sm-sh-tto").value;
          if (!nm) { SixMin.toast("Укажите название типа"); return; }
          if (!f || !t2 || f === t2) { SixMin.toast("Укажите начало и конец интервала (разные)"); return; }
          editingTypes["x" + Date.now().toString(36)] = { label: nm, from: f, to: t2 };
          ed.querySelector(".sm-sh-tname").value = "";
        } else {
          delete editingTypes[tdel.dataset.tdel];
        }
        refreshTypes(ed);
        return;
      }
      const add = e.target.closest("[data-cycadd]");
      const del = e.target.closest("[data-cycdel]");
      if (!add && !del) return;
      const ed = e.target.closest(".sm-sh-editor");
      if (!ed) return;
      const cyc = Array.from(ed.querySelectorAll("[data-cyc]")).map((s) => s.value);
      if (add) cyc.push("off");
      else if (cyc.length > 2) cyc.splice(parseInt(del.dataset.cycdel, 10), 1);
      else return;
      // v0.7.5: перезаписываем ТОЛЬКО блок цепочки, иначе исчезают название/якорь/часы/«Сохранить»
      const cw = ed.querySelector(".sm-sh-cycwrap");
      if (cw) cw.innerHTML = cycleEditorInner(cyc); else ed.innerHTML = cycleEditorInner(cyc);
      updatePreview(ed);
    });
    root.addEventListener("change", (e) => {
      const ed = e.target.closest(".sm-sh-editor");
      if (!ed) return;
      if (e.target.classList.contains("sm-sh-atype")) {
        const s0 = ed.querySelector('[data-cyc="0"]'); if (s0) s0.value = e.target.value;
      } else if (e.target.dataset.cyc === "0") {
        const at = ed.querySelector(".sm-sh-atype"); if (at) at.value = e.target.value;
      }
      updatePreview(ed);
    });
    root.addEventListener("change", (e) => {
      if (e.target.classList && e.target.classList.contains("sm-sh-anchor")) {
        const ed = root.querySelector(".sm-sh-editor");
        if (ed) updatePreview(ed);
      }
    });
    mountBdayCard();
    if (!nowTimer) nowTimer = setInterval(updateNow, 30000);
    refresh();
  }
  window.SixMinShifts = { mount, icsData };
})();
window.__v02stage = "after-sixmin-shifts"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-shifts");

// app/js/sixmin-circles.js — v0.4: КРУГИ (семья, друзья, фокус-группы)
//  Общие цели месяца (с подзадачами и чекбоксами), общие привычки
//  (своя отметка + видно, кто сегодня отметил), задачи «на всех»,
//  участники и приглашение кодом. Личное остаётся личным.
// API: SixMinCircles.mount(container)

(function () {
  let root = null;
  let circles = [], sel = null;
  let D = null; // загруженные данные круга
  let newKind = "high";

  const GOAL_COUNT = 3;
  // v0.6.6: коды без неоднозначных символов (0/O/1/I) — конец путанице «О против нуля»
  const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const code6 = () => Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  const esc = SixMin.esc;
  // v0.6.6 рев.3: склонение валюты круга («20 баллов», а не «20 баллы»)
  const pluralRu = (n, f) => { const a = Math.abs(n) % 100, b = a % 10; return (a > 10 && a < 20) ? f[2] : (b > 1 && b < 5) ? f[1] : (b === 1) ? f[0] : f[2]; };
  const curWord = (currency, n) => { const w = String(currency || "баллы").toLowerCase(); return w.indexOf("бал") === 0 ? pluralRu(n, ["балл", "балла", "баллов"]) : (currency || "баллы"); };
  // v0.6.6 rev.4: автообновление круга каждые 20 сек стирало несохранённый ввод в формах
  // (владелец не мог вписать название награды длиннее ~20 символов набора) — сохраняем и возвращаем.
  function formKey(el) {
    // rev.10: ключ обязан быть УНИКАЛЕН на элемент. Раньше одинаковые placeholder
    // (textarea целей, инпуты подзадач, поля комментариев) схлопывались в один ключ,
    // и restoreForms разносил одно значение по всем полям (массовое переименование).
    const f = el.closest("form");
    const scope = el.closest("[data-id]") || f;
    const scopeKey = scope ? (scope.dataset?.id || scope.dataset?.role || scope.className) : "noform";
    let own = el.dataset.gidx || el.dataset.gsubin || el.name || el.id || el.placeholder || el.type;
    // v0.8.20: rev.10 мало: у textarea целей нет form/[data-id], поэтому ключ был
    // "noform|0" у цели №0 ЛЮБОГО круга и у пустого слота — restoreForms переносил
    // текст между кругами («дубли») и воскрешал его после удаления («не удаляется»).
    // Ключ включает круг и id цели; пустой слот keyed "new" — воскресать нечему.
    if (el.dataset.gidx !== undefined || el.dataset.gsubin !== undefined) {
      const gi = Number(el.dataset.gidx !== undefined ? el.dataset.gidx : String(el.dataset.gsubin).split(":")[0]);
      const gg = (D && D.goals ? D.goals : []).find((x) => x.goal_index === gi);
      own = "goal:" + gi + ":" + (gg && gg.id ? gg.id : "new");
    }
    return sel + "|" + scopeKey + "|" + own;
  }
  function snapForms() {
    const m = new Map();
    if (!root) return m;
    // rev.12: поля комментариев не трогаем — у них свой черновик в модуле комментариев,
    // из-за снапшота текст оставался в поле после отправки (баг из видео 15)
    root.querySelectorAll("input,textarea,select").forEach((el) => {
      if (el.hasAttribute("data-cminput")) return;
      // v0.8.22: поля целей и подзадач не снапшотим: сохраняются дебаунсом за 700 мс,
      // а снапшот устраивал «призрака» удалённой цели (self-loop ключа goal:N:new,
      // video-47: RPC удаления 200, строки нет, поле непустое).
      if (el.dataset.gidx !== undefined || el.dataset.gsubin !== undefined) return;
      m.set(formKey(el), el.value);
    });
    return m;
  }
  function restoreForms(m) {
    if (!m || !m.size || !root) return;
    root.querySelectorAll("input,textarea,select").forEach((el) => {
      if (el.hasAttribute("data-cminput")) return;
      // v0.8.22: см. комментарий в snapForms — цели/подзадачи не восстанавливаем
      if (el.dataset.gidx !== undefined || el.dataset.gsubin !== undefined) return;
      const k = formKey(el);
      if (m.has(k) && document.activeElement !== el) {
        el.value = m.get(k);
        // v0.8.23: каретка в конец — после перерисовки не казалось, что ввод «сбросился»
        try { const n = el.value.length; if (el.setSelectionRange) el.setSelectionRange(n, n); } catch (e) {}
      }
    });
  }

  // 💬 комментарии и вложения общих задач (v0.6) — тот же компонент, что в личных задачах.
  // Файлы круга лежат в общей папке circles/<circle_id>/<user_id>/..., поэтому их
  // видят, слушают и скачивают все участники.
  const CM = SixMinComments.create({
    render: () => render(),
    scope: () => ({ circle_id: sel }),
    authorName: (u) => nameOf(u),
    findTask: (id) => [...(D?.tasks || []), ...(D?.bounties || [])].find((x) => x.id === id),
    canDelete: () => circles.find((c) => c.id === sel)?.owner_id === D?.uid,
  });

  let loggedIn = true;
  // v0.8.25: сколько шагов онбординга есть и сколько не выполнено — для состояний кнопки
  let onbTotal = 0, onbOpen = 0;
  async function loadCircles() {
    // v0.6.6 rev.8: без сессии не падаем в пустой экран, а показываем карточку входа
    let uid;
    try { uid = await SixMin.uid(); } catch (e) { uid = null; }
    loggedIn = !!uid;
    if (!uid) { circles = []; sel = null; return; }
    const { data: ms } = await SixMin.sb().from("circle_members")
      .select("circle_id").eq("user_id", uid);
    const ids = (ms || []).map((m) => m.circle_id);
    if (!ids.length) { circles = []; sel = null; return; }
    const { data: cs } = await SixMin.sb().from("circles").select("*").in("id", ids);
    circles = cs || [];
    if (!circles.find((c) => c.id === sel)) {
      // v0.8.31: возвращаем пользователя в тот круг, в котором он был до
      // перезагрузки (если всё ещё участник); память — как у вкладки sixmin-tab
      let saved = null;
      try { saved = localStorage.getItem("sixmin-circle"); } catch (e) {}
      sel = (saved && circles.find((c) => c.id === saved)) ? saved : (circles[0]?.id || null);
    }
    if (sel) { try { localStorage.setItem("sixmin-circle", sel); } catch (e) {} }
    // v0.8.25: личное состояние онбординга: всего шагов и невыполненных
    const { data: onb } = await SixMin.sb().from("tasks").select("id,completed")
      .eq("user_id", uid).like("title", "Онбординг ·%").limit(10);
    onbTotal = (onb || []).length;
    onbOpen = (onb || []).filter((x) => !x.completed).length;
  }

  async function loadData() {
    if (!sel) { D = null; return; }
    const uid = await SixMin.uid();
    const today = await SixMin.todayKey();
    const week = SixMin.weekKeys(0);
    const mk = goalKey();
    const sb = SixMin.sb();
    const [g, h, myLogs, todayLogs, t, m, rw, lg, bn] = await Promise.all([
      sb.from("circle_goals").select("*").eq("circle_id", sel)
        .eq("period_type", "month").eq("period_key", mk).order("goal_index"),
      sb.from("circle_habits").select("*").eq("circle_id", sel)
        .eq("archived", false).order("position"),
      sb.from("circle_habit_logs").select("circle_habit_id, day, user_id, completed").in("day", week),
      sb.from("circle_habit_logs").select("circle_habit_id, user_id").eq("day", today),
      sb.from("tasks").select("*").eq("circle_id", sel).neq("completed", true)
        .is("bounty_points", null)
        .order("due_date", { ascending: true }).limit(100),
      loadMembers(sb, sel),
      sb.from("circle_rewards").select("*").eq("circle_id", sel).eq("active", true).order("cost_points"),
      sb.from("bonus_ledger").select("*").eq("circle_id", sel).order("created_at", { ascending: false }).limit(500),
      sb.from("tasks").select("*").eq("circle_id", sel).not("bounty_points", "is", null)
        .order("created_at", { ascending: false }).limit(100),
    ]);
    D = {
      uid, today,
      goals: g.data || [], habits: h.data || [],
      myLogs: Object.fromEntries((myLogs.data || []).filter((l) => l.user_id === uid).map((l) => [l.circle_habit_id + "|" + l.day, l.completed])),
      weekBy: {}, todayBy: {}, tasks: t.data || [], members: m || [],
      rewards: rw.data || [], ledger: lg.data || [], bounties: bn.data || [],
    };
    for (const l of todayLogs.data || []) (D.todayBy[l.circle_habit_id] = D.todayBy[l.circle_habit_id] || []).push(l.user_id);
    for (const l of myLogs.data || []) if (l.completed) (D.weekBy[l.circle_habit_id] = D.weekBy[l.circle_habit_id] || new Set()).add(l.day);
    await ensureMyProfile(sb, uid);
    await CM.loadCounts([...D.tasks, ...D.bounties].map((x) => x.id));
  }

  // v0.6.1: имена участников. Раньше делали embed-запрос
  // circle_members.select("profiles(...)") — но FK у circle_members ведёт на
  // auth.users, а не на profiles, поэтому PostgREST возвращал ошибку и список
  // участников приходил пустым → все подписывались «участник».
  // Теперь имена отдаёт security-definer функция circle_members_ui (обходит RLS
  // и не зависит от FK), а старый embed оставлен как запасной путь.
  async function loadMembers(sb, circleId) {
    const rpc = await sb.rpc("circle_members_ui", { p_circle: circleId });
    let rows = rpc.data;
    if (!rows) {
      const fb = await sb.from("circle_members")
        .select("user_id, role, profiles(display_name, email)").eq("circle_id", circleId);
      rows = fb.data;
    }
    return (rows || []).map((r) => ({
      user_id: r.user_id,
      role: r.role,
      display_name: r.display_name != null ? r.display_name : (r.profiles ? r.profiles.display_name : null),
      email: r.email != null ? r.email : (r.profiles ? r.profiles.email : null),
    }));
  }

  // Гарантируем, что у текущего пользователя есть строка в profiles,
  // и применяем имя, сохранённое при регистрации до подтверждения почты.
  async function ensureMyProfile(sb, uid) {
    try {
      const u = await sb.auth.getUser();
      const em = (u && u.data && u.data.user && u.data.user.email) || null;
      if (em) await sb.from("profiles").upsert({ id: uid, email: em }, { onConflict: "id", ignoreDuplicates: true });
      const pending = localStorage.getItem("sm_pending_name");
      if (pending) {
        const r = await sb.rpc("set_my_display_name", { p_name: pending });
        if (!r.error) localStorage.removeItem("sm_pending_name");
      }
    } catch (e) { /* тихо: имена не критичны для работы круга */ }
  }

  async function saveMyName(name) {
    const sb = SixMin.sb();
    const { error } = await sb.rpc("set_my_display_name", { p_name: name });
    if (error) { SixMin.toast("Не удалось сохранить имя: " + error.message); return; }
    localStorage.removeItem("sm_pending_name");
    SixMin.toast("Имя сохранено — его видят все ваши круги.");
    await refresh();
  }

  const nameOf = (uidShort) => {
    const m = (D?.members || []).find((x) => x.user_id === uidShort);
    return m?.display_name || (m?.email ? m.email.split("@")[0] : "участник");
  };

  const myName = () => {
    const me = (D?.members || []).find((x) => x.user_id === D?.uid);
    return me?.display_name || (me?.email ? me.email.split("@")[0] : "");
  };

  // v0.7.1: «1 участник / 2 участника / 5 участников»
  const membersWord = (n) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return "участник";
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "участника";
    return "участников";
  };

  // ---------- действия ----------
  async function createCircle(name) {
    const uid = await SixMin.uid();
    const { data, error } = await SixMin.sb().from("circles")
      .insert({ name: name.trim(), invite_code: code6(), owner_id: uid }).select().maybeSingle();
    if (error) { SixMin.toast("Ошибка: " + error.message); return; }
    await SixMin.sb().from("circle_members").insert({ circle_id: data.id, user_id: uid, role: "owner" });
    SixMin.toast("Круг создан! Пригласите близких кодом.");
    await refresh();
  }

  // v0.8.11: персональный онбординг для новичка круга: 6 личных задач-шагов.
  // Имена и число участников не важны: каждый вошедший получает СВОЙ чек-лист
  // в личных задачах (вкладка «Трекер», #tasks-host) и отмечает его сам.
  // Повторно не сеем (проверка по like).
  async function seedOnboarding() {
    try {
      const uid = await SixMin.uid();
      const { data: exist } = await SixMin.sb().from("tasks").select("id,title")
        .eq("user_id", uid).like("title", "Онбординг ·%").limit(10);
      const have = new Set((exist || []).map((x) => x.title));
      const today = SixMin.fmtKey(new Date());
      const steps = [
        "Онбординг · 1/6: Задайте свой график: Работа → «Мои графики» → «+ Добавить график» (дата-якорь, цепочка, часы)",
        "Онбординг · 2/6: Откройте «Найти свободные дни» и тапните любой день — посмотрите детали (смены, ДР, дедлайны)",
        "Онбординг · 3/6: Настройки → карточка «🎂 День рождения и видимость»: укажите дату и оставьте галочку",
        "Онбординг · 4/6: Круги → «Бонусы круга»: возьмите открытое задание с наградой или предложите своё",
        "Онбординг · 5/6: Круги → «Мои смены» → «📅 Событие с приглашением»: ответьте «иду» кому-то или создайте своё",
        "Онбординг · 6/6: Напишите 3 непонятных места в комментарии к любой общей задаче круга — это лучшая помощь владельцу",
      ];
      // v0.8.25: сеем только отсутствующие титулы — прошедшие не дублируются,
      // частично прошедший чек-лист дозиивается недостающими шагами.
      const missing = steps.filter((t) => !have.has(t));
      if (!missing.length) return;
      const rows = missing.map((title) => ({
        user_id: uid, title, due_date: today, area: "personal", kind: "cream", // v0.8.20: личные типы — cream/cherry/fun; «high» делал шаги невидимыми в общем списке
        completed: false, position: steps.indexOf(title),
      }));
      const { error } = await SixMin.sb().from("tasks").insert(rows);
      if (error) { console.error("onboarding seed:", error); return; }
      SixMin.toast(missing.length === steps.length
        ? "Добро пожаловать! На «Трекере» сверху ждёт блок «🎓 Шаги новичка круга» — 6 шагов, идите по порядку ✓"
        : "Добавлены недостающие шаги онбординга: " + missing.length + " — они на «Трекере» ✓");
    } catch (e) { console.error("onboarding seed:", e); }
  }
  // v0.8.16: самолечение онбординга. Посев в joinCircle не покрывает тех, кто
  // вступил в круг ДО появления v0.8.11 на хостах (или на старом SW-кэше) —
  // у них 6 шагов просто нет. При наличии членства досеваем один раз за сеанс;
  // seedOnboarding сам не сеет повторно (like-проверка по «Онбординг ·%»).
  // v0.8.24: шаги для уже состоящих в круге — опт-ин кнопкой «🎓» в «Кругах».
  // Автопосев остаётся только в момент вступления (joinCircle).
  async function onbGet() {
    await seedOnboarding();
    await refresh();
  }
  // v0.8.33: «пройти ещё раз» для полностью прошедших чек-лист (тест-аккаунты,
  // пересъёмка скринов): выполненные шаги убираются, чек-лист сеется заново.
  async function onbReset() {
    if (!confirm("Убрать выполненные шаги онбординга и создать чек-лист заново?")) return;
    try {
      const uid = await SixMin.uid();
      const { data: doneRows } = await SixMin.sb().from("tasks").select("id")
        .eq("user_id", uid).like("title", "Онбординг ·%").eq("completed", true);
      for (const s of doneRows || []) await SixMin.sb().rpc("circle_task_del", { p_task: s.id });
      await seedOnboarding();
      await refresh();
    } catch (e) { console.error("onboarding reset:", e); }
  }

  async function joinCircle(code) {
    // v0.6.5: вступление через серверный RPC circle_join_by_code — политика circles
    // прячет круги от не-участников, поэтому клиентский поиск по коду возвращал пусто.
    let uid;
    try { uid = await SixMin.uid(); } catch (e) { uid = null; }
    if (!uid) { SixMin.toast("Сначала войдите: «Настройки» → создайте аккаунт и подтвердите письмо"); return; }
    const { data, error } = await SixMin.sb().rpc("circle_join_by_code", { p_code: code });
    if (error) { SixMin.toast("Ошибка: " + error.message); return; }
    if (!data || !data.length) { SixMin.toast("Код не найден. Проверьте букву O и ноль 0, лишние пробелы"); return; }
    SixMin.toast("Вы в круге «" + data[0].circle_name + "» 🤝");
    await seedOnboarding();
    await refresh();
  }

  // v0.8.18: сводка спойлера цели обновляется на месте сразу после сохранения:
  // полный render сбивал бы фокус с поля, а без него сводка ещё минуту врала
  // «— ещё не задана —» при написанной цели (видно на video-44).
  function goalSumSync(index, patch) {
    if (!root || patch.title === undefined) return;
    const sum = root.querySelector(`details.sm-cr-goalwrap[data-gwrap="${index}"] summary .sm-cr-goalsum-t`);
    if (sum) sum.textContent = patch.title || "— ещё не задана —";
  }
  const saveGoal = SixMin.debounce(async (index, patch) => {
    const mk = goalKey();
    let g = D.goals.find((x) => x.goal_index === index);
    if (!g) {
      const { data } = await SixMin.sb().from("circle_goals").insert({
        circle_id: sel, period_type: "month", period_key: mk, goal_index: index, ...patch,
      }).select().maybeSingle();
      if (data) D.goals.push(data);
      goalSumSync(index, patch);
      return;
    }
    await SixMin.sb().from("circle_goals").update(patch).eq("id", g.id);
    Object.assign(g, patch);
    goalSumSync(index, patch);
  }, 700);

  // v0.8.14: перенос общей цели на другой месяц. Ставится в очередь ПОСЛЕ debounced
  // saveGoal — так последние правки заголовка успевают сохраниться.
  const moveGoal = SixMin.debounce(async (index) => {
    const g = D.goals.find((x) => x.goal_index === index);
    if (!g?.id) return;
    await saveGoal(index, { title: g.title || "" });
    const key = SixMin.monthKey(moveTargetDate());
    if (key === goalKey()) { SixMin.toast("Это тот же месяц — цель уже здесь"); return; }
    const { data: busy } = await SixMin.sb().from("circle_goals").select("goal_index")
      .eq("circle_id", sel).eq("period_type", "month").eq("period_key", key);
    const taken = new Set((busy || []).map((x) => x.goal_index));
    let gi = g.goal_index;
    while (taken.has(gi)) gi += 1; // в новом месяце место могло быть занято
    const { error } = await SixMin.sb().from("circle_goals")
      .update({ period_key: key, goal_index: gi }).eq("id", g.id);
    if (error) { SixMin.toast("Не удалось перенести: " + error.message); return; }
    moveIdx = null;
    SixMin.toast("Цель перенесена: " + moveTargetLabel() + (gi !== g.goal_index ? " (встала на свободное место №" + (gi + 1) + ")" : ""));
    await refresh();
  }, 350);

  // подзадачи общих целей: текст редактируется инпутом (как в Фокусе), сохранение с дебаунсом
  const saveSubs = SixMin.debounce(async (g, subs) => {
    if (!g?.id) return;
    await SixMin.sb().from("circle_goals").update({ subtasks: subs }).eq("id", g.id);
  }, 500);

  function focusLastSub(i) {
    const inputs = root.querySelectorAll(`.sm-sub-input[data-gsubin^="${i}:"]`);
    inputs[inputs.length - 1]?.focus();
  }

  async function toggleSub(g, si) {
    const subs = Array.isArray(g.subtasks) ? g.subtasks.map((x) => ({ ...x })) : [];
    if (!subs[si]) return;
    subs[si].done = !subs[si].done;
    g.subtasks = subs;
    render();
    await SixMin.sb().from("circle_goals").update({ subtasks: subs }).eq("id", g.id);
  }

  async function editSub(g, si, text) {
    if (!g) return;
    const subs = Array.isArray(g.subtasks) ? g.subtasks.map((x) => ({ ...x })) : [];
    if (!subs[si]) subs[si] = { text: "", done: false };
    subs[si].text = text;
    g.subtasks = subs;
    saveSubs(g, subs);
  }

  async function delSub(g, si) {
    if (!g) return;
    const subs = Array.isArray(g.subtasks) ? g.subtasks.map((x) => ({ ...x })) : [];
    subs.splice(si, 1);
    g.subtasks = subs;
    render();
    if (g.id) await SixMin.sb().from("circle_goals").update({ subtasks: subs }).eq("id", g.id);
  }

  async function addSub(g) {
    const subs = Array.isArray(g.subtasks) ? g.subtasks.map((x) => ({ ...x })) : [];
    subs.push({ text: "", done: false });
    g.subtasks = subs;
    if (!g.id) {
      const mk = goalKey();
      const { data } = await SixMin.sb().from("circle_goals").insert({
        circle_id: sel, period_type: "month", period_key: mk, goal_index: g.goal_index,
        title: g.title || "", subtasks: subs,
      }).select().maybeSingle();
      if (data) { D.goals = D.goals.map((x) => x.goal_index === g.goal_index ? data : x); render(); focusLastSub(g.goal_index); return; }
    } else {
      await SixMin.sb().from("circle_goals").update({ subtasks: subs }).eq("id", g.id);
    }
    render();
    focusLastSub(g.goal_index);
  }

  async function toggleHabit(h) {
    const key = h.id + "|" + D.today;
    const now = !D.myLogs[key];
    D.myLogs[key] = now;
    render();
    await SixMin.sb().from("circle_habit_logs").upsert({
      circle_habit_id: h.id, user_id: D.uid, day: D.today, completed: now,
    });
  }

  async function addHabit(name) {
    const { error } = await SixMin.sb().from("circle_habits")
      .insert({ circle_id: sel, name: name.trim(), position: D.habits.length });
    if (error) { SixMin.toast("Ошибка: " + error.message); return; }
    await refresh();
  }

  async function addSharedTask(title) {
    const uid = await SixMin.uid();
    const { error } = await SixMin.sb().from("tasks").insert({
      user_id: uid, title: title.trim(), due_date: D.today,
      area: "personal", kind: newKind, circle_id: sel,
    });
    if (error) { SixMin.toast("Ошибка: " + error.message); return; }
    await refresh();
  }

  async function toggleShared(t) {
    // v0.6.6 rev.6: отметку общей задачи ставит серверная функция (RLS запрещал
    // участнику менять чужую строку задачи — «не могу поставить галочку»).
    const now = !t.completed;
    t.completed = now;
    t.completed_at = now ? new Date().toISOString() : null;
    render();
    const { data, error } = await SixMin.sb().rpc("circle_task_toggle", { p_task: t.id });
    if (error || data !== "ok") {
      t.completed = !now;
      t.completed_at = null;
      render();
      SixMin.toast(error ? "Ошибка: " + error.message : "Отметить общую задачу может только участник круга");
      return;
    }
    await refresh();
  }

  async function delHabit(h) {
    // v0.6.6 rev.6: удаление общей привычки (владелец круга) — раньше кнопки не было вовсе
    if (!confirm("Удалить общую привычку «" + h.name + "» вместе с историей отметок? Отменить нельзя.")) return;
    const { data, error } = await SixMin.sb().rpc("circle_habit_del", { p_habit: h.id });
    if (error || data !== "ok") { SixMin.toast(error ? "Ошибка: " + error.message : "Удалить общую привычку может только владелец круга"); return; }
    await refresh();
  }

  async function delShared(t) {
    // v0.8.18: сначала сервер с проверкой удалённых строк (см. комментарий у data-gdel):
    // раньше задача «исчезала» на экране и оживала при автообновлении.
    // v0.8.21: серверная функция circle_task_del (security definer), см. circle_goal_del
    const { error, data } = await SixMin.sb().rpc("circle_task_del", { p_task: t.id });
    if (error || data !== "ok") {
      console.error("circle task delete:", error || data);
      SixMin.toast("Не удалось удалить задачу на сервере: " + (error ? error.message : String(data)) + " Владельцу: SQL-шаг 1 из ПРОСТОЙ-ШАГ-v0821.");
      await refresh(); return;
    }
    D.tasks = D.tasks.filter((x) => x.id !== t.id);
    render();
  }

  // ---------- бонусы круга ----------
  function bonusesHTML() {
    const c = circles.find((x) => x.id === sel);
    if (!c || !D) return "";
    const cur = () => SixMin.esc(c.bonus_currency || "баллы");
    const balOf = (u) => (D.ledger || []).filter((l) => l.user_id === u).reduce((s2, l) => s2 + l.delta, 0);
    const isOwner = c.owner_id === D.uid;
    if (!c.bonuses_enabled) {
      return isOwner ? '<div class="sm-cr-sec">🎁 Бонусы ' + INFO_BTN("bonuses") + '</div>' +
        '<button class="sm-cr-new" data-bact="enable">Включить бонусную систему круга</button>' : "";
    }
    const live = (D.bounties || []).filter((t) => ["open", "claimed", "done"].includes(t.bounty_status));
    const board = (D.members || []).map((m) => ({ u: m.user_id, b: balOf(m.user_id) })).sort((a, b) => b.b - a.b);
    const myLedger = (D.ledger || []).filter((l) => l.user_id === D.uid).slice(0, 8);
    // rev.11: «Мои баунти» — участник видит свои взятые задания и их статус
    const myB = (D.bounties || []).filter((t) => t.assignee_id === D.uid && ["claimed", "done"].includes(t.bounty_status));
    const myBHTML = myB.length
      ? '<div class="sm-cr-sec">Мои задания с наградой</div><div class="sm-cr-ledger">' +
        myB.map((t) => '<div class="sm-cr-led-row"><span>' + esc(t.title) + '</span><b class="' +
          (t.bounty_status === "done" ? "plus" : "minus") + '">' +
          (t.bounty_status === "done" ? "ждёт одобрения владельца" : "в работе") + '</b></div>').join("") +
        '</div>'
      : "";
    const btn = (act, id, label, cls) =>
      '<button class="sm-task-btn ' + (cls || "sm-task-postpone") + '" data-bact="' + act + '" data-id="' + id + '">' + label + '</button>';
    const row = (t) => {
      const who = t.assignee_id ? SixMin.esc(nameOf(t.assignee_id)) : null;
      let acts = "";
      if (t.bounty_status === "open") acts = btn("claim", t.id, "Взять") + (isOwner ? btn("cancel", t.id, "×", "sm-task-del") : "");
      if (t.bounty_status === "claimed" && t.assignee_id === D.uid) acts = btn("done", t.id, "Готово ✅");
      if (t.bounty_status === "done" && (isOwner || D.uid === t.user_id)) acts = btn("approve", t.id, "Одобрить +" + t.bounty_points) + btn("reject", t.id, "↩");
      const status = t.bounty_status === "open" ? (who ? "делегировано: " + who : "ждёт героя") + " · автор: " + SixMin.esc(nameOf(t.user_id))
        : t.bounty_status === "claimed" ? "в работе: " + who : "ждёт одобрения: " + who;
      return '<li class="sm-task-wrap" data-id="' + t.id + '"><div class="sm-task"><div class="sm-task-main">' +
        '<span class="sm-cr-bounty">🎁' + t.bounty_points + '</span>' +
        '<span class="sm-task-title">' + SixMin.esc(t.title) + '<span class="sm-cr-status">' + status + '</span></span></div>' +
        '<div class="sm-task-actions">' + CM.buttonHTML(t, "Обсуждение задания") + acts + '</div></div>' +
        CM.panelHTML(t) + '</li>';
    };
    const curN = (n) => curWord(c.bonus_currency, n);
    // v0.8.27: история одобренных заданий — прозрачность выплат и доступ к
    // доказательствам (комментарии, 📎 вложения) ПОСЛЕ выплаты: раньше approved-задача
    // исчезала из всех списков и материалы становились недоступны (кейс владельца 18.10).
    const hist = (D.bounties || []).filter((t) => t.bounty_status === "approved");
    const histHTML = hist.length
      ? '<details class="sm-cr-histwrap"><summary>✅ История одобрений · видна кругу (' + hist.length + ') — развернуть</summary>' +
        '<p class="sm-cr-note">Кто выполнил, за сколько и доказательства (💬 с вложениями) — '
         + 'доступно участникам и после выплаты: справедливость одобрения видна всем.</p>' +
        '<ul class="sm-task-list">' + hist.map((t) => {
          const d = (t.completed_at || t.updated_at || "").slice(0, 10);
          const dl = d ? d.slice(8, 10) + "." + d.slice(5, 7) : "";
          return '<li class="sm-task-wrap" data-id="' + t.id + '"><div class="sm-task sm-task-done"><div class="sm-task-main">' +
            '<span class="sm-cr-bounty">🎁' + t.bounty_points + '</span>' +
            '<span class="sm-task-title">' + SixMin.esc(t.title) +
            '<span class="sm-cr-status">' + (dl ? dl + " · " : "") + "выполнил: " + SixMin.esc(nameOf(t.assignee_id || t.user_id)) + " · одобрено</span></span></div>" +
            '<div class="sm-task-actions">' + CM.buttonHTML(t, "Обсуждение задания и материалы") + '</div></div>' +
            CM.panelHTML(t) + '</li>';
        }).join("") + '</ul></details>'
      : "";
    return '<div class="sm-cr-sec">🎁 Бонусы круга · ' + cur() + ' ' + INFO_BTN("bonuses") + '</div>' +
      '<div class="sm-cr-bal"><div class="sm-cr-bal-me">Мой баланс: <b>' + balOf(D.uid) + '</b> ' + curN(balOf(D.uid)) + '</div>' +
      '<div class="sm-cr-bal-hint">Как зарабатывать: возьмите задание с наградой («Взять» → сделать → «Готово ✅») или общую задачу круга — владелец одобрит, и ' + cur() + ' упадут в копилку.</div>' +
      '<div class="sm-cr-board">' + board.map((x, i) =>
        '<span class="sm-cr-member' + (x.u === D.uid ? " me" : "") + '">' + (i + 1) + '. ' + SixMin.esc(nameOf(x.u)) + ' · ' + x.b + '</span>').join("") + '</div></div>' +
      '<form class="sm-cr-badd" data-role="bounty">' +
        '<input class="sm-cr-input" name="t" placeholder="Задание с наградой: что сделать" maxlength="120">' +
        '<input class="sm-cr-input sm-cr-num" name="p" type="number" min="1" max="999" value="10" title="Награда">' +
        '<select class="sm-cr-input sm-cr-sel" name="w"><option value="">кто возьмёт</option>' +
        D.members.filter((m) => m.user_id !== D.uid).map((m) => '<option value="' + m.user_id + '">' + SixMin.esc(nameOf(m.user_id)) + '</option>').join("") +
        '</select><button class="sm-add-btn" type="submit">+</button></form>' +
      '<p class="sm-cr-note">Задание с наградой может предложить любой участник круга: ' +
        'выплату одобряет автор задания (или владелец круга) при приёмке «Готово ✅».</p>' +
      '<ul class="sm-task-list">' + (live.map(row).join("") || '<li class="sm-tasks-empty">Заданий с наградой пока нет — создайте первое.</li>') + '</ul>' +
      myBHTML +
      histHTML +
      '<div class="sm-cr-sec">Витрина наград</div>' +
      '<div class="sm-cr-shop">' + ((D.rewards || []).map((r) =>
        '<span class="sm-cm-chip">' + SixMin.esc(r.title) + ' · ' + r.cost_points + ' ' + curN(r.cost_points) + ' ' +
        // v0.8.33: «списать» видна ВСЕМ при достаточном балансе (раньше владелец круга
        // видел только крестик и не мог потратить свои баллы — кейс «90 баллов, не купить за 60»)
        (balOf(D.uid) >= r.cost_points
          ? '<b data-bact="spend" data-id="' + r.id + '">списать</b>'
          : '<b class="sm-cr-spend-off" title="Не хватает ' + (r.cost_points - balOf(D.uid)) + ' ' + curN(r.cost_points - balOf(D.uid)) + '">нужно ещё ' + (r.cost_points - balOf(D.uid)) + '</b>') +
        (isOwner ? '<b data-bact="delreward" data-id="' + r.id + '">×</b>' : '') + '</span>').join("") || '<p class="sm-cr-note">Витрина пуста.</p>') + '</div>' +
      (isOwner ? '<form class="sm-cr-badd" data-role="reward">' +
        '<input class="sm-cr-input" name="t" placeholder="Награда: кино-вечер, пицца…" maxlength="80">' +
        '<input class="sm-cr-input sm-cr-num" name="p" type="number" min="1" max="9999" value="20" title="Цена">' +
        '<button class="sm-add-btn" type="submit">+</button></form>' : '') +
      '<div class="sm-cr-sec">Моя выписка</div>' +
      '<div class="sm-cr-ledger">' + (myLedger.map((l) =>
        '<div class="sm-cr-led-row"><span>' + new Date(l.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) +
        ' · ' + SixMin.esc(l.reason) + '</span><b class="' + (l.delta >= 0 ? "plus" : "minus") + '">' + (l.delta >= 0 ? "+" : "") + l.delta + '</b></div>').join("")
        || '<p class="sm-cr-note">Операций пока нет.</p>') + '</div>';
  }

  async function bountyAct(act, id) {
    const t = (D.bounties || []).find((x) => x.id === id);
    if (!t) return;
    const sb = SixMin.sb();
    // v0.6.6 rev.4: все действия баунти — через серверные функции circle_bounty_*.
    // Раньше update задач делался с клиента, и RLS молча запрещал участнику
    // трогать чужую (баунти-)задачу: «Взять» и «Готово» не работали ни у кого, кроме владельца.
    const rpc = (name) => sb.rpc("circle_bounty_" + name, { p_task: id });
    const friendly = (error) => /Could not find the function/.test(error?.message || "")
      ? "Сервис обновляется: база ещё не получила обновление. Попробуйте через пару минут или сообщите владельцу."
      : "Ошибка: " + error.message;
    if (act === "claim") {
      const { data, error } = await rpc("claim");
      if (error || !data) { SixMin.toast(error ? friendly(error) : "Не удалось взять: задание уже взято или вы не в круге"); await refresh(); return; }
    }
    if (act === "done") {
      const { data, error } = await rpc("done");
      if (error || !data) { SixMin.toast(error ? friendly(error) : "Отметить готовым может только исполнитель"); await refresh(); return; }
      SixMin.toast("Отправлено автору задания на одобрение");
    }
    if (act === "reject") {
      const { data } = await rpc("reject");
      SixMin.toast(data ? "Возвращено в работу с комментарием… (отклонено)" : "Не удалось отклонить");
    }
    if (act === "cancel") {
      const { data } = await rpc("cancel");
      if (!data) SixMin.toast("Не удалось удалить: владелец и только пока задание не взято");
    }
    if (act === "approve") {
      const { data, error } = await rpc("approve");
      if (error || !data) { SixMin.toast(error ? friendly(error) : "Одобрить может только владелец круга и только после «Готово»"); await refresh(); return; }
      SixMin.toast("Одобрено: +" + t.bounty_points + " " + curWord(circles.find((c) => c.id === sel)?.bonus_currency, t.bounty_points) + " → " + nameOf(t.assignee_id));
    }
    await refresh();
  }

  async function spendReward(r) {
    const c = circles.find((x) => x.id === sel);
    const bal = (D.ledger || []).filter((l) => l.user_id === D.uid).reduce((s2, l) => s2 + l.delta, 0);
    if (bal < r.cost_points) { SixMin.toast("Не хватает " + (r.cost_points - bal) + " " + curWord(c?.bonus_currency, r.cost_points - bal)); return; }
    // v0.8.32: проверяем вставку (иначе при ошибке тост соврёт «списано»),
    // и показываем остаток сразу — без окна «ничего не изменилось» до перечитки
    const { error } = await SixMin.sb().from("bonus_ledger").insert({ circle_id: sel, user_id: D.uid, delta: -r.cost_points, reason: "награда: " + r.title, reward_id: r.id });
    if (error) { SixMin.toast("Не удалось списать: " + error.message); await refresh(); return; }
    SixMin.toast("Списано " + r.cost_points + " — наслаждайтесь 🎉 Остаток: " + (bal - r.cost_points));
    await refresh();
  }

  // ---------- рендер ----------
  let goalOpen = new Set(); // v0.8.12: раскрытые спойлеры целей переживают автообновление круга
  function goalHTML(i, pos) {
    const g = D.goals.find((x) => x.goal_index === i) || { goal_index: i, title: "", subtasks: [] };
    const subs = Array.isArray(g.subtasks) ? g.subtasks : [];
    const n = (pos == null ? i : pos) + 1;
    const doneCnt = subs.filter((s) => s.done).length;
    return `
      <details class="sm-cr-goalwrap" data-gwrap="${i}"${goalOpen.has(i) ? " open" : ""}>
        <summary>
          <span class="sm-cr-goal-cap">🎯 Цель круга №${n}</span>
          <span class="sm-cr-goalsum-t">${esc(g.title) || "— ещё не задана —"}</span>
          ${subs.length ? `<em class="sm-cr-goalprog">${doneCnt}/${subs.length}</em>` : ""}
          ${g.done ? "✅" : ""}
        </summary>
      <div class="sm-cr-goal${g.done ? " done" : ""}">
        <div class="sm-cr-goal-head">
          <span class="sm-cr-goal-cap">🎯 Цель круга №${n}</span>
          <span class="sm-cr-goal-btns">
            ${g.id ? `<button class="sm-move-btn" data-gmv="${i}" title="Перенести на другой месяц" aria-label="Перенести цель">⤳</button>` : ""}
            ${g.id ? `<button class="sm-cr-goal-del" data-gdel="${i}" aria-label="Удалить цель" title="Удалить цель">×</button>` : ""}
            <button class="sm-focus-check" data-gdone="${i}">${g.done ? "✅" : "⬜"}</button>
          </span>
        </div>
        <textarea class="sm-focus-title" data-gidx="${i}" rows="2"
          placeholder="Общая цель на ${SixMin.esc(monthLabel())}">${esc(g.title)}</textarea>
        <div class="sm-focus-subs">
          ${subs.map((s, si) => `
            <div class="sm-sub-row${s.done ? " sm-sub-done" : ""}">
              <button class="sm-sub-check" data-gsub="${i}:${si}">${s.done ? "☑" : "☐"}</button>
              <input class="sm-sub-input" data-gsubin="${i}:${si}" value="${esc(s.text)}" maxlength="80" placeholder="Подзадача…">
              <button class="sm-sub-del" data-gsubdel="${i}:${si}" aria-label="Удалить подзадачу">×</button>
            </div>`).join("")}
          <button class="sm-sub-add" data-gadd="${i}">+ подзадача</button>
        </div>
        ${moveIdx === i && g.id ? movePickerHTML(i) : ""}
      </div>
      </details>`;
  }

  // v0.8.13: цели круга листаются по месяцам (планировать отпуск и т.п. заранее)
  let goalOffset = 0;
  // v0.8.14: перенос общей цели на другой месяц
  let moveIdx = null; // goal_index цели, у которой открыт выбор месяца
  let moveOff = 1;    // сдвиг выбранного месяца от текущего
  const goalDate = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth() + goalOffset, 1); };
  const goalKey = () => SixMin.monthKey(goalDate());
  const monthLabel = () => goalDate().toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  // v0.8.14: перенос общей цели на другой месяц (подзадачи и галочки едут вместе с ней)
  const moveTargetDate = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth() + moveOff, 1); };
  const moveTargetLabel = () => moveTargetDate().toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  function movePickerHTML(i) {
    return `
      <div class="sm-move-pick">
        <span class="sm-move-cap">⤳ Перенести цель (подзадачи и отметки поедут с ней)</span>
        <div class="sm-move-nav">
          <button type="button" class="sm-nav sm-move-arr" data-gmvshift="-1" title="Раньше">‹</button>
          <span class="sm-move-label">${esc(moveTargetLabel())}</span>
          <button type="button" class="sm-nav sm-move-arr" data-gmvshift="1" title="Позже">›</button>
        </div>
        <div class="sm-move-acts">
          <button type="button" class="sm-move-ok" data-gmvgo="${i}">Перенести сюда</button>
          <button type="button" class="sm-move-cancel" data-gmvclose="${i}">Отмена</button>
        </div>
      </div>`;
  }

  const INFO_BTN = (key) => `<button class="sm-ib" data-info="${key}" aria-label="Как это работает">i</button>`;

  function wireInfo() {
    root.querySelector('[data-info="circles"]')?.addEventListener("click", () => SixMin.info("Круги",
      "<p><b>Круг</b> — общее пространство семьи или команды: общие цели месяца с подзадачами (кнопка ⤳ переносит цель вместе с подзадачами на другой месяц), " +
      "общие привычки (видно, кто сегодня отметил) и задачи «на всех».</p>" +
      "<p><b>Личное остаётся личным:</b> участники не видят чужие дневники, привычки и задачи — только общее поле круга.</p>" +
      "<p><b>Как позвать близких:</b> нажмите «код: XXXXXX ⧉» — код скопируется, пришлите его. " +
      "Человек открывает приложение, создаёт аккаунт (Настройки → Облако → Создать аккаунт), входит, " +
      "открывает «Круги», вставляет код в поле «Код приглашения другого круга» и жмёт «Войти».</p>" +
      "<p><b>💬 Переписка:</b> у общих задач и заданий с наградой есть комментарии с фото, документами и голосовыми — " +
      "файлы видны всем участникам круга, их можно просмотреть, прослушать и скачать.</p>" +
      "<p>👑 — владелец круга: одобряет задания с наградой и управляет наградами. Кругов может быть несколько — переключение чипами сверху.</p>"));
    root.querySelector('[data-info="shared"]')?.addEventListener("click", () => SixMin.info("Задачи «на всех» и переписка",
      "<p>Общая задача видна всем участникам круга: кто создал — подписано именем. " +
      "Квадратик слева — выполнить (отметка общая для всех), «×» — удалить.</p>" +
      "<p><b>💬 у каждой задачи</b> — обсуждение круга: текст, 📎 фото и документы, 🎙 голосовые. " +
      "Файл открывается тапом: фото — просмотр и «Скачать», голосовое — плеер, документ — скачивание. " +
      "Вложения круга хранятся в общей папке, поэтому их видят и могут скачать все участники.</p>" +
      "<p>Переписка обновляется сама каждые 20 секунд, кнопка ⟳ — обновить сейчас. " +
      "Свой комментарий можно удалить (×), владелец круга 👑 может убрать любой.</p>" +
      "<p> есть и у заданий с наградой 🎁 — там удобно присылать фото результата до одобрения.</p>"));
    root.querySelector('[data-info="bonuses"]')?.addEventListener("click", () => SixMin.info("Бонусы круга",
      "<p>Бонусы — книга учёта заслуг внутри круга. Деньги и подарки происходят в реальной жизни, " +
      "приложение лишь честно записывает баллы.</p>" +
      "<p><b>Задания с наградой:</b> владелец публикует задание с наградой («🎁 50»). Участник жмёт «Взять» → делает → «Готово ✅» → " +
      "владелец «Одобрить» — баллы начислены. «↩» возвращает на доработку.</p>" +
      "<p><b>Витрина наград:</b> баллы можно списать на награду (кино-вечер, пицца). Все начисления и списания видны в «Моей выписке».</p>" +
      "<p>Баланс и лидерборд считаются по всем операциям круга.</p>"));
  }

  function render() {
    if (!root) return;
    const snap = snapForms();
    if (!loggedIn) {
      root.innerHTML = `
        <div class="sm-circles">
          <div class="sm-cr-head">🤝 Круги ${INFO_BTN("circles")}</div>
          <p class="sm-cr-note">Круги живут в облаке: общие цели, привычки и задачи «на всех»
             с семьёй или командой. Войдите в аккаунт или создайте новый — и сможете
             создавать круги, входить по коду и видеть общие.</p>
          <button class="btn auth-compact" data-goto-settings>Открыть «Настройки» и войти</button>
        </div>`;
      root.querySelector("[data-goto-settings]")?.addEventListener("click", () =>
        document.querySelector('[data-tab="settings"]')?.click());
      restoreForms(snap);
      return;
    }
    if (!circles.length) {
      root.innerHTML = `
        <div class="sm-circles">
          <div class="sm-cr-head">🤝 Круги ${INFO_BTN("circles")}</div>
          <p class="sm-cr-note">Семья, друзья или фокус-группа: общие цели, общие привычки
             и задачи «на всех». Личные дневники участников остаются приватными.</p>
          <form class="sm-cr-create">
            <input class="sm-cr-input" placeholder="Название круга (например: Семья)" maxlength="40">
            <button class="sm-add-btn" type="submit">Создать</button>
          </form>
          <form class="sm-cr-join">
            <input class="sm-cr-input" placeholder="Код приглашения (6 знаков)" maxlength="6">
            <button class="sm-cr-join-btn" type="submit">Войти в круг</button>
          </form>
        </div>`;
      root.querySelector(".sm-cr-create").addEventListener("submit", (e) => {
        e.preventDefault();
        const inp = root.querySelector(".sm-cr-create input");
        if (inp.value.trim()) createCircle(inp.value);
      });
      root.querySelector(".sm-cr-join").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const inp = form.querySelector("input");
        const btn = form.querySelector("button");
        if (!inp.value.trim()) return;
        // v0.6.6: лоадер на кнопке, пока код проверяется (чтобы «Код не найден» не мерещился при лаге)
        if (btn) { btn.disabled = true; btn.textContent = "Проверяю…"; }
        try { await joinCircle(inp.value); } finally { if (btn) { btn.disabled = false; btn.textContent = "Войти в круг"; } }
      });
      wireInfo();
      restoreForms(snap);
      return;
    }

    const circle = circles.find((c) => c.id === sel);
    // v0.6.2: цель одна по умолчанию, остальные — по кнопке «+ добавить цель».
    // Показываем только реально существующие цели (плюс пустой слот №1, если их нет).
    const goalIdxs = (D.goals || []).length ? D.goals.map((g) => g.goal_index) : [0];
    const goals = goalIdxs.map(goalHTML).join("") +
      `<button class="sm-sub-add sm-cr-goal-add" type="button" data-gnew="1">+ добавить цель</button>`;
    const weekKeys7 = SixMin.weekKeys(0);
    const isOwnerCircle = circles.find((c) => c.id === sel)?.owner_id === D?.uid;
    const habits = D.habits.map((h) => {
      const done = !!D.myLogs[h.id + "|" + D.today];
      const who = (D.todayBy[h.id] || []);
      const wkSet = D.weekBy[h.id] || new Set();
      return `
        <div class="sm-cr-habit" style="--hc:${h.color}">
          <button class="sm-cell ${done ? "sm-done" : "sm-empty"}" data-hab="${h.id}">${done ? "●" : "○"}</button>
          <span class="sm-cr-habit-name">${esc(h.name)}</span>
          <span class="sm-cr-habit-week" title="Неделя: дни, когда круг отмечал привычку">${weekKeys7.map((k) => `<i class="${wkSet.has(k) ? "on" : ""}"></i>`).join("")}</span>
          <em class="sm-cr-habit-wk" title="Дней с отметками за неделю">${wkSet.size}/7</em>
          <span class="sm-cr-habit-who" title="Кто отметил сегодня">
            ${who.length ? who.map((u) => `<i>${esc(nameOf(u).slice(0, 1).toUpperCase())}</i>`).join("") : "<em>сегодня никто</em>"}
          </span>
          ${isOwnerCircle ? `<button class="sm-cr-del" data-hdel="${h.id}" title="Удалить общую привычку">×</button>` : ""}
        </div>`;
    }).join("");

    const tasks = D.tasks.map((t) => `
      <li class="sm-task-wrap" data-id="${t.id}"><div class="sm-task">
        <div class="sm-task-main">
          <button class="sm-task-check" data-st="${t.id}">☐</button>
          <span class="sm-task-title">${t.kind === "low" ? "📋 " : "⚡ "}${esc(t.title)}
            <em class="sm-cr-by">${esc(nameOf(t.user_id))}</em></span>
          ${t.due_date !== D.today ? `<span class="sm-task-overdue-badge">${t.due_date.slice(8)}.${t.due_date.slice(5, 7)}</span>` : ""}
        </div>
        <div class="sm-task-actions">
          ${CM.buttonHTML(t)}
          <button class="sm-task-btn sm-task-del" data-sdel="${t.id}">×</button>
        </div>
      </div>
      ${CM.panelHTML(t)}
      </li>`).join("");

    root.innerHTML = `
      <div class="sm-circles">
        <div class="sm-cr-top">
          <div class="sm-cr-head">🤝 ${esc(circle?.name || "")} ${INFO_BTN("circles")}</div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <button class="sm-cr-code" title="Скопировать код приглашения">код: <b>${esc(circle?.invite_code || "")}</b> ⧉</button>
            <button class="sm-cr-new" title="Создать ещё один круг">+ Круг</button>
            ${isOwnerCircle
              ? `<button class="sm-cr-mgr" data-crename title="Переименовать круг">✏️</button>` +
                `<button class="sm-cr-mgr danger" data-cdel title="Удалить круг безвозвратно">🗑</button>`
              : `<button class="sm-cr-mgr" data-cleave title="Выйти из круга">Выйти</button>`}
          </div>
        </div>
        ${onbOpen === 0 && onbTotal < 6
          ? `<button type="button" class="sm-cr-onbget" data-onbget>🎓 Шаги новичка круга: ${onbTotal === 0 ? "получить чек-лист из 6 шагов" : "добавить недостающие (" + onbTotal + " из 6 есть)"}</button>`
          : ""}
        ${onbOpen === 0 && onbTotal >= 6 ? `<div class="sm-cr-note">🎓 Шаги новичка круга: все 6 выполнены ✓` +
          `<button type="button" class="sm-cr-onbreset" data-onbreset>пройти ещё раз</button></div>` : ""}
        <details class="sm-cr-members-sp">
          <summary>👥 <b>${D.members.length}</b> ${membersWord(D.members.length)} <span class="sm-cr-sp-arrow">▾</span></summary>
          <div class="sm-cr-members">
            ${D.members.map((m) => `<span class="sm-cr-member${m.user_id === D.uid ? " me" : ""}" title="${esc(m.email || "")}">${esc(nameOf(m.user_id))}${m.role === "owner" ? " 👑" : ""}</span>`).join("")}
          </div>
        </details>
        <div class="sm-cr-myname">
          <span>Ваше имя в круге:</span>
          <input id="sm-cr-myname" maxlength="40" placeholder="напр. Мама, Игорь, Саша…" value="${esc(myName())}">
          <button id="sm-cr-myname-save" type="button">Сохранить</button>
        </div>
        ${circles.length > 1 ? `<div class="sm-cr-switch">${circles.map((c) =>
          `<button class="sm-kind-chip${c.id === sel ? " on" : ""}" data-csel="${c.id}">${esc(c.name)}</button>`).join("")}</div>` : ""}

        <section class="sm-cr-block">
          <div class="sm-cr-sec sm-cr-goalsnav">
            <button class="sm-nav" type="button" data-gshift="-1" title="Предыдущий месяц">‹</button>
            <span>🎯 Общие цели · ${monthLabel()}</span>
            <button class="sm-nav" type="button" data-gshift="1" title="Следующий месяц">›</button>
            ${goalOffset !== 0 ? '<button class="sm-nav" type="button" data-gshift="0" title="Вернуться к текущему месяцу">•</button>' : ""}
          </div>
          ${goals}
        </section>

        <section class="sm-cr-block">
          <div class="sm-cr-sec">● Общие привычки · сегодня</div>
          ${habits || '<p class="sm-cr-note">Добавьте первую общую привычку — например, «Вечерняя прогулка вместе».</p>'}
          <form class="sm-cr-hadd">
            <input class="sm-cr-input" placeholder="Новая общая привычка" maxlength="40">
            <button class="sm-add-btn" type="submit">+</button>
          </form>
        </section>

        <section class="sm-cr-block">
          <div class="sm-cr-sec">👥 Задачи «на всех» ${INFO_BTN("shared")}</div>
          <ul class="sm-task-list">${tasks || '<li class="sm-tasks-empty">Общих задач нет — добавьте первую.</li>'}</ul>
          <div class="sm-kind-row">
            <button type="button" class="sm-kind-chip${newKind === "high" ? " on" : ""}" data-ck="high">⚡ Приоритетные</button>
            <button type="button" class="sm-kind-chip${newKind === "low" ? " on" : ""}" data-ck="low">📋 Второстепенные</button>
          </div>
          <form class="sm-cr-tadd">
            <input class="sm-cr-input" placeholder="Задача для всех…" maxlength="120">
            <button class="sm-add-btn" type="submit">+</button>
          </form>
        </section>

        ${(() => { const b = bonusesHTML(); return b ? `<section class="sm-cr-block">${b}</section>` : ""; })()}
        <form class="sm-cr-join sm-cr-join-more">
          <input class="sm-cr-input" placeholder="Код приглашения другого круга" maxlength="6">
          <button class="sm-cr-join-btn" type="submit">Войти</button>
        </form>
      </div>`;

    // события
    root.querySelector(".sm-cr-new")?.addEventListener("click", () => {
      const n = prompt("Название нового круга (Семья, Коллеги, Команда, Клуб…):");
      if (n && n.trim()) createCircle(n);
    });
    root.querySelector(".sm-cr-code")?.addEventListener("click", () => {
      const c = circle?.invite_code || "";
      (navigator.clipboard?.writeText(c) || Promise.reject()).then(
        () => SixMin.toast("Код " + c + " скопирован — пришлите его близким"),
        () => SixMin.toast("Код: " + c));
    });
    // v0.8.46: переименовать / удалить (владелец), выйти (участник) — RPC security definer.
    // Прямых update/delete из клиента НЕТ: политики круговых таблиц непрозрачны (урок v0.8.18).
    const RPC_MSG = {
      not_owner: "Это может сделать только владелец круга",
      not_member: "Вы не состоите в этом круге",
      not_found: "Круг не найден",
      empty: "Название не может быть пустым",
      too_long: "Слишком длинно: до 60 знаков",
      owner_use_delete: "Владелец не выходит из круга — круг можно удалить (🗑)"
    };
    const rpcMsg = (code) => RPC_MSG[code] || ("Сервер ответил: " + code);
    root.querySelector("[data-crename]")?.addEventListener("click", async () => {
      const cur = circle?.name || "";
      const n = prompt("Новое название круга (до 60 знаков):", cur);
      if (n === null) return;
      const nn = n.trim();
      if (!nn) { SixMin.toast("Название не может быть пустым"); return; }
      if (nn.length > 60) { SixMin.toast("Слишком длинно: до 60 знаков"); return; }
      if (nn === cur) return;
      const { data, error } = await SixMin.sb().rpc("circle_rename", { p_circle: sel, p_name: nn });
      if (error) { SixMin.toast("Ошибка: " + error.message); return; }
      if (data !== "ok") { SixMin.toast(rpcMsg(data)); return; }
      SixMin.toast("Круг переименован ✓");
      await refresh();
    });
    root.querySelector("[data-cdel]")?.addEventListener("click", async () => {
      const cur = circle?.name || "";
      if (!confirm("Удалить круг «" + cur + "» БЕЗВОЗВРАТНО?\n" +
        "Удалятся: цели, привычки, общие задачи, награды и выписка, события и список участников.\n" +
        "Личные дневники участников не пострадают.")) return;
      const n = prompt("Для подтверждения введите название круга точно как сейчас:\n«" + cur + "»");
      if (n === null) return;
      if (n.trim() !== cur) { SixMin.toast("Название не совпало — круг НЕ удалён"); return; }
      const { data, error } = await SixMin.sb().rpc("circle_delete", { p_circle: sel });
      if (error) { SixMin.toast("Ошибка: " + error.message); return; }
      if (data !== "ok") { SixMin.toast(rpcMsg(data)); return; }
      SixMin.toast("Круг удалён");
      sel = null; try { localStorage.removeItem("sixmin-circle"); } catch (e) {}
      await refresh();
    });
    root.querySelector("[data-cleave]")?.addEventListener("click", async () => {
      const cur = circle?.name || "";
      if (!confirm("Выйти из круга «" + cur + "»?\n" +
        "Общие строки, которые вы создавали, останутся кругу. Личный дневник не пострадает.")) return;
      const { data, error } = await SixMin.sb().rpc("circle_leave", { p_circle: sel });
      if (error) { SixMin.toast("Ошибка: " + error.message); return; }
      if (data !== "ok") { SixMin.toast(rpcMsg(data)); return; }
      SixMin.toast("Вы вышли из круга");
      sel = null; try { localStorage.removeItem("sixmin-circle"); } catch (e) {}
      await refresh();
    });
    root.querySelectorAll("[data-csel]").forEach((b) =>
      b.addEventListener("click", () => { sel = b.dataset.csel; goalOffset = 0; CM.reset(); refresh(); }));
    root.querySelector("[data-onbget]")?.addEventListener("click", onbGet);
    root.querySelector("[data-onbreset]")?.addEventListener("click", onbReset);
    root.querySelectorAll("[data-gshift]").forEach((b) =>
      b.addEventListener("click", async () => {
        const d = b.dataset.gshift;
        goalOffset = d === "0" ? 0 : Math.max(-12, Math.min(12, goalOffset + Number(d)));
        moveIdx = null; // v0.8.14: сменили месяц — пикер переноса закрываем
        await refresh();
      }));
    root.querySelector("#sm-cr-myname-save")?.addEventListener("click", () => {
      const v = (root.querySelector("#sm-cr-myname")?.value || "").trim();
      if (!v) { SixMin.toast("Введите имя — например, «Мама» или своё настоящее."); return; }
      saveMyName(v);
    });
    root.querySelectorAll(".sm-focus-title[data-gidx]").forEach((t) =>
      t.addEventListener("input", () => saveGoal(Number(t.dataset.gidx), { title: t.value })));
    root.querySelectorAll("[data-gdone]").forEach((b) =>
      b.addEventListener("click", async () => {
        const i = Number(b.dataset.gdone);
        const g = D.goals.find((x) => x.goal_index === i);
        const done = !(g?.done);
        if (g) { g.done = done; render(); await SixMin.sb().from("circle_goals").update({ done }).eq("id", g.id); }
        else { saveGoal(i, { done }); await refresh(); }
      }));
    root.querySelectorAll("[data-gsub]").forEach((b) =>
      b.addEventListener("click", () => {
        const [i, si] = b.dataset.gsub.split(":").map(Number);
        toggleSub(D.goals.find((x) => x.goal_index === i), si);
      }));
    root.querySelectorAll(".sm-sub-input[data-gsubin]").forEach((inp) =>
      inp.addEventListener("input", () => {
        const [i, si] = inp.dataset.gsubin.split(":").map(Number);
        editSub(D.goals.find((x) => x.goal_index === i), si, inp.value);
      }));
    root.querySelectorAll("[data-gsubdel]").forEach((b) =>
      b.addEventListener("click", () => {
        const [i, si] = b.dataset.gsubdel.split(":").map(Number);
        delSub(D.goals.find((x) => x.goal_index === i), si);
      }));
    root.querySelectorAll("[data-gadd]").forEach((b) =>
      b.addEventListener("click", () => addSub(D.goals.find((x) => x.goal_index === Number(b.dataset.gadd)) || { goal_index: Number(b.dataset.gadd), title: "" })));
    // v0.6.2: необязательные дополнительные цели — создаём пустую и сразу фокус на названии
    root.querySelector("[data-gnew]")?.addEventListener("click", async () => {
      const idxs = (D.goals || []).map((g) => g.goal_index);
      if (idxs.length >= 8) { SixMin.toast("До 8 целей: больше — фокус круга размывается."); return; }
      const next = idxs.length ? Math.max(...idxs) + 1 : 0;
      const mk = goalKey();
      const { data, error } = await SixMin.sb().from("circle_goals").insert({
        circle_id: sel, period_type: "month", period_key: mk, goal_index: next, title: "",
      }).select().maybeSingle();
      if (error) { SixMin.toast("Failed to add goal: " + error.message); return; }
      if (data) D.goals.push(data);
      render();
      root.querySelector(`.sm-focus-title[data-gidx="${next}"]`)?.focus();
    });
    // v0.6.2: goal deletion (along with its subtasks)
    root.querySelectorAll("details.sm-cr-goalwrap").forEach((d) => d.addEventListener("toggle", () => {
      const gi = parseInt(d.dataset.gwrap, 10);
      if (d.open) goalOpen.add(gi); else goalOpen.delete(gi);
    }));
    // v0.8.14: перенос общей цели на другой месяц
    root.querySelectorAll("[data-gmv]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = Number(b.dataset.gmv);
        if (moveIdx === i) moveIdx = null;
        else { moveIdx = i; moveOff = goalOffset + (goalOffset >= 0 ? 1 : -1); }
        render();
      }));
    root.querySelectorAll("[data-gmvclose]").forEach((b) =>
      b.addEventListener("click", () => { moveIdx = null; render(); }));
    root.querySelectorAll("[data-gmvshift]").forEach((b) =>
      b.addEventListener("click", () => {
        moveOff = Math.max(-24, Math.min(24, moveOff + Number(b.dataset.gmvshift)));
        render();
      }));
    root.querySelectorAll("[data-gmvgo]").forEach((b) =>
      b.addEventListener("click", () => moveGoal(Number(b.dataset.gmvgo))));
    root.querySelectorAll("[data-gdel]").forEach((b) =>
      b.addEventListener("click", async () => {
        const i = Number(b.dataset.gdel);
        const g = D.goals.find((x) => x.goal_index === i);
        if (!g || !g.id) return;
        const pos = (D.goals || []).map((x) => x.goal_index).indexOf(i);
        if (!confirm(`Удалить цель круга №${pos + 1}${g.title ? " «" + g.title + "»" : ""} вместе с подзадачами? Отменить нельзя.`)) return;
        // v0.8.21: удаление через серверную функцию circle_goal_del (security definer) —
        // схема рабочего circle_habit_del: не зависит от состояния RLS DELETE-политик,
        // из-за которого прямые delete в v0.8.18/v0.8.20 так и не заработали у владельца.
        const { error, data } = await SixMin.sb().rpc("circle_goal_del", { p_goal: g.id });
        if (error || data !== "ok") {
          console.error("circle goal delete:", error || data);
          SixMin.toast(data === "not_member"
            ? "Вы не участник этого круга — удалить цель нельзя."
            : "Не удалось удалить цель на сервере: " + (error ? error.message : String(data)) + " Владельцу: SQL-шаг 1 из ПРОСТОЙ-ШАГ-v0821.");
          await refresh(); return;
        }
        D.goals = D.goals.filter((x) => x.goal_index !== i);
        render();
      }));
    root.querySelectorAll("[data-hab]").forEach((b) =>
      b.addEventListener("click", () => toggleHabit(D.habits.find((h) => h.id === b.dataset.hab))));
    root.querySelectorAll("[data-hdel]").forEach((b) =>
      b.addEventListener("click", () => delHabit(D.habits.find((h) => h.id === b.dataset.hdel))));
    root.querySelector(".sm-cr-hadd")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = e.target.querySelector("input");
      if (inp.value.trim()) { addHabit(inp.value); inp.value = ""; }
    });
    root.querySelectorAll("[data-ck]").forEach((b) =>
      b.addEventListener("click", () => { newKind = b.dataset.ck; render(); }));
    root.querySelector(".sm-cr-tadd")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = e.target.querySelector("input");
      if (inp.value.trim()) { addSharedTask(inp.value); inp.value = ""; }
    });
    root.querySelectorAll("[data-st]").forEach((b) =>
      b.addEventListener("click", () => toggleShared(D.tasks.find((t) => t.id === b.dataset.st))));
    root.querySelectorAll("[data-sdel]").forEach((b) =>
      b.addEventListener("click", () => delShared(D.tasks.find((t) => t.id === b.dataset.sdel))));
    root.querySelectorAll("[data-bact]").forEach((b) => b.addEventListener("click", async (e) => {
      e.stopPropagation();
      const act = b.dataset.bact, id = b.dataset.id;
      if (act === "enable") {
        await SixMin.sb().from("circles").update({ bonuses_enabled: true }).eq("id", sel);
        SixMin.toast("Бонусы включены! Создайте первое задание с наградой 🎁");
        await refresh(); return;
      }
      if (act === "spend") { const r = (D.rewards || []).find((x) => x.id === id); if (r) await spendReward(r); return; }
      if (act === "delreward") { await SixMin.sb().from("circle_rewards").update({ active: false }).eq("id", id); await refresh(); return; }
      await bountyAct(act, id);
    }));
    root.querySelector('form[data-role="bounty"]')?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, title = f.t.value.trim(), pts = parseInt(f.p.value, 10) || 10, who = f.w.value || null;
      if (!title) return;
      f.t.value = ""; f.p.value = "10"; f.w.value = ""; // rev.10: очищаем ДО перерисовки
      const r = await SixMin.sb().rpc("circle_bounty_add", {
        p_circle: sel, p_title: title, p_points: pts, p_assignee: who,
      });
      if (r.error) { SixMin.toast("Не удалось создать задание: " + r.error.message); return; }
      await refresh();
    });
    root.querySelector('form[data-role="reward"]')?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, title = f.t.value.trim(), cost = parseInt(f.p.value, 10) || 10;
      if (!title) return;
      f.t.value = ""; f.p.value = "20"; // rev.10: очищаем ДО перерисовки, чтобы снапшот не вернул текст
      await SixMin.sb().from("circle_rewards").insert({ circle_id: sel, title, cost_points: cost });
      await refresh();
    });
    CM.wire(root);
    root.querySelector(".sm-cr-join-more")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const inp = form.querySelector("input");
      const btn = form.querySelector("button");
      if (!inp.value.trim()) return;
      if (btn) { btn.disabled = true; btn.textContent = "Проверяю…"; }
      try { await joinCircle(inp.value); } finally { if (btn) { btn.disabled = false; btn.textContent = "Войти"; } }
    });
    wireInfo();
    restoreForms(snap);
  }

  async function refresh() { await loadCircles(); await loadData(); render(); }

  function mount(container) {
    root = typeof container === "string" ? document.querySelector(container) : container;
    injectStyles();
    refresh();
  }

  function injectStyles() {
    if (document.getElementById("sixmin-circles-css")) return;
    const css = document.createElement("style");
    css.id = "sixmin-circles-css";
    css.textContent = `
      .sm-circles{font-family:system-ui,sans-serif}
      .sm-cr-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
      .sm-cr-mgr{border:1px solid var(--line,#444);background:transparent;color:var(--muted,#aaa);border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer}
      .sm-cr-mgr.danger{border-color:rgba(227,6,19,.5);color:var(--accent,#E30613)}
      .sm-cr-head{font-weight:800;font-size:16px}
      .sm-cr-code{border:1px solid rgba(127,111,240,.4);background:var(--accent-soft,#FDE9E9);color:var(--accent,#E30613);border-radius:999px;
                  padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer}
      .sm-cr-new{border:1px solid rgba(48,164,108,.5);background:#30a46c1a;color:#30a46c;border-radius:999px;
                 padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer}
      .sm-cr-members{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
      /* v0.7.1: участники круга — количество снаружи, список в спойлере */
      .sm-cr-members-sp{margin-bottom:10px}
      .sm-cr-members-sp summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:7px;
        font-size:13px;font-weight:700;border:1px solid rgba(128,128,128,.25);border-radius:999px;padding:6px 13px;
        background:transparent;color:inherit;user-select:none}
      .sm-cr-members-sp summary::-webkit-details-marker{display:none}
      .sm-cr-members-sp summary b{color:var(--accent,#E30613);font-size:14px}
      .sm-cr-sp-arrow{font-size:10px;opacity:.55;transition:transform .2s}
      .sm-cr-members-sp[open] .sm-cr-sp-arrow{transform:rotate(180deg)}
      .sm-cr-members-sp .sm-cr-members{margin-top:9px;margin-bottom:2px}
      .sm-cr-myname{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:12px;opacity:.9;margin:-4px 0 10px}
      .sm-cr-myname input{flex:1;min-width:120px;padding:7px 10px;border-radius:9px;border:1px solid rgba(128,128,128,.25);background:transparent;color:inherit;font-size:13px;outline:none}
      .sm-cr-myname button{border:0;border-radius:9px;padding:7px 12px;background:rgba(128,128,128,.18);color:inherit;font-size:12px;font-weight:700;cursor:pointer}
      .sm-cr-member{font-size:12px;border:1px solid rgba(128,128,128,.25);border-radius:999px;padding:4px 10px;opacity:.8}
      .sm-cr-member.me{border-color:var(--accent,#E30613);color:var(--accent,#E30613);font-weight:700}
      .sm-cr-switch{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
      .sm-cr-note{font-size:13px;opacity:.65;line-height:1.55;margin:0 0 12px}
      .sm-cr-create,.sm-cr-join,.sm-cr-hadd,.sm-cr-tadd{display:flex;gap:8px;margin-bottom:10px}
      .sm-cr-join-more{margin-top:16px;opacity:.85}
      .sm-cr-input{flex:1;padding:10px 13px;border-radius:12px;border:1px solid rgba(128,128,128,.25);
                   background:transparent;color:inherit;font-size:14px;outline:none;min-width:0}
      .sm-cr-join-btn{border:0;border-radius:12px;background:transparent;color:var(--accent,#E30613);font-weight:700;
                      font-size:13px;padding:0 12px;cursor:pointer;border:1px solid rgba(127,111,240,.4)}
      .sm-cr-sec{font-size:12px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;opacity:.6;
                 margin:16px 0 8px}
      /* v0.6.2: разделы круга — отдельные блоки на тон-два светлее фона, с подсветкой при наведении */
      .sm-cr-block{background:var(--block,#1D1D1D);border:1px solid var(--block-line,var(--line,rgba(128,128,128,.18)));
                   border-radius:16px;padding:12px 12px 8px;margin:0 0 14px;
                   transition:background-color .18s ease,border-color .18s ease}
      .sm-cr-block:hover{background:var(--block-hi,#242424);border-color:var(--accent,#E30613)}
      .sm-cr-block .sm-cr-sec{margin:14px 0 10px}
      .sm-cr-block .sm-cr-sec:first-child{margin:2px 0 10px}
      .sm-cr-block .sm-cr-note{margin-bottom:8px}
      .sm-cr-goalsnav{display:flex;gap:6px;align-items:center}
      .sm-cr-goalsnav span{flex:1}
      .sm-cr-goalsnav button{width:34px;height:30px;border-radius:9px;border:1px solid var(--line,#333);background:#222;color:var(--tx,#eee);font-size:16px;cursor:pointer}
      .sm-cr-goalsnav button:active{transform:scale(.94)}
      .sm-cr-goalwrap{margin:8px 0}
      .sm-cr-goalwrap>summary{list-style:none;cursor:pointer;display:flex;gap:8px;align-items:center;padding:10px 12px;border:1px solid rgba(227,6,19,.55);border-radius:10px;background:linear-gradient(0deg,rgba(227,6,19,.13),rgba(227,6,19,.13)) var(--inset,#1c1c1c);transition:border-color .15s ease,transform .06s ease}
      .sm-cr-goalwrap>summary::-webkit-details-marker{display:none}
      .sm-cr-goalwrap>summary::after{content:"⌄";flex:none;font-size:15px;line-height:1;opacity:.8;color:var(--accent,#E30613);transition:transform .2s ease}
      .sm-cr-goalwrap[open]>summary::after{transform:rotate(180deg)}
      .sm-cr-goalwrap>summary:active{transform:scale(.985);border-color:var(--accent,#E30613)}
      .sm-cr-goalsum-t{flex:1;font-weight:600;font-size:13px;opacity:.95;white-space:normal;overflow-wrap:break-word;min-width:0;line-height:1.35}
      .sm-cr-goalprog{font-style:normal;font-size:12px;opacity:.7}
      .sm-cr-goalwrap[open]>summary{margin-bottom:6px;background:linear-gradient(0deg,rgba(227,6,19,.20),rgba(227,6,19,.20)) var(--inset,#1c1c1c)}
      .sm-cr-goal{border:1px solid rgba(128,128,128,.18);border-radius:14px;padding:12px;margin-bottom:10px;
                  background:var(--inset,#242424);transition:background-color .18s ease,border-color .18s ease}
      .sm-cr-goal:hover{background:var(--inset-hi,#2A2A2A);border-color:rgba(227,6,19,.45)}
      .sm-cr-goal.done{opacity:.55}
      .sm-cr-goal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
      .sm-cr-goal-cap{font-size:12px;font-weight:800;opacity:.7;text-transform:uppercase}
      .sm-cr-goal-btns{display:flex;gap:8px;align-items:center}
      .sm-cr-goal-del{border:0;background:transparent;color:inherit;opacity:.7;font-size:18px;cursor:pointer;
                      font-size:17px;line-height:1;padding:2px 4px}
      .sm-cr-goal-del:hover{opacity:1;color:#E30613}
      .sm-move-btn{border:0;background:transparent;color:inherit;opacity:.45;font-size:15px;cursor:pointer;padding:2px 4px;line-height:1}
      .sm-move-btn:hover{opacity:1;color:var(--accent,#E30613)}
      .sm-move-pick{margin-top:10px;border-top:1px dashed var(--bg);padding-top:10px;display:flex;flex-direction:column;gap:8px}
      .sm-move-cap{font-size:12px;font-weight:600;opacity:.75}
      .sm-move-nav{display:flex;align-items:center;gap:8px}
      .sm-move-label{flex:1;text-align:center;font-weight:600;font-size:14px;text-transform:capitalize}
      .sm-move-arr{width:32px;height:32px;font-size:17px;flex-shrink:0}
      .sm-move-acts{display:flex;gap:8px}
      .sm-move-ok{flex:1;border:0;border-radius:10px;background:var(--accent,#E30613);color:#fff;
                  font:600 13px system-ui;padding:9px;cursor:pointer}
      .sm-move-cancel{border:1px solid var(--bg);border-radius:10px;background:transparent;color:inherit;
                      font:13px system-ui;padding:9px 14px;cursor:pointer;opacity:.7}
      .sm-cr-goal-add{margin:0 0 8px}
      .sm-cr-habit{display:flex;align-items:center;gap:10px;padding:8px;border-radius:10px;
                   border:1px solid transparent;transition:background-color .15s ease}
      .sm-cr-habit:hover{background:var(--inset,#242424)}
      .sm-cr-habit-name{flex:1;font-size:14px;font-weight:600;border-left:3px solid var(--hc,var(--accent,#E30613));padding-left:8px}
      .sm-cr-habit-who{display:flex;gap:3px;align-items:center}
      .sm-cr-habit-who i{font-style:normal;width:22px;height:22px;border-radius:50%;background:var(--accent-soft,#FDE9E9);color:#30a46c;
                         font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center}
      .sm-cr-habit-who em{font-style:normal;font-size:11px;opacity:.45}
      .sm-cr-habit-week{display:flex;gap:2px;align-items:center}
      .sm-cr-habit-week i{width:6px;height:6px;border-radius:50%;background:var(--inset,#333)}
      .sm-cr-habit-week i.on{background:var(--hc,var(--accent,#E65100))}
      .sm-cr-habit-wk{font-style:normal;font-size:11px;opacity:.55;min-width:26px;text-align:right}
      .sm-cr-del{border:0;background:transparent;color:inherit;opacity:.7;cursor:pointer;font-size:18px;line-height:1;padding:4px 6px;border-radius:8px}
      .sm-cr-del:hover{color:var(--accent,#E65100);opacity:1;background:var(--inset,#242424)}
      .sm-cr-by{font-style:normal;font-size:11px;opacity:.55;font-weight:500}
      .sm-cr-bounty{background:var(--accent-soft,#FDE9E9);color:var(--accent,#E30613);font-weight:800;font-size:12px;border-radius:8px;
                    padding:3px 7px;flex-shrink:0}
      .sm-cr-bal{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
      .sm-cr-bal-me{font-size:14px;font-weight:700}
      .sm-cr-bal-me b{color:var(--accent,#E30613);font-size:17px}
      .sm-cr-board{display:flex;gap:6px;flex-wrap:wrap}
      .sm-cr-badd{display:flex;gap:6px;margin:8px 0;flex-wrap:wrap}
      /* v0.8.23: на телефоне название задания — отдельной строкой, иначе поле
         сжималось до пары символов и набор «не было видно» (скрин 11) */
      @media (max-width:640px){
        .sm-cr-badd input[name="t"]{flex:1 1 100%}
        .sm-cr-badd .sm-cr-sel{flex:1 1 auto}
        .sm-cr-badd .sm-cr-input{font-size:16px}
      }
      .sm-cr-onbget{display:block;width:100%;margin:2px 0 10px;padding:11px 12px;border-radius:12px;
                    border:1px dashed rgba(227,6,19,.5);background:rgba(227,6,19,.08);color:inherit;
                    font-weight:700;font-size:13.5px;cursor:pointer;text-align:left}
      .sm-cr-onbreset{display:inline-block;margin-left:10px;padding:4px 10px;border-radius:9px;border:1px dashed rgba(227,6,19,.5);
                      background:rgba(227,6,19,.08);color:inherit;font-weight:700;font-size:12px;cursor:pointer}
      .sm-cr-histwrap{margin:4px 0 10px;border:1px dashed rgba(128,128,128,.35);border-radius:12px;padding:2px 12px 6px}
      .sm-cr-histwrap>summary{cursor:pointer;list-style:none;font-size:12.5px;font-weight:800;padding:10px 2px;opacity:.9}
      .sm-cr-histwrap>summary::-webkit-details-marker{display:none}
      .sm-cr-histwrap>summary::after{content:" ⌄";opacity:.7}
      .sm-cr-histwrap[open]>summary::after{content:" ⌃"}
      .sm-cr-num{flex:0 0 64px;text-align:center}
      .sm-cr-sel{flex:0 0 130px;background:transparent;color:inherit;border:1px solid rgba(128,128,128,.25);
                 border-radius:12px;padding:10px 8px;font-size:13px}
      .sm-cr-shop{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}
      .sm-cr-shop b{color:var(--accent,#E30613);margin-left:6px;cursor:pointer;font-weight:800}
      .sm-cr-ledger{display:flex;flex-direction:column;gap:4px}
      .sm-cr-bal-hint{font-size:11.5px;opacity:.65;margin-top:4px;line-height:1.4}
      .sm-cr-spend-off{opacity:.55;font-size:11px;cursor:default}
      .sm-cr-status{font-size:10.5px;background:var(--inset,#242424);border:1px solid var(--line,#333);padding:2px 7px;border-radius:7px;margin-left:6px;opacity:.9;white-space:nowrap}
      .sm-cr-led-row{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;opacity:.85}
      .sm-cr-led-row .plus{color:#30a46c;font-weight:800}
      .sm-cr-led-row .minus{color:#E30613;font-weight:800}
      @media (max-width:430px){
        #tabbar button{font-size:10px;padding:8px 2px;gap:2px;min-width:0}
        #tabbar button span{font-size:18px}
      }
      .sm-cr-create .sm-add-btn,.sm-cr-hadd .sm-add-btn,.sm-cr-tadd .sm-add-btn{width:auto;padding:0 16px;font-size:14px;font-weight:700}
      .sm-circles .sm-sub-input{flex:1;border:0;background:transparent;color:inherit;font:14px system-ui;outline:none;padding:4px 0;min-width:0}
      .sm-circles .sm-sub-del{border:0;background:transparent;color:inherit;opacity:.3;cursor:pointer;font-size:15px}
      .sm-circles .sm-sub-del:hover{opacity:.9;color:#E30613}
      .sm-circles .sm-sub-done .sm-sub-input{text-decoration:line-through;opacity:.5}
      .sm-cr-head .sm-ib{vertical-align:middle;margin-left:6px}
      .sm-cr-sec .sm-ib{width:20px;height:20px;font-size:11px;vertical-align:middle;margin-left:6px}`;
    document.head.appendChild(css);
  }

  window.SixMinCircles = { mount, refresh };
})();
window.__v02stage = "after-sixmin-circles"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-circles");

// app/js/sixmin-auth.js — v0.4: регистрация самообслуживанием в карточке «Облако»
// Для членов кругов: создаёт аккаунт Supabase Auth прямо из приложения.
(function () {
  function mount() {
    const box = document.getElementById("auth-box");
    if (!box || document.getElementById("sm-signup")) return;
    const wrap = document.createElement("form");
    wrap.id = "sm-signup";
    wrap.onsubmit = () => false; // rev.11: поля пароля живут в form — браузер не ругается
    wrap.style.cssText = "margin-top:14px;border-top:1px dashed rgba(128,128,128,.3);padding-top:12px";
    wrap.innerHTML =
      '<div style="font-size:13px;font-weight:700;margin-bottom:8px;opacity:.85">Создать аккаунт (для семьи и друзей)</div>' +
      '<input id="sm-su-email" type="email" placeholder="почта@пример.ру" autocomplete="email" ' +
        'style="width:100%;margin-bottom:8px;padding:11px 12px;border-radius:10px;border:1px solid rgba(128,128,128,.25);background:transparent;color:inherit;font-size:15px;outline:none">' +
      '<input id="sm-su-pass" type="password" placeholder="Пароль (минимум 6 символов)" autocomplete="new-password" ' +
        'style="width:100%;margin-bottom:8px;padding:11px 12px;border-radius:10px;border:1px solid rgba(128,128,128,.25);background:transparent;color:inherit;font-size:15px;outline:none">' +
      '<input id="sm-su-name" type="text" placeholder="Имя — как видеть в кругах (необязательно)" maxlength="40" autocomplete="nickname" ' +
        'style="width:100%;margin-bottom:8px;padding:11px 12px;border-radius:10px;border:1px solid rgba(128,128,128,.25);background:transparent;color:inherit;font-size:15px;outline:none">' +
      '<button id="sm-su-btn" style="width:100%;padding:11px;border:0;border-radius:10px;background:#30a46c;color:#fff;font-weight:700;font-size:14px;cursor:pointer">Создать аккаунт</button>' +
      '<div id="sm-su-msg" style="font-size:12.5px;margin-top:8px;line-height:1.5;opacity:.8"></div>';
    box.appendChild(wrap);
    wrap.querySelector("#sm-su-btn").onclick = async () => {
      const email = wrap.querySelector("#sm-su-email").value.trim();
      const pass = wrap.querySelector("#sm-su-pass").value;
      const name = (wrap.querySelector("#sm-su-name").value || "").trim();
      const msg = wrap.querySelector("#sm-su-msg");
      if (!email || email.indexOf("@") < 0) { msg.textContent = "Нужна корректная почта."; return; }
      if (pass.length < 6) { msg.textContent = "Пароль — минимум 6 символов."; return; }
      msg.textContent = "Создаю…";
      // v0.8.16: ссылка подтверждения регистрации обязана вести на зеркало.
      // Без emailRedirectTo Supabase подставляет Site URL дашборда (studiomwm.ru),
      // который из РФ без VPN не открывается — кейс регистрации 18.10.2026.
      const redir = (window.SIXMIN_CONFIG || {}).appUrl || (location.origin + location.pathname);
      const { data, error } = await SixMin.sb().auth.signUp({
        email, password: pass,
        options: { data: { display_name: name || null }, emailRedirectTo: redir },
      });
      if (error) {
        const m = String(error.message || error);
        msg.textContent = /already registered/i.test(m)
          ? "Эта почта уже зарегистрирована: войдите с паролем выше или нажмите «забыли пароль?»."
          : /rate limit/i.test(m) ? "Слишком много попыток: подождите минуту и повторите."
          : /Unable to validate email/i.test(m) ? "Похоже, в почте опечатка: проверьте адрес."
          : "Ошибка: " + m;
        return;
      }
      // v0.6.1: сразу пишем имя в profiles, чтобы в кругах человек был не «участник».
      if (name) {
        if (data.session) {
          const r = await SixMin.sb().rpc("set_my_display_name", { p_name: name });
          if (r.error) localStorage.setItem("sm_pending_name", name);
        } else {
          localStorage.setItem("sm_pending_name", name); // применим после входа
        }
      }
      if (data.user && !data.session)
        msg.textContent = "Аккаунт создан. Supabase отправил письмо со ссылкой подтверждения — откройте её, затем входите паролем.";
      else
        msg.textContent = "Аккаунт создан! Можно входить с паролем и присоединяться к кругам по коду.";
    };
  }
  document.addEventListener("DOMContentLoaded", () => setTimeout(mount, 800));
  setInterval(() => { if (!document.getElementById("sm-signup")) mount(); }, 5000);
  window.SixMinAuth = { mount };
})();
window.__v02stage = "after-sixmin-auth"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-auth");

// app/js/sixmin-swipe.js — v0.6.3: горизонтальный свайп по экрану переключает вкладки.
// Свайп влево  → следующая вкладка нижнего меню (порядок как в панели).
// Свайп вправо → предыдущая вкладка.
// НЕ срабатывает: на экранах без нижнего меню (форма/быстро/готово), при вертикальном
// скролле, в полях ввода, внутри горизонтально скроллимых блоков (сетка трекера),
// на свайпе задачи «перенести на завтра» и на элементах с [data-noswipe].

(function () {
  const MIN_DX = 60;  // минимальное горизонтальное смещение, px
  const MAX_DY = 45;  // максимальное вертикальное смещение, px
  const RATIO = 2;    // |dx| должно превышать |dy| минимум вдвое

  let x0 = null;
  let y0 = null;
  let blocked = false;

  function horizScrollable(el) {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (!(n instanceof Element)) break;
      const ox = getComputedStyle(n).overflowX;
      if ((ox === "auto" || ox === "scroll") && n.scrollWidth > n.clientWidth + 4) return true;
    }
    return false;
  }

  function reset() {
    x0 = null;
    y0 = null;
    blocked = false;
  }

  document.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return reset();
      const t = e.target;
      blocked =
        !!(t.closest && t.closest("input,textarea,select,[contenteditable],.sm-task-wrap,[data-noswipe]")) ||
        horizScrollable(t);
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (x0 === null) return;
      if (e.touches.length !== 1) reset();
    },
    { passive: true }
  );

  document.addEventListener(
    "touchcancel",
    () => reset(),
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      if (x0 === null || blocked) return reset();
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      reset();
      if (Math.abs(dx) < MIN_DX || Math.abs(dy) > MAX_DY || Math.abs(dx) < RATIO * Math.abs(dy)) return;

      const bar = document.getElementById("tabbar");
      if (!bar) return;
      if (getComputedStyle(bar).display === "none") return; // форма/быстро/готово
      const btns = Array.prototype.slice.call(bar.querySelectorAll("button"));
      const active = bar.querySelector("button.active");
      if (!active) return;
      const next = btns[btns.indexOf(active) + (dx < 0 ? 1 : -1)];
      if (next) next.click();
    },
    { passive: true }
  );

  window.SixMin = window.SixMin || {};
  window.SixMin.swipeVersion = "0.6.3";
})();
window.__v02stage = "after-sixmin-swipe"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-swipe");

/* ===== v0.2: монтирование модулей + экранная диагностика ===== */
(function () {
  var t0 = Date.now();
  function err(host, name, e) {
    var el = document.querySelector(host);
    if (el) el.innerHTML = '<div style="padding:12px;font-size:13px;line-height:1.5;opacity:.85">⚠️ Модуль ' + name +
      ' не запустился: ' + (e && e.message ? e.message : e) +
      '<br><small>Сфотографируйте этот текст и пришлите агенту.</small></div>';
    if (window.console) console.error("[v02]", name, e);
  }
  function onScreenDebug() {
    // за 15 сек не смонтировались — печатаем диагностику прямо в первую карточку
    if (window.__v02mounted || Date.now() - t0 < 15000) return;
    var el = document.getElementById("habits-host");
    if (!el || el.innerHTML.trim()) return;
    el.innerHTML = '<div style="padding:12px;font-size:13px;line-height:1.6;opacity:.9">' +
      '🔎 v0.2-диагностика (пришлите скрин):<br>' +
      'lib=' + (!!window.supabase) +
      ' · client=' + (!!window.__sbClient) +
      ' · mods=' + (!!window.SixMinHabits) +
      ' · host=' + (!!document.getElementById("habits-host")) +
      '<br>stage=' + (window.__v02stage || "?") +
      '<br>err=' + (window.__v02err || "нет") + '</div>';
  }
  function fallbackClient() {
    if (window.__sbClient || !window.supabase || !window.supabase.createClient) return;
    if (Date.now() - t0 < 8000) return;
    try {
      window.__sbClient = window.supabase.createClient(
        "https://asaecttdxnfiszzafufc.supabase.co",
        "sb_publishable_MLaTGdUWE2S9uFC6gpKNVQ_Y6lDdOjP",
        { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
    } catch (e) { console.error("[v02] fallback client", e); }
  }
  function tryMount() {
    fallbackClient();
    onScreenDebug();
    if (!window.__sbClient || window.__v02mounted) return;
    if (!document.getElementById("habits-host")) return;
    window.__v02mounted = true; if (window.__v02say) window.__v02say("v02: mounting modules...");

    try { if (window.SixMinTheory && window.SixMinTheory.QUOTES) window.QUOTES = window.SixMinTheory.QUOTES; } catch (e) {}
    var mods = [
      [window.SixMinHabits, "mount", "#habits-host", "habits", undefined],
      [window.SixMinFocus, "mount", "#focus-host", "focus", undefined],
      [window.SixMinTasks, "mount", "#tasks-host", "tasks", { area: "personal" }],
      [window.SixMinTasks, "mount", "#work-host", "work", { area: "work", stats: true }],
      [window.SixMinShifts, "mount", "#shifts-host", "shifts", undefined],
      [window.SixMinDoneToday, "mount", "#donetoday-host", "donetoday", undefined],
      [window.SixMinAnalytics, "mount", "#stats-host", "analytics", undefined],
      [window.SixMinTheory, "mountCards", "#wisdom-host", "theory", undefined],
      [window.SixMinTheory, "mountDaily", "#wisdom-daily", "theory-daily", undefined],
      [window.SixMinVoice, "mount", "#voice-host", "voice", { slot: "quick" }],
      [window.SixMinVoiceList, "mount", "#voicelist-host", "voicelist", undefined],
      [window.SixMinCircles, "mount", "#circles-host", "circles", undefined]
    ];
    mods.forEach(function (m) {
      try {
        if (!m[0]) throw new Error("модуль не определён");
        m[0][m[1]](m[2], m[4]);
      } catch (e) { err(m[2], m[3], e); }
    });
    if (window.__v02say) setTimeout(function () {
      if (window.__v02banner && window.__v02mounted) {
        window.__v02banner.textContent = "v02: mounted OK";
        setTimeout(function () { if (window.__v02banner) window.__v02banner.remove(); window.__v02banner = null; }, 5000);
      }
    }, 1500);
  }
  function refreshAll() {
    if (!window.__v02mounted) return;
    [window.SixMinHabits, window.SixMinFocus, window.SixMinTasks, window.SixMinAnalytics]
      .forEach(function (m) { try { m && m.refresh && m.refresh(); } catch (e) { console.error("[v02] refresh", e); } });
  }
  /* ── тема: авто / день / ночь ── */
  var TKEY = "sixmin-theme", tSaved = "auto";
  try { tSaved = localStorage.getItem(TKEY) || "auto"; } catch (e) {}
  function applyTheme(v) {
    if (v === "auto" || !v) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = v;
  }
  applyTheme(tSaved);
  function themeUI() {
    var host = document.querySelector("#screen-settings main") || document.getElementById("screen-settings");
    if (!host || document.getElementById("sm-theme-card")) return;
    var card = document.createElement("div");
    card.className = "card"; card.id = "sm-theme-card";
    card.innerHTML = '<h3 style="margin-bottom:10px">🌓 Тема</h3><div style="display:flex;gap:8px">' +
      ["auto", "light", "dark"].map(function (v) {
        var label = v === "auto" ? "Авто" : v === "light" ? "День" : "Ночь";
        return '<button data-th="' + v + '" style="flex:1;padding:10px;border-radius:12px;border:1px solid var(--line);cursor:pointer;font-weight:600;font-size:14px">' + label + '</button>';
      }).join("") + '</div>';
    host.insertBefore(card, host.firstChild);
    function paint() {
      card.querySelectorAll("[data-th]").forEach(function (b) {
        var on = b.dataset.th === tSaved;
        b.style.background = on ? "var(--accent)" : "transparent";
        b.style.color = on ? "#fff" : "var(--ink)";
      });
    }
    card.addEventListener("click", function (e) {
      var b = e.target.closest("[data-th]"); if (!b) return;
      tSaved = b.dataset.th;
      try { localStorage.setItem(TKEY, tSaved); } catch (e2) {}
      applyTheme(tSaved); paint();
    });
    paint();
  }
  /* ── [i]-шторки на экранах v0.1 (История, Прогресс, Настройки) ── */
  function prodInfoButtons() {
    if (!window.SixMin || !window.SixMin.info) return;
    var specs = [
      ["#screen-history", "history", "История",
        "<p>Календарь за выбранный месяц: каждая клетка — день. <b>Тёмная</b> — заполнены оба блока (утро и вечер), " +
        "<b>светлая</b> — один, <b>пунктир</b> — день в заморозке, <b>пустая</b> — записей не было.</p>" +
        "<p>Нажмите на день — откроется запись дня (ответы, благодарности, задачи). ‹ › — листать месяцы. " +
        "Поиск сверху ищет по всем записям за всё время.</p>"],
      ["#screen-stats", "stats", "Прогресс",
        "<p>Верхние карточки: 🔥 текущая серия дней с записями, рекордная серия, число дней с записями за месяц и среднее время записи.</p>" +
        "<p><b>Настроение и энергия</b> — столбики за 14 дней по ответам утра и вечера. <b>Темы записей</b> — частые темы. " +
        "<b>Когда вы реально пишете</b> — распределение по часам.</p>" +
        "<p>Нижний блок «Привычки и активность» — v0.2: heatmap активности, серии и автовыводы.</p>"],
      ["#screen-settings", "settings", "Настройки",
        "<p><b>Облако:</b> вход и регистрация (Supabase). Там хранится всё: записи, привычки, задачи, круги. " +
        "«Синхронизировать» — подтянуть то, что вы надиктовали боту в Telegram.</p>" +
        "<p><b>Напоминания:</b> время утра/вечера в будни и выходные, повторный сигнал, тихие часы, отпуск.</p>" +
        "<p><b>Тема:</b> авто/день/ночь. «Выйти» — выход из аккаунта на этом устройстве.</p>"]
    ];
    specs.forEach(function (s) {
      var head = document.querySelector(s[0] + " .head") || document.querySelector(s[0] + " header");
      if (!head || head.querySelector('[data-info="' + s[1] + '"]')) return;
      var b = document.createElement("button");
      b.className = "sm-ib";
      b.setAttribute("data-info", s[1]);
      b.setAttribute("aria-label", "Как это работает");
      b.textContent = "i";
      b.style.cssText = "margin-left:8px;vertical-align:middle";
      var t = head.querySelector(".page-title");
      if (t) t.appendChild(b); else head.appendChild(b);
      b.addEventListener("click", function () { window.SixMin.info(s[2], s[3]); });
    });
  }
  document.addEventListener("DOMContentLoaded", function () { setTimeout(tryMount, 500); setTimeout(themeUI, 600); setInterval(themeUI, 3000); setTimeout(prodInfoButtons, 700); setInterval(prodInfoButtons, 4000); });
  setInterval(tryMount, 3000);
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-tab="tracker"]');
    if (b) setTimeout(refreshAll, 150);
  });
})();
