/* sw.js — офлайн-кэш приложения (cache-first, навигация → index.html)
   v0.8.63 — офлайн-перезагрузка больше не «виснет» (кейс владельца 22.10.2026, iPhone):
   1) навигация: без сети берём index.html из кэша СРАЗУ, с сетью — гонка с таймаутом 6 с
      (раньше ждали ответа сети до её собственного таймаута — страница стояла пустой);
   2) precache по одному файлу: не скачавшаяся тяжёлая иконка (1,9 МБ) больше не обнуляет
      весь кэш — addAll() бросает всё, если упал хотя бы один файл;
   3) skipWaiting() только если критичные файлы реально лежат в кэше;
   4) старый кэш НЕ удаляется, пока новый не собрал критичные файлы (иначе офлайн нечего отдать);
   5) если кэш всё-таки пуст — отдаём читаемую страницу «нет сети» вместо белого экрана. */
const CACHE = "sixmin-v9.0.2";
const ASSETS = [
  "./",
  "index.html",
  "plan.html",
  "manifest.webmanifest",
  "js/bundle.js?v=093",
  "js/v02.js?v=125",
  "js/vendor/supabase.min.js?v=014",
  "icons/icon-192.png",
  "icons/icon-512.png"
];
// Без этих файлов приложение офлайн не запустится; иконки — не критичны (1,9 МБ каждая).
const CRITICAL = ["index.html", "js/bundle.js?v=093", "js/v02.js?v=125"];
const NAV_TIMEOUT = 6000;  // мс: сколько ждём сеть при перезагрузке страницы
const META_TIMEOUT = 4000; // мс: version.json (маяк самолечения устаревшего кэша)

function offlinePage() {
  return new Response(
    '<!doctype html><html lang="ru"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Шесть минут с собой — нет сети</title></head>' +
    '<body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#111">' +
    '<div style="max-width:440px;margin:0 auto;padding:32px 20px">' +
    '<h1 style="font-size:19px;margin:0 0 10px">Нет сети и нет сохранённой копии</h1>' +
    '<p style="font-size:14px;line-height:1.55;opacity:.85;margin:0 0 18px">' +
    'Включите интернет и обновите страницу: приложение докачает файлы и дальше будет ' +
    'работать без сети. Записи никуда не делись — они хранятся на устройстве и в облаке.</p>' +
    '<button id="sm-off-reload" style="font:inherit;font-size:14px;font-weight:600;padding:11px 18px;' +
    'border-radius:12px;border:0;background:#E30613;color:#fff;cursor:pointer">Обновить</button>' +
    '<script>document.getElementById("sm-off-reload").onclick=function(){location.reload();};<\/script>' +
    '</div></body></html>',
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function cacheHas(cache, keys) {
  return Promise.all(keys.map(function (k) { return cache.match(k); }))
    .then(function (hits) { return hits.every(Boolean); });
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE)
      // по одному файлу: упавший не обнуляет остальные
      .then(function (c) {
        return Promise.all(ASSETS.map(function (a) {
          return c.add(a).catch(function (e) { console.warn("precache skip:", a, (e && e.message) || e); });
        }));
      })
      .then(function () { return caches.open(CACHE); })
      .then(function (c) { return cacheHas(c, CRITICAL); })
      .then(function (ok) {
        if (ok) return self.skipWaiting();
        console.warn("precache неполный — остаёмся в очереди, старый worker продолжает работать");
        return undefined;
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return cacheHas(c, CRITICAL); })
      .then(function (ok) {
        // старый кэш удаляем ТОЛЬКО когда новый собран: иначе при выключенной сети отдавать нечего
        if (!ok) return undefined;
        return caches.keys().then(function (keys) {
          return Promise.all(keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); }));
        });
      })
      .then(function () { return self.clients.claim(); })
  );
});

function navigate(req) {
  function fromCache() {
    return caches.match("index.html").then(function (r) { return r || caches.match("./"); });
  }
  // сети нет — не ждём заведомо мёртвый запрос
  if (self.navigator && self.navigator.onLine === false) {
    return fromCache().then(function (c) { return c || offlinePage(); });
  }
  return Promise.race([
    fetch(req),
    new Promise(function (_resolve, reject) {
      setTimeout(function () { reject(new Error("navigation timeout")); }, NAV_TIMEOUT);
    }),
  ]).then(function (res) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put("index.html", copy); }).catch(function () {});
    return res;
  }).catch(function () {
    return fromCache().then(function (c) { return c || offlinePage(); });
  });
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  // сторонние запросы (Supabase, CDN) — только сеть, без кэша
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(navigate(req));
    return;
  }

  // v0.8.8: version.json всегда из сети — маяк для самолечения устаревшего кэша.
  // v0.8.63: без сети или по таймауту — из кэша, чтобы запрос не висел.
  if (url.pathname.endsWith("version.json")) {
    if (self.navigator && self.navigator.onLine === false) {
      event.respondWith(caches.match(req));
      return;
    }
    event.respondWith(
      Promise.race([
        fetch(req),
        new Promise(function (_resolve, reject) {
          setTimeout(function () { reject(new Error("version.json timeout")); }, META_TIMEOUT);
        }),
      ]).catch(function () { return caches.match(req); })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) {
        // фоновое обновление кэша
        fetch(req).then(function (res) {
          if (res && res.status === 200) caches.open(CACHE).then(function (c) { c.put(req, res); }).catch(function () {});
        }).catch(function () {});
        return cached;
      }
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && url.origin === self.location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      });
    })
  );
});
