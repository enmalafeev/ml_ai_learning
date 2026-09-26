/* Синхронизация прогресса между устройствами через secret gist на GitHub.

   Один цикл: забрать удалённое состояние, слить с локальным, отправить результат обратно.
   Слияние идемпотентно (время и результаты — по максимуму, отметки — объединением), поэтому
   порядок нажатий на устройствах не важен и повторный клик ничего не портит.

   Токен лежит в отдельном ключе localStorage, а не в состоянии приложения: иначе он попал бы
   в файл резервной копии, который пользователь может кому-то передать. */
(function () {
  'use strict';

  const CFG_KEY = 'ml-journey.sync';
  const FILE = 'ml-journey.json';
  const API = 'https://api.github.com/gists';

  const DEFAULT_CFG = { token: '', gistId: '', lastSyncAt: null };

  let cfg = readConfig();

  function readConfig() {
    try {
      const raw = localStorage.getItem(CFG_KEY);
      if (!raw) return Object.assign({}, DEFAULT_CFG);
      return Object.assign({}, DEFAULT_CFG, JSON.parse(raw));
    } catch (e) {
      return Object.assign({}, DEFAULT_CFG);
    }
  }

  function config() { return cfg; }

  function setConfig(patch) {
    cfg = Object.assign({}, cfg, patch);
    try {
      localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
    } catch (e) {
      console.error('Не удалось сохранить настройки синхронизации', e);
    }
    return cfg;
  }

  function forget() {
    cfg = Object.assign({}, DEFAULT_CFG);
    try { localStorage.removeItem(CFG_KEY); } catch (e) { /* нечего забывать */ }
  }

  function isConfigured() { return !!cfg.token; }

  /* --- Слияние состояний --- */

  function maxNum(a, b) {
    const x = typeof a === 'number' ? a : 0;
    const y = typeof b === 'number' ? b : 0;
    return x > y ? x : y;
  }

  function maxOrNull(a, b) {
    if (typeof a !== 'number') return typeof b === 'number' ? b : null;
    if (typeof b !== 'number') return a;
    return a > b ? a : b;
  }

  function minOrNull(a, b) {
    if (typeof a !== 'number') return typeof b === 'number' ? b : null;
    if (typeof b !== 'number') return a;
    return a < b ? a : b;
  }

  function unionFlags(a, b) {
    const out = {};
    [a || {}, b || {}].forEach(function (o) {
      for (const k in o) { if (o[k]) out[k] = true; }
    });
    return out;
  }

  function mergeDaily(a, b) {
    const out = {};
    const A = a || {};
    const B = b || {};
    for (const k in A) out[k] = maxNum(A[k], 0);
    for (const k in B) out[k] = maxNum(out[k], B[k]);
    return out;
  }

  // Заметки редактируются в одном месте и растут, поэтому длинная версия почти всегда полнее.
  function mergeNotes(a, b) {
    const x = a || '';
    const y = b || '';
    if (x === y || !y) return x;
    if (!x) return y;
    return x.length >= y.length ? x : y;
  }

  function mergeTopic(a, b) {
    const A = a || {};
    const B = b || {};
    const out = Object.assign({}, A, B);
    out.theorySpent = maxNum(A.theorySpent, B.theorySpent);
    out.practiceSpent = maxNum(A.practiceSpent, B.practiceSpent);
    out.theoryUnlockedManually = !!(A.theoryUnlockedManually || B.theoryUnlockedManually);
    out.practiceUnlockedManually = !!(A.practiceUnlockedManually || B.practiceUnlockedManually);
    out.checks = unionFlags(A.checks, B.checks);
    out.practiceSteps = unionFlags(A.practiceSteps, B.practiceSteps);
    out.practiceDone = !!(A.practiceDone || B.practiceDone);
    out.notes = mergeNotes(A.notes, B.notes);
    out.quizBest = maxOrNull(A.quizBest, B.quizBest);
    out.quizAttempts = maxNum(A.quizAttempts, B.quizAttempts);
    out.startedAt = minOrNull(A.startedAt, B.startedAt);
    out.completedAt = minOrNull(A.completedAt, B.completedAt);
    return out;
  }

  function merge(local, remote) {
    const L = local || {};
    const R = remote || {};
    const out = Object.assign({}, R, L);

    const ids = {};
    for (const a in (L.topics || {})) ids[a] = true;
    for (const b in (R.topics || {})) ids[b] = true;
    out.topics = {};
    for (const id in ids) {
      out.topics[id] = mergeTopic((L.topics || {})[id], (R.topics || {})[id]);
    }

    out.papers = unionFlags(L.papers, R.papers);
    out.firstWeek = unionFlags(L.firstWeek, R.firstWeek);
    out.daily = mergeDaily(L.daily, R.daily);
    // Тема оформления и норма — про это устройство, локальный выбор главнее
    out.settings = Object.assign({}, R.settings, L.settings);
    // Таймер привязан к устройству и не переносится
    out.timer = L.timer || null;
    return out;
  }

  /* --- Обмен с GitHub --- */

  function shortText(text) {
    const s = String(text || '').replace(/\s+/g, ' ').trim();
    return s.length > 160 ? s.slice(0, 160) + '…' : s;
  }

  function describeError(status, text) {
    if (status === 401) return 'GitHub не принял токен (401). Проверь, что он скопирован целиком и не истёк.';
    if (status === 403 || status === 429) return 'GitHub отказал (' + status + '). Либо у токена нет права gist, либо превышен лимит запросов.';
    if (status === 404) return 'Gist не найден (404). Проверь id или очисти поле, чтобы создать новый.';
    return 'Ошибка GitHub ' + status + ': ' + shortText(text);
  }

  function request(path, options) {
    const opts = options || {};
    const headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + cfg.token,
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (opts.body) headers['Content-Type'] = 'application/json';
    return fetch(API + path, {
      method: opts.method || 'GET',
      headers: headers,
      // без no-store браузер может отдать прошлый ответ и синхронизация «не увидит» чужие правки
      cache: 'no-store',
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      if (res.ok) return res.json();
      return res.text().then(function (text) {
        throw new Error(describeError(res.status, text));
      });
    });
  }

  function parseState(text) {
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !parsed.topics) {
      throw new Error('Содержимое gist не похоже на прогресс ML Journey.');
    }
    return parsed;
  }

  function pull() {
    if (!cfg.gistId) return Promise.resolve(null);
    return request('/' + encodeURIComponent(cfg.gistId), null).then(function (gist) {
      const file = gist.files && gist.files[FILE];
      if (!file) throw new Error('В gist нет файла ' + FILE + '. Укажи другой id или очисти поле.');
      if (file.truncated && file.raw_url) {
        return fetch(file.raw_url, { cache: 'no-store' }).then(function (r) { return r.text(); });
      }
      return file.content;
    }).then(parseState);
  }

  function push(stateObj) {
    const body = { files: {} };
    body.files[FILE] = { content: JSON.stringify(stateObj, null, 2) };
    if (cfg.gistId) {
      return request('/' + encodeURIComponent(cfg.gistId), { method: 'PATCH', body: body })
        .then(function (gist) { return gist.id; });
    }
    body.description = 'ML Journey — прогресс обучения';
    body.public = false;
    return request('', { method: 'POST', body: body }).then(function (gist) { return gist.id; });
  }

  function run() {
    if (!cfg.token) return Promise.reject(new Error('Сначала укажи токен GitHub с правом gist.'));
    // Фиксируем накопленное время работающего таймера, чтобы оно попало в выгрузку
    Store.tickPersist();
    return pull().then(function (remote) {
      const local = JSON.parse(JSON.stringify(Store.getState()));
      const merged = remote ? merge(local, remote) : local;
      if (remote) Store.importJSON(JSON.stringify(merged));
      return push(merged);
    }).then(function (gistId) {
      return setConfig({ gistId: gistId, lastSyncAt: Date.now() });
    });
  }

  window.Sync = {
    config: config, setConfig: setConfig, forget: forget, isConfigured: isConfigured,
    merge: merge, run: run
  };
})();
