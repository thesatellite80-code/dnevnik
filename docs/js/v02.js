/* ===== v0.2 modules (separate script) ===== */
(function () {
  var d = document.createElement("div");
  d.id = "v02-banner";
  d.style.cssText = "position:fixed;left:8px;bottom:84px;z-index:99999;background:#111;color:#7CFC00;" +
    "font:11px/1.45 ui-monospace,monospace;padding:6px 9px;border-radius:8px;opacity:.95;max-width:94vw;white-space:pre-wrap";
  d.textContent = "v02: start";
  (document.body || document.documentElement).appendChild(d);
  window.__v02banner = d;
  window.__v02say = function (t) { if (window.__v02banner) window.__v02banner.textContent = t; };
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
    el._t = setTimeout(() => { el.style.opacity = "0"; }, 2600);
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
      .sm-cm-btn{border:0;background:transparent;font-size:17px;cursor:pointer;padding:6px;border-radius:8px;
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
    const uid = await SixMin.uid();
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
      if (root) root.innerHTML = '<p style="font-size:13px;opacity:.7">Не удалось загрузить записи: ' +
        SixMin.esc(e.message || e) + '</p>';
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
    const uid = await SixMin.uid();
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

  const periodOf = (t) => {
    if (t === "day") return { type: "day", key: SixMin.fmtKey(now), count: 1 };
    if (t === "week") return { type: "week", key: SixMin.weekKeyISO(now), count: 2 };
    return { type: "month", key: SixMin.monthKey(now), count: 5 };
  };

  async function load() {
    const uid = await SixMin.uid();
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
          <button class="sm-focus-check" data-done="${index}" title="Отметить выполненным">${done ? "✅" : "⬜"}</button>
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
      </div>`;
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
      month: [0, 1, 2, 3, 4].map((i) => cardHTML(i, {
        emoji: "🏔️", caption: "Цель месяца №" + (i + 1),
        color: ["var(--accent,#E30613)", "var(--accent,#E30613)", "#9A9A9A", "#E30613", "#6E6E6E"][i],
        rows: 2, placeholder: "Цель месяца — своими словами", subtasks: true })),
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
      "<p>Текст сохраняется сам через секунду после того, как вы перестали печатать. ⬜/✅ справа — отметить выполненным. Стрелки ‹ › листают дни / недели / месяцы.</p>"));
    root.querySelectorAll("[data-tab]").forEach((b) =>
      b.addEventListener("click", () => { tab = b.dataset.tab; refresh(); }));
    root.querySelectorAll("[data-shift]").forEach((b) =>
      b.addEventListener("click", () => shift(Number(b.dataset.shift))));
    root.querySelectorAll("[data-done]").forEach((b) =>
      b.addEventListener("click", () => toggleDone(Number(b.dataset.done))));
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
      .sm-sub-row{display:flex;align-items:center;gap:6px;margin-bottom:4px}
      .sm-sub-check{border:0;background:transparent;color:var(--accent,#E30613);font-size:17px;cursor:pointer;padding:0;line-height:1;flex-shrink:0}
      .sm-sub-done .sm-sub-input{text-decoration:line-through;opacity:.5}
      .sm-sub-input{flex:1;border:0;background:transparent;color:inherit;font:14px system-ui;outline:none;padding:4px 0}
      .sm-sub-del{border:0;background:transparent;color:inherit;opacity:.3;cursor:pointer;font-size:15px}
      .sm-sub-del:hover{opacity:.9;color:#E30613}
      .sm-sub-add{border:0;background:transparent;color:var(--accent,#E30613);font-size:13px;font-weight:600;cursor:pointer;padding:6px 0 0}
      .sm-nav{width:36px;height:36px;border-radius:10px;border:1px solid var(--bg);background:transparent;
              color:inherit;font-size:20px;cursor:pointer;line-height:1}`;
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
  const KINDS_PERSONAL = [
    { id: "cream", emoji: "🍰", label: "Главное" },
    { id: "cherry", emoji: "🍒", label: "Радости" },
    { id: "fun", emoji: "🎈", label: "Отдых" },
  ];
  const KINDS_WORK = [
    { id: "high", emoji: "⚡", label: "Приоритетные" },
    { id: "low", emoji: "📋", label: "Второстепенные" },
  ];

  function createInstance(opts) {
    opts = opts || {};
    const AREA = opts.area === "work" ? "work" : "personal";
    const SHOW_STATS = !!opts.stats;

    const KINDS = AREA === "work" ? KINDS_WORK : KINDS_PERSONAL;
    const kindOf = (t) => KINDS.find((k) => k.id === (t.kind || KINDS[0].id)) || KINDS[0];
    let root = null, todayKey = null, newKind = KINDS[0].id;
    let today = [], overdue = [], upcoming = [], all = [];
    // комментарии + вложения: общий компонент v0.6 (тот же, что в кругах)
    const CM = SixMinComments.create({
      render: () => render(),
      scope: () => null,   // личная/рабочая задача → приватная папка <uid>/t/...
      findTask: (id) => [...today, ...overdue, ...upcoming].find((x) => x.id === id),
    });

    async function load() {
      const uid = await SixMin.uid();
      todayKey = await SixMin.todayKey();
      const { data } = await SixMin.sb().from("tasks").select("*")
        .eq("user_id", uid).eq("area", AREA)
        .order("due_date", { ascending: true }).order("position", { ascending: true })
        .limit(400);
      all = data || [];
      const open = all.filter((t) => !t.completed);
      today = [...open.filter((t) => t.due_date === todayKey),
               ...all.filter((t) => t.completed && t.due_date === todayKey)];
      overdue = open.filter((t) => t.due_date < todayKey);
      upcoming = open.filter((t) => t.due_date > todayKey);
    const ids = [...today, ...overdue, ...upcoming].map((t) => t.id);
    await CM.loadCounts(ids);
    }

    // ---------- статистика области (для рабочего экрана) ----------
    function statsHTML() {
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

    async function add(title) {
      const uid = await SixMin.uid();
      const { error } = await SixMin.sb().from("tasks").insert({
        user_id: uid, title: title.trim(), due_date: todayKey, area: AREA,
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

    async function remove(t) {
      today = today.filter((x) => x.id !== t.id);
      overdue = overdue.filter((x) => x.id !== t.id);
      upcoming = upcoming.filter((x) => x.id !== t.id);
      render();
      await SixMin.sb().from("tasks").delete().eq("id", t.id);
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
          <span class="sm-task-title" data-ren="${t.id}" title="Тапните, чтобы переименовать">${isUpcoming || isOverdue ? kindOf(t).emoji + " " : ""}${t.title && t.title.trim() ? SixMin.esc(t.title) : "<i style='opacity:.5'>(без названия)</i>"}${t.postpone_count ? ` <em class="sm-task-moved" title="Переносов: ${t.postpone_count}">↪${t.postpone_count}</em>` : ""}</span>
          ${isOverdue ? `<span class="sm-task-overdue-badge">${t.due_date.slice(8)}.${t.due_date.slice(5, 7)}</span>` : ""}
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


    function render() {
      if (!root) return;
      const doneCount = today.filter((t) => t.completed).length;
      const headLabel = AREA === "work" ? "Рабочие задачи на сегодня" : "Задачи на сегодня";
      const ph = AREA === "work" ? "Новая рабочая задача…" : "Новая задача…";
      root.innerHTML = `
      <div class="sm-tasks">
        ${SHOW_STATS ? statsHTML() : ""}
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
        ${KINDS.map((k) => {
          const rows = today.filter((t) => (t.kind || KINDS[0].id) === k.id);
          if (!rows.length) return "";
          return `<div class="sm-kind-head">${k.emoji} ${k.label}</div>
            <ul class="sm-task-list">${rows.map((t) => taskRow(t, false, false)).join("")}</ul>`;
        }).join("") ||
          `<ul class="sm-task-list"><li class="sm-tasks-empty">Список пуст. Добавьте первую задачу 👇<br><small>Свайпните задачу влево или нажмите «→ завтра», чтобы перенести.</small></li></ul>`}
        ${upcomingHTML()}
        <div class="sm-kind-row">
          ${KINDS.map((k) => `<button type="button" class="sm-kind-chip${newKind === k.id ? " on" : ""}" data-kind="${k.id}">${k.emoji} ${k.label}</button>`).join("")}
        </div>
        <form class="sm-task-add">
          <input class="sm-task-add-input" maxlength="120" placeholder="${ph}" autocomplete="off">
          <button class="sm-task-add-btn" type="submit">+</button>
        </form>
      </div>`;

      root.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = b.dataset.id;
        const t = [...today, ...overdue, ...upcoming].find((x) => x.id === id);
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
          : "<p>Чек-лист на сегодня в трёх категориях, по образцу бумажного блокнота: <b>🍰 Главное</b>, <b>🍒 Радости</b>, <b>🎈 Отдых</b> — переключатель над формой. Квадратик слева — выполнить; «→ завтра» или свайп влево — перенести (↪N — сколько раз переносили: больше двух — пора разбить задачу или удалить).</p>") +
        "<p><b>💬 у каждой задачи</b> — комментарии и вложения: 📎 фото/документ и 🎙 голосовое (хранятся в вашем приватном облаке, видите только вы). Блок <b>«Запланировано впереди»</b> показывает все будущие задачи по датам, включая перенесённые; «→ сегодня» возвращает задачу в сегодняшний список.</p>"));

      root.querySelectorAll("[data-ren]").forEach((sp) =>
      sp.addEventListener("click", async (e) => {
        e.stopPropagation();
        const t = [...today, ...overdue, ...upcoming].find((x) => x.id === sp.dataset.ren);
        if (!t) return;
        const nt = prompt("Новое название задачи:", t.title || "");
        if (nt === null || !nt.trim()) return;
        t.title = nt.trim();
        render();
        await SixMin.sb().from("tasks").update({ title: t.title }).eq("id", t.id);
      }));
    root.querySelectorAll("[data-kind]").forEach((b) =>
        b.addEventListener("click", () => { newKind = b.dataset.kind; render(); }));
      root.querySelector(".sm-task-add")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const inp = root.querySelector(".sm-task-add-input");
        if (inp.value.trim()) { inp.value = ""; add(inp.value); inp.focus(); }
      });

      // комментарии и вложения (общий компонент v0.6)
      CM.wire(root);

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
            const t = [...today, ...overdue, ...upcoming].find((x) => x.id === li.dataset.id);
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
      .sm-task-title{font-size:14.5px;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;word-break:break-word}
      .sm-task-done .sm-task-title{text-decoration:line-through;opacity:.5}
      .sm-task-moved{font-style:normal;font-size:11px;color:var(--accent,#E30613);font-weight:700}
      .sm-task-overdue-badge{font-size:10px;background:var(--accent-soft,#FDE9E9);color:#E30613;padding:2px 6px;border-radius:6px;font-weight:700;white-space:nowrap}
      .sm-task-actions{display:flex;gap:4px;flex-shrink:0}
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
      .sm-task-add{display:flex;gap:8px;margin-top:8px}
      .sm-task-add-input{flex:1;padding:11px 14px;border-radius:12px;border:1px solid var(--bg);
                         background:transparent;color:inherit;font-size:14px;outline:none}
      .sm-task-add-input:focus{border-color:var(--accent,#E30613)}
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
    const uid = await SixMin.uid();
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
    { emoji: "🦁", title: "Львица и Антилопа", text: "Львица не бегает за всеми антилопами сразу — она выбирает одну и догоняет. Ваша «Антилопа дня» — главная задача, которая двигает вас вперёд. Всё остальное может подождать." },
    { emoji: "📊", title: "Принцип 80/20", text: "80% результата дают 20% усилий. Найдите те самые 20% дел — и впишите их в «Антилопу». Остальные 80% суеты можно смело делегировать, упростить или отложить." },
    { emoji: "⏱️", title: "6 минут — это много", text: "6 минут утром и 6 вечером = 73 часа осознанности в год. Ритуал важнее длительности: маленькое действие, повторённое 365 раз, меняет жизнь сильнее разового подвига." },
    { emoji: "🔥", title: "Сила серии", text: "Цепочка дней (streak) — ваш главный актив. Пропустить один день — случайность. Пропустить два — начало новой привычки. Никогда не пропускайте дважды подряд." },
    { emoji: "🙏", title: "Благодарность перепрошивает мозг", text: "Записывая 3 благодарности ежедневно, вы тренируете мозг замечать хорошее. Через 3 недели это становится автоматическим — и уровень тревоги снижается." },
    { emoji: "🎯", title: "Одна цель на месяц", text: "Много целей — это ноль целей. Бумажный блокнот «6 минут» просит только ОДНУ глобальную цель на месяц. Если хочется вторую — значит, первая выбрана неверно." },
    { emoji: "↪", title: "Перенос — не провал", text: "Перенести задачу на завтра — нормально. Ненормально — переносить её пятый раз. Если задача «залипла», разбейте её на части или честно удалите: она не ваша." },
    { emoji: "🌅", title: "Утро задаёт день", text: "Первые 6 минут дня — руль всего дня. Не берите телефон до ритуала: чужие повестки (почта, соцсети) не должны определять ваш фокус." },
    { emoji: "🌙", title: "Вечер закрывает петли", text: "Незавершённые дела крутятся в голове и мешают спать. Вечерняя выгрузка «что сделал / что завтра» освобождает оперативную память мозга." },
    { emoji: "📉", title: "Прогресс нелинеен", text: "Будут дни на 20% и недели провалов. Считайте не дни, а среднее за месяц. 70% выполнения на дистанции — отличный результат." },
    { emoji: "✍️", title: "Записанное становится реальным", text: "Мысль в голове — фантазия. Мысль на бумаге (или в дневнике) — обязательство. Сам акт записи повышает вероятность выполнения в 1.5–2 раза." },
    { emoji: "🧘", title: "Пауза — часть работы", text: "Осознанность — это не ещё одна задача в списке. Это пауза между стимулом и реакцией. 6 минут тишины учат выбирать реакцию, а не действовать на автопилоте." },
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
          <span class="sm-card-emoji">📖</span> Мудрость «6 минут»
          <em class="sm-theory-count">${PRINCIPLES.length} принципа</em>
          <button class="sm-ib" data-info="theory" aria-label="Как это работает">i</button>
        </summary>
        <div class="sm-theory">
          ${PRINCIPLES.map((p, i) => `
          <details class="sm-card" ${i === 0 ? "open" : ""}>
            <summary><span class="sm-card-emoji">${p.emoji}</span> ${SixMin.esc(p.title)}</summary>
            <p>${SixMin.esc(p.text)}</p>
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

  window.SixMinTheory = { mountCards, randomQuote, getRandomQuote, showSuccessQuote, QUOTES, PRINCIPLES };
})();
window.__v02stage = "after-sixmin-theory"; if (window.__v02say) window.__v02say("v02 stage: after-sixmin-theory");

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
  const code6 = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const esc = SixMin.esc;

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

  async function loadCircles() {
    const uid = await SixMin.uid();
    const { data: ms } = await SixMin.sb().from("circle_members")
      .select("circle_id").eq("user_id", uid);
    const ids = (ms || []).map((m) => m.circle_id);
    if (!ids.length) { circles = []; sel = null; return; }
    const { data: cs } = await SixMin.sb().from("circles").select("*").in("id", ids);
    circles = cs || [];
    if (!circles.find((c) => c.id === sel)) sel = circles[0]?.id || null;
  }

  async function loadData() {
    if (!sel) { D = null; return; }
    const uid = await SixMin.uid();
    const today = await SixMin.todayKey();
    const week = SixMin.weekKeys(0);
    const mk = SixMin.monthKey();
    const sb = SixMin.sb();
    const [g, h, myLogs, todayLogs, t, m, rw, lg, bn] = await Promise.all([
      sb.from("circle_goals").select("*").eq("circle_id", sel)
        .eq("period_type", "month").eq("period_key", mk).order("goal_index"),
      sb.from("circle_habits").select("*").eq("circle_id", sel)
        .eq("archived", false).order("position"),
      sb.from("circle_habit_logs").select("*").eq("user_id", uid).in("day", week),
      sb.from("circle_habit_logs").select("circle_habit_id, user_id").eq("day", today),
      sb.from("tasks").select("*").eq("circle_id", sel).neq("completed", true)
        .is("bounty_points", null)
        .order("due_date", { ascending: true }).limit(100),
      sb.from("circle_members").select("user_id, role, profiles(display_name, email)").eq("circle_id", sel),
      sb.from("circle_rewards").select("*").eq("circle_id", sel).eq("active", true).order("cost_points"),
      sb.from("bonus_ledger").select("*").eq("circle_id", sel).order("created_at", { ascending: false }).limit(500),
      sb.from("tasks").select("*").eq("circle_id", sel).not("bounty_points", "is", null)
        .order("created_at", { ascending: false }).limit(100),
    ]);
    D = {
      uid, today,
      goals: g.data || [], habits: h.data || [],
      myLogs: Object.fromEntries((myLogs.data || []).map((l) => [l.circle_habit_id + "|" + l.day, l.completed])),
      todayBy: {}, tasks: t.data || [], members: m.data || [],
      rewards: rw.data || [], ledger: lg.data || [], bounties: bn.data || [],
    };
    for (const l of todayLogs.data || []) (D.todayBy[l.circle_habit_id] = D.todayBy[l.circle_habit_id] || []).push(l.user_id);
    await CM.loadCounts([...D.tasks, ...D.bounties].map((x) => x.id));
  }

  const nameOf = (uidShort) => {
    const m = (D?.members || []).find((x) => x.user_id === uidShort);
    const p = m?.profiles;
    return p?.display_name || (p?.email ? p.email.split("@")[0] : "участник");
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

  async function joinCircle(code) {
    const uid = await SixMin.uid();
    const { data: c } = await SixMin.sb().from("circles").select("*")
      .eq("invite_code", code.trim().toUpperCase()).maybeSingle();
    if (!c) { SixMin.toast("Код не найден"); return; }
    const { error } = await SixMin.sb().from("circle_members")
      .insert({ circle_id: c.id, user_id: uid, role: "member" });
    if (error && error.code !== "23505") { SixMin.toast("Ошибка: " + error.message); return; }
    SixMin.toast("Вы в круге «" + c.name + "» 🤝");
    await refresh();
  }

  const saveGoal = SixMin.debounce(async (index, patch) => {
    const mk = SixMin.monthKey();
    let g = D.goals.find((x) => x.goal_index === index);
    if (!g) {
      const { data } = await SixMin.sb().from("circle_goals").insert({
        circle_id: sel, period_type: "month", period_key: mk, goal_index: index, ...patch,
      }).select().maybeSingle();
      if (data) D.goals.push(data);
      return;
    }
    await SixMin.sb().from("circle_goals").update(patch).eq("id", g.id);
    Object.assign(g, patch);
  }, 700);

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
      const mk = SixMin.monthKey();
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
    t.completed = !t.completed;
    t.completed_at = t.completed ? new Date().toISOString() : null;
    render();
    await SixMin.sb().from("tasks")
      .update({ completed: t.completed, completed_at: t.completed_at }).eq("id", t.id);
    await refresh();
  }

  async function delShared(t) {
    D.tasks = D.tasks.filter((x) => x.id !== t.id);
    render();
    await SixMin.sb().from("tasks").delete().eq("id", t.id);
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
    const btn = (act, id, label, cls) =>
      '<button class="sm-task-btn ' + (cls || "sm-task-postpone") + '" data-bact="' + act + '" data-id="' + id + '">' + label + '</button>';
    const row = (t) => {
      const who = t.assignee_id ? SixMin.esc(nameOf(t.assignee_id)) : null;
      let acts = "";
      if (t.bounty_status === "open") acts = btn("claim", t.id, "Взять") + (isOwner ? btn("cancel", t.id, "×", "sm-task-del") : "");
      if (t.bounty_status === "claimed" && t.assignee_id === D.uid) acts = btn("done", t.id, "Готово ✅");
      if (t.bounty_status === "done" && isOwner) acts = btn("approve", t.id, "Одобрить +" + t.bounty_points) + btn("reject", t.id, "↩");
      const status = t.bounty_status === "open" ? (who ? "делегировано: " + who : "ждёт героя")
        : t.bounty_status === "claimed" ? "в работе: " + who : "ждёт одобрения: " + who;
      return '<li class="sm-task-wrap"><div class="sm-task"><div class="sm-task-main">' +
        '<span class="sm-cr-bounty">🎁' + t.bounty_points + '</span>' +
        '<span class="sm-task-title">' + SixMin.esc(t.title) + '<em class="sm-cr-by"> · ' + status + '</em></span></div>' +
        '<div class="sm-task-actions">' + CM.buttonHTML(t, "Обсуждение баунти") + acts + '</div></div>' +
        CM.panelHTML(t) + '</li>';
    };
    return '<div class="sm-cr-sec">🎁 Бонусы круга · ' + cur() + ' ' + INFO_BTN("bonuses") + '</div>' +
      '<div class="sm-cr-bal"><div class="sm-cr-bal-me">Мой баланс: <b>' + balOf(D.uid) + '</b> ' + cur() + '</div>' +
      '<div class="sm-cr-board">' + board.map((x, i) =>
        '<span class="sm-cr-member' + (x.u === D.uid ? " me" : "") + '">' + (i + 1) + '. ' + SixMin.esc(nameOf(x.u)) + ' · ' + x.b + '</span>').join("") + '</div></div>' +
      (isOwner ? '<form class="sm-cr-badd" data-role="bounty">' +
        '<input class="sm-cr-input" name="t" placeholder="Баунти: задача за награду" maxlength="120">' +
        '<input class="sm-cr-input sm-cr-num" name="p" type="number" min="1" max="999" value="10" title="Награда">' +
        '<select class="sm-cr-input sm-cr-sel" name="w"><option value="">кто возьмёт</option>' +
        D.members.filter((m) => m.user_id !== D.uid).map((m) => '<option value="' + m.user_id + '">' + SixMin.esc(nameOf(m.user_id)) + '</option>').join("") +
        '</select><button class="sm-add-btn" type="submit">+</button></form>' : '') +
      '<ul class="sm-task-list">' + (live.map(row).join("") || '<li class="sm-tasks-empty">Баунти пока нет — создайте первое.</li>') + '</ul>' +
      '<div class="sm-cr-sec">Витрина наград</div>' +
      '<div class="sm-cr-shop">' + ((D.rewards || []).map((r) =>
        '<span class="sm-cm-chip">' + SixMin.esc(r.title) + ' · ' + r.cost_points + ' ' + cur() + ' ' +
        (isOwner ? '<b data-bact="delreward" data-id="' + r.id + '">×</b>'
                 : '<b data-bact="spend" data-id="' + r.id + '">списать</b>') + '</span>').join("") || '<p class="sm-cr-note">Витрина пуста.</p>') + '</div>' +
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
    if (act === "claim") await sb.from("tasks").update({ assignee_id: D.uid, bounty_status: "claimed" }).eq("id", id);
    if (act === "done") await sb.from("tasks").update({ bounty_status: "done" }).eq("id", id);
    if (act === "reject") { await sb.from("tasks").update({ bounty_status: "claimed" }).eq("id", id); SixMin.toast("Возвращено в работу с комментарием… (отклонено)"); }
    if (act === "cancel") await sb.from("tasks").delete().eq("id", id);
    if (act === "approve") {
      await sb.from("tasks").update({ bounty_status: "approved", completed: true, completed_at: new Date().toISOString() }).eq("id", id);
      await sb.from("bonus_ledger").insert({ circle_id: sel, user_id: t.assignee_id, delta: t.bounty_points, reason: "баунти: " + t.title, task_id: id });
      SixMin.toast("Одобрено: +" + t.bounty_points + " " + (circles.find((c) => c.id === sel)?.bonus_currency || "баллов") + " → " + nameOf(t.assignee_id));
    }
    await refresh();
  }

  async function spendReward(r) {
    const c = circles.find((x) => x.id === sel);
    const bal = (D.ledger || []).filter((l) => l.user_id === D.uid).reduce((s2, l) => s2 + l.delta, 0);
    if (bal < r.cost_points) { SixMin.toast("Не хватает " + (r.cost_points - bal) + " " + (c?.bonus_currency || "баллов")); return; }
    await SixMin.sb().from("bonus_ledger").insert({ circle_id: sel, user_id: D.uid, delta: -r.cost_points, reason: "награда: " + r.title, reward_id: r.id });
    SixMin.toast("Списано " + r.cost_points + " — наслаждайтесь 🎉");
    await refresh();
  }

  // ---------- рендер ----------
  function goalHTML(i) {
    const g = D.goals.find((x) => x.goal_index === i) || { goal_index: i, title: "", subtasks: [] };
    const subs = Array.isArray(g.subtasks) ? g.subtasks : [];
    return `
      <div class="sm-cr-goal${g.done ? " done" : ""}">
        <div class="sm-cr-goal-head">
          <span class="sm-cr-goal-cap">🎯 Цель круга №${i + 1}</span>
          <button class="sm-focus-check" data-gdone="${i}">${g.done ? "✅" : "⬜"}</button>
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
      </div>`;
  }

  const monthLabel = () => new Date().toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  const INFO_BTN = (key) => `<button class="sm-ib" data-info="${key}" aria-label="Как это работает">i</button>`;

  function wireInfo() {
    root.querySelector('[data-info="circles"]')?.addEventListener("click", () => SixMin.info("Круги",
      "<p><b>Круг</b> — общее пространство семьи или команды: общие цели месяца с подзадачами, " +
      "общие привычки (видно, кто сегодня отметил) и задачи «на всех».</p>" +
      "<p><b>Личное остаётся личным:</b> участники не видят чужие дневники, привычки и задачи — только общее поле круга.</p>" +
      "<p><b>Как позвать близких:</b> нажмите «код: XXXXXX ⧉» — код скопируется, пришлите его. " +
      "Человек открывает приложение, создаёт аккаунт (Настройки → Облако → Создать аккаунт), входит, " +
      "открывает «Круги», вставляет код в поле «Код приглашения другого круга» и жмёт «Войти».</p>" +
      "<p><b>💬 Переписка:</b> у общих задач и баунти есть комментарии с фото, документами и голосовыми — " +
      "файлы видны всем участникам круга, их можно просмотреть, прослушать и скачать.</p>" +
      "<p>👑 — владелец круга: одобряет баунти и управляет наградами. Кругов может быть несколько — переключение чипами сверху.</p>"));
    root.querySelector('[data-info="shared"]')?.addEventListener("click", () => SixMin.info("Задачи «на всех» и переписка",
      "<p>Общая задача видна всем участникам круга: кто создал — подписано именем. " +
      "Квадратик слева — выполнить (отметка общая для всех), «×» — удалить.</p>" +
      "<p><b>💬 у каждой задачи</b> — обсуждение круга: текст, 📎 фото и документы, 🎙 голосовые. " +
      "Файл открывается тапом: фото — просмотр и «Скачать», голосовое — плеер, документ — скачивание. " +
      "Вложения круга хранятся в общей папке, поэтому их видят и могут скачать все участники.</p>" +
      "<p>Переписка обновляется сама каждые 20 секунд, кнопка ⟳ — обновить сейчас. " +
      "Свой комментарий можно удалить (×), владелец круга 👑 может убрать любой.</p>" +
      "<p>💬 есть и у баунти 🎁 — там удобно присылать фото результата до одобрения.</p>"));
    root.querySelector('[data-info="bonuses"]')?.addEventListener("click", () => SixMin.info("Бонусы круга",
      "<p>Бонусы — книга учёта заслуг внутри круга. Деньги и подарки происходят в реальной жизни, " +
      "приложение лишь честно записывает баллы.</p>" +
      "<p><b>Баунти:</b> владелец публикует задачу с наградой («🎁 50»). Участник жмёт «Взять» → делает → «Готово ✅» → " +
      "владелец «Одобрить» — баллы начислены. «↩» возвращает на доработку.</p>" +
      "<p><b>Витрина наград:</b> баллы можно списать на награду (кино-вечер, пицца). Все начисления и списания видны в «Моей выписке».</p>" +
      "<p>Баланс и лидерборд считаются по всем операциям круга.</p>"));
  }

  function render() {
    if (!root) return;
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
      root.querySelector(".sm-cr-join").addEventListener("submit", (e) => {
        e.preventDefault();
        const inp = root.querySelector(".sm-cr-join input");
        if (inp.value.trim()) joinCircle(inp.value);
      });
      wireInfo();
      return;
    }

    const circle = circles.find((c) => c.id === sel);
    const goals = [0, 1, 2].map(goalHTML).join("");
    const habits = D.habits.map((h) => {
      const done = !!D.myLogs[h.id + "|" + D.today];
      const who = (D.todayBy[h.id] || []);
      return `
        <div class="sm-cr-habit" style="--hc:${h.color}">
          <button class="sm-cell ${done ? "sm-done" : "sm-empty"}" data-hab="${h.id}">${done ? "●" : "○"}</button>
          <span class="sm-cr-habit-name">${esc(h.name)}</span>
          <span class="sm-cr-habit-who" title="Кто отметил сегодня">
            ${who.length ? who.map((u) => `<i>${esc(nameOf(u).slice(0, 1).toUpperCase())}</i>`).join("") : "<em>сегодня никто</em>"}
          </span>
        </div>`;
    }).join("");

    const tasks = D.tasks.map((t) => `
      <li class="sm-task-wrap"><div class="sm-task">
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
          </div>
        </div>
        <div class="sm-cr-members">
          ${D.members.map((m) => `<span class="sm-cr-member${m.user_id === D.uid ? " me" : ""}" title="${esc(m.profiles?.email || "")}">${esc(nameOf(m.user_id))}${m.role === "owner" ? " 👑" : ""}</span>`).join("")}
        </div>
        ${circles.length > 1 ? `<div class="sm-cr-switch">${circles.map((c) =>
          `<button class="sm-kind-chip${c.id === sel ? " on" : ""}" data-csel="${c.id}">${esc(c.name)}</button>`).join("")}</div>` : ""}

        <div class="sm-cr-sec">🎯 Общие цели · ${monthLabel()}</div>
        ${goals}

        <div class="sm-cr-sec">● Общие привычки · сегодня</div>
        ${habits || '<p class="sm-cr-note">Добавьте первую общую привычку — например, «Вечерняя прогулка вместе».</p>'}
        <form class="sm-cr-hadd">
          <input class="sm-cr-input" placeholder="Новая общая привычка" maxlength="40">
          <button class="sm-add-btn" type="submit">+</button>
        </form>

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

        ${bonusesHTML()}
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
    root.querySelectorAll("[data-csel]").forEach((b) =>
      b.addEventListener("click", () => { sel = b.dataset.csel; CM.reset(); refresh(); }));
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
    root.querySelectorAll("[data-hab]").forEach((b) =>
      b.addEventListener("click", () => toggleHabit(D.habits.find((h) => h.id === b.dataset.hab))));
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
        SixMin.toast("Бонусы включены! Создайте первое баунти 🎁");
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
      await SixMin.sb().from("tasks").insert({
        user_id: D.uid, title, due_date: D.today, area: "personal", kind: "high",
        circle_id: sel, bounty_points: pts, assignee_id: who, bounty_status: who ? "claimed" : "open",
      });
      await refresh();
    });
    root.querySelector('form[data-role="reward"]')?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, title = f.t.value.trim(), cost = parseInt(f.p.value, 10) || 10;
      if (!title) return;
      await SixMin.sb().from("circle_rewards").insert({ circle_id: sel, title, cost_points: cost });
      await refresh();
    });
    CM.wire(root);
    root.querySelector(".sm-cr-join-more")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = e.target.querySelector("input");
      if (inp.value.trim()) joinCircle(inp.value);
    });
    wireInfo();
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
      .sm-cr-head{font-weight:800;font-size:16px}
      .sm-cr-code{border:1px solid rgba(127,111,240,.4);background:var(--accent-soft,#FDE9E9);color:var(--accent,#E30613);border-radius:999px;
                  padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer}
      .sm-cr-new{border:1px solid rgba(48,164,108,.5);background:#30a46c1a;color:#30a46c;border-radius:999px;
                 padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer}
      .sm-cr-members{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
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
      .sm-cr-goal{border:1px solid rgba(128,128,128,.18);border-radius:14px;padding:12px;margin-bottom:10px}
      .sm-cr-goal.done{opacity:.55}
      .sm-cr-goal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
      .sm-cr-goal-cap{font-size:12px;font-weight:800;opacity:.7;text-transform:uppercase}
      .sm-cr-habit{display:flex;align-items:center;gap:10px;padding:6px 2px}
      .sm-cr-habit-name{flex:1;font-size:14px;font-weight:600;border-left:3px solid var(--hc,var(--accent,#E30613));padding-left:8px}
      .sm-cr-habit-who{display:flex;gap:3px;align-items:center}
      .sm-cr-habit-who i{font-style:normal;width:22px;height:22px;border-radius:50%;background:var(--accent-soft,#FDE9E9);color:#30a46c;
                         font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center}
      .sm-cr-habit-who em{font-style:normal;font-size:11px;opacity:.45}
      .sm-cr-by{font-style:normal;font-size:11px;opacity:.55;font-weight:500}
      .sm-cr-bounty{background:var(--accent-soft,#FDE9E9);color:var(--accent,#E30613);font-weight:800;font-size:12px;border-radius:8px;
                    padding:3px 7px;flex-shrink:0}
      .sm-cr-bal{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
      .sm-cr-bal-me{font-size:14px;font-weight:700}
      .sm-cr-bal-me b{color:var(--accent,#E30613);font-size:17px}
      .sm-cr-board{display:flex;gap:6px;flex-wrap:wrap}
      .sm-cr-badd{display:flex;gap:6px;margin:8px 0;flex-wrap:wrap}
      .sm-cr-num{flex:0 0 64px;text-align:center}
      .sm-cr-sel{flex:0 0 130px;background:transparent;color:inherit;border:1px solid rgba(128,128,128,.25);
                 border-radius:12px;padding:10px 8px;font-size:13px}
      .sm-cr-shop{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}
      .sm-cr-shop b{color:var(--accent,#E30613);margin-left:6px;cursor:pointer;font-weight:800}
      .sm-cr-ledger{display:flex;flex-direction:column;gap:4px}
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
    const wrap = document.createElement("div");
    wrap.id = "sm-signup";
    wrap.style.cssText = "margin-top:14px;border-top:1px dashed rgba(128,128,128,.3);padding-top:12px";
    wrap.innerHTML =
      '<div style="font-size:13px;font-weight:700;margin-bottom:8px;opacity:.85">Создать аккаунт (для семьи и друзей)</div>' +
      '<input id="sm-su-email" type="email" placeholder="почта@пример.ру" autocomplete="email" ' +
        'style="width:100%;margin-bottom:8px;padding:11px 12px;border-radius:10px;border:1px solid rgba(128,128,128,.25);background:transparent;color:inherit;font-size:15px;outline:none">' +
      '<input id="sm-su-pass" type="password" placeholder="Пароль (минимум 6 символов)" autocomplete="new-password" ' +
        'style="width:100%;margin-bottom:8px;padding:11px 12px;border-radius:10px;border:1px solid rgba(128,128,128,.25);background:transparent;color:inherit;font-size:15px;outline:none">' +
      '<button id="sm-su-btn" style="width:100%;padding:11px;border:0;border-radius:10px;background:#30a46c;color:#fff;font-weight:700;font-size:14px;cursor:pointer">Создать аккаунт</button>' +
      '<div id="sm-su-msg" style="font-size:12.5px;margin-top:8px;line-height:1.5;opacity:.8"></div>';
    box.appendChild(wrap);
    wrap.querySelector("#sm-su-btn").onclick = async () => {
      const email = wrap.querySelector("#sm-su-email").value.trim();
      const pass = wrap.querySelector("#sm-su-pass").value;
      const msg = wrap.querySelector("#sm-su-msg");
      if (!email || email.indexOf("@") < 0) { msg.textContent = "Нужна корректная почта."; return; }
      if (pass.length < 6) { msg.textContent = "Пароль — минимум 6 символов."; return; }
      msg.textContent = "Создаю…";
      const { data, error } = await SixMin.sb().auth.signUp({ email, password: pass });
      if (error) { msg.textContent = "Ошибка: " + error.message; return; }
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
      [window.SixMinAnalytics, "mount", "#stats-host", "analytics", undefined],
      [window.SixMinTheory, "mountCards", "#theory-host", "theory", undefined],
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
