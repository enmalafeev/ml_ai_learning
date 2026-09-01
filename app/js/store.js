/* Хранилище прогресса в localStorage. Единственный источник правды о состоянии. */
(function () {
  'use strict';

  const KEY = 'ml-journey.v1';
  const listeners = [];

  const DEFAULT_STATE = {
    v: 1,
    topics: {},
    timer: null,           // { topicId, mode: 'theory'|'practice', startedAt, running }
    papers: {},
    firstWeek: {},
    daily: {},             // 'YYYY-MM-DD' -> секунды
    settings: { theme: 'auto', weeklyGoalHours: 11 }
  };

  const DEFAULT_TOPIC = {
    theorySpent: 0,        // секунды
    practiceSpent: 0,
    theoryUnlockedManually: false,
    practiceUnlockedManually: false,
    checks: {},            // индекс пункта чек-листа -> true
    practiceSteps: {},     // индекс шага -> true
    practiceDone: false,
    notes: '',
    quizBest: null,        // 0..1
    quizAttempts: 0,
    startedAt: null,
    completedAt: null
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return Object.assign(clone(DEFAULT_STATE), parsed);
    } catch (e) {
      console.warn('Не удалось прочитать сохранённый прогресс, начинаем с чистого состояния', e);
      return clone(DEFAULT_STATE);
    }
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Не удалось сохранить прогресс', e);
    }
  }

  function emit() {
    listeners.forEach(function (fn) { fn(state); });
  }

  function commit() { persist(); emit(); }

  function subscribe(fn) { listeners.push(fn); return function () {
    const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1);
  }; }

  function getState() { return state; }

  function topic(id) {
    if (!state.topics[id]) state.topics[id] = clone(DEFAULT_TOPIC);
    // Дополняем поля, появившиеся в новых версиях приложения
    const t = state.topics[id];
    for (const k in DEFAULT_TOPIC) {
      if (!(k in t)) t[k] = clone(DEFAULT_TOPIC[k]);
    }
    return t;
  }

  function updateTopic(id, patch) {
    const t = topic(id);
    Object.assign(t, patch);
    if (!t.startedAt) t.startedAt = Date.now();
    commit();
    return t;
  }

  function todayKey(ts) {
    const d = ts ? new Date(ts) : new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function addDaily(seconds) {
    if (seconds <= 0) return;
    const k = todayKey();
    state.daily[k] = (state.daily[k] || 0) + seconds;
  }

  /* --- Таймер: хранится по timestamp, поэтому переживает перезагрузку и закрытие вкладки --- */

  function startTimer(topicId, mode) {
    flushTimer();
    state.timer = { topicId: topicId, mode: mode, startedAt: Date.now(), running: true };
    topic(topicId);
    commit();
  }

  function pauseTimer() {
    flushTimer();
    commit();
  }

  /* Переносит накопленное время таймера в прогресс темы и останавливает его. */
  function flushTimer() {
    const tm = state.timer;
    if (!tm || !tm.running) return 0;
    const elapsed = Math.max(0, Math.round((Date.now() - tm.startedAt) / 1000));
    const t = topic(tm.topicId);
    if (tm.mode === 'practice') t.practiceSpent += elapsed;
    else t.theorySpent += elapsed;
    if (!t.startedAt) t.startedAt = Date.now();
    addDaily(elapsed);
    state.timer = null;
    return elapsed;
  }

  /* Периодическая фиксация без остановки: чтобы прогресс не терялся при внезапном закрытии. */
  function tickPersist() {
    const tm = state.timer;
    if (!tm || !tm.running) return;
    const elapsed = Math.max(0, Math.round((Date.now() - tm.startedAt) / 1000));
    if (elapsed < 20) return;
    const t = topic(tm.topicId);
    if (tm.mode === 'practice') t.practiceSpent += elapsed;
    else t.theorySpent += elapsed;
    addDaily(elapsed);
    tm.startedAt = Date.now();
    persist();
  }

  /* Секунды, накопленные по режиму, включая незафиксированное время работающего таймера. */
  function spent(topicId, mode) {
    const t = topic(topicId);
    let base = mode === 'practice' ? t.practiceSpent : t.theorySpent;
    const tm = state.timer;
    if (tm && tm.running && tm.topicId === topicId && tm.mode === mode) {
      base += Math.max(0, Math.round((Date.now() - tm.startedAt) / 1000));
    }
    return base;
  }

  function activeTimer() { return state.timer; }

  function isRunning(topicId, mode) {
    const tm = state.timer;
    return !!(tm && tm.running && tm.topicId === topicId && (!mode || tm.mode === mode));
  }

  /* --- Прочее --- */

  function togglePaper(n) {
    if (state.papers[n]) delete state.papers[n]; else state.papers[n] = true;
    commit();
  }

  function toggleFirstWeek(id) {
    if (state.firstWeek[id]) delete state.firstWeek[id]; else state.firstWeek[id] = true;
    commit();
  }

  function setSetting(key, value) {
    state.settings[key] = value;
    commit();
  }

  function exportJSON() {
    flushTimer();
    persist();
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !parsed.topics) {
      throw new Error('Файл не похож на резервную копию прогресса');
    }
    state = Object.assign(clone(DEFAULT_STATE), parsed);
    commit();
  }

  function reset() {
    state = clone(DEFAULT_STATE);
    commit();
  }

  function dailySeries(days) {
    const out = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const k = todayKey(d.getTime());
      out.push({ date: k, seconds: state.daily[k] || 0, dow: d.getDay() });
    }
    return out;
  }

  window.Store = {
    getState: getState, subscribe: subscribe, commit: commit,
    topic: topic, updateTopic: updateTopic,
    startTimer: startTimer, pauseTimer: pauseTimer, flushTimer: flushTimer,
    tickPersist: tickPersist, spent: spent, activeTimer: activeTimer, isRunning: isRunning,
    togglePaper: togglePaper, toggleFirstWeek: toggleFirstWeek, setSetting: setSetting,
    exportJSON: exportJSON, importJSON: importJSON, reset: reset,
    dailySeries: dailySeries, todayKey: todayKey
  };
})();
