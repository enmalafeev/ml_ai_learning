/* Роутер, обработчики событий, тикер таймера. */
(function () {
  'use strict';

  const view = document.getElementById('view');
  const minibar = document.getElementById('minibar');
  const quizSessions = {};   // topicId -> { perm, answers, submitted, score, right }
  let current = { name: 'dashboard', params: [] };
  let notesTimer = null;

  /* --- Роутинг --- */

  function parseHash() {
    const raw = (location.hash || '#/').replace(/^#\/?/, '');
    const parts = raw.split('/').filter(Boolean);
    if (!parts.length) return { name: 'dashboard', params: [] };
    return { name: parts[0], params: parts.slice(1) };
  }

  function render(keepScroll) {
    const scroll = keepScroll ? window.scrollY : 0;
    current = parseHash();
    let html;
    switch (current.name) {
      case 'plan': html = Views.plan(); break;
      case 'phase': html = Views.phase(current.params[0]); break;
      case 'topic': html = renderTopic(current.params[0], current.params[1]); break;
      case 'papers': html = Views.papers(); break;
      case 'stats': html = Views.stats(); break;
      case 'settings': html = Views.settings(); break;
      case '': case 'dashboard': html = Views.dashboard(); break;
      default: html = Views.notFound();
    }
    view.innerHTML = html;
    updateTabs();
    updateSyncButton();
    updateMinibar();
    window.scrollTo(0, scroll);
  }

  function renderTopic(id, step) {
    const entry = CURRICULUM.getTopic(id);
    if (!entry) return Views.notFound();
    if (!quizSessions[id]) quizSessions[id] = newQuizSession(entry.topic);
    return Views.topic(id, step, quizSessions[id]);
  }

  function updateTabs() {
    const map = { dashboard: '#/', plan: '#/plan', phase: '#/plan', topic: '#/plan', papers: '#/papers', stats: '#/stats', settings: '#/settings' };
    const target = map[current.name] || '#/';
    document.querySelectorAll('.tabbar a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === target);
    });
  }

  /* --- Тест --- */

  function newQuizSession(topic) {
    return {
      perm: (topic.quiz || []).map(function (q) { return shuffle(q.options.map(function (_, i) { return i; })); }),
      answers: {},
      submitted: false,
      score: 0,
      right: 0
    };
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function submitQuiz(topicId) {
    const entry = CURRICULUM.getTopic(topicId);
    const session = quizSessions[topicId];
    let right = 0;
    entry.topic.quiz.forEach(function (q, qi) {
      if (Views.isQuestionCorrect(q, session.answers[qi] || {})) right++;
    });
    session.right = right;
    session.score = entry.topic.quiz.length ? right / entry.topic.quiz.length : 0;
    session.submitted = true;

    const p = Store.topic(topicId);
    const best = p.quizBest === null ? session.score : Math.max(p.quizBest, session.score);
    Store.updateTopic(topicId, { quizBest: best, quizAttempts: p.quizAttempts + 1 });
    render();
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  /* --- Таймер --- */

  function updateMinibar() {
    const tm = Store.activeTimer();
    if (!tm || !tm.running) { minibar.classList.remove('show'); minibar.innerHTML = ''; return; }
    const entry = CURRICULUM.getTopic(tm.topicId);
    if (!entry) { minibar.classList.remove('show'); return; }
    const onThisTopic = current.name === 'topic' && current.params[0] === tm.topicId;
    if (onThisTopic) { minibar.classList.remove('show'); minibar.innerHTML = ''; return; }

    const isTheory = tm.mode !== 'practice';
    const target = (isTheory ? entry.topic.theoryMinutes : entry.topic.practiceMinutes) * 60;
    const spent = Store.spent(tm.topicId, tm.mode);
    const shown = isTheory ? target - spent : spent;

    minibar.innerHTML = '<div class="minibar-in">' +
      '<span class="t" data-mini-timer>' + Views.fmtClock(shown) + '</span>' +
      '<span class="n">' + Views.esc(entry.topic.title) + '</span>' +
      '<button class="btn sm ghost" data-action="timer-pause">Пауза</button>' +
      '<a class="btn sm" href="#/topic/' + tm.topicId + '">Открыть</a></div>';
    minibar.classList.add('show');
  }

  let lastUnlocked = null;

  function tick() {
    const tm = Store.activeTimer();
    if (!tm || !tm.running) return;
    Store.tickPersist();

    const entry = CURRICULUM.getTopic(tm.topicId);
    if (!entry) return;
    const isTheory = tm.mode !== 'practice';
    const target = (isTheory ? entry.topic.theoryMinutes : entry.topic.practiceMinutes) * 60;
    const spent = Store.spent(tm.topicId, tm.mode);

    // Обновляем цифры на месте, чтобы не терять состояние форм
    const el = document.querySelector('[data-timer="' + (isTheory ? 'theory' : 'practice') + '"]');
    if (el && current.name === 'topic' && current.params[0] === tm.topicId) {
      const shown = isTheory ? target - spent : spent;
      el.textContent = Views.fmtClock(shown);
      if (isTheory) el.classList.toggle('over', shown <= 0);
    }
    const mini = minibar.querySelector('[data-mini-timer]');
    if (mini) mini.textContent = Views.fmtClock(isTheory ? target - spent : spent);

    // Момент разблокировки практики: перерисовываем и сообщаем
    if (isTheory && target > 0 && spent >= target && lastUnlocked !== tm.topicId) {
      lastUnlocked = tm.topicId;
      notify('Время на теорию отработано', entry.topic.title + ' — практика открыта.');
      if (current.name === 'topic' && current.params[0] === tm.topicId) render(true);
    }
  }

  function notify(title, body) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: body, tag: 'ml-journey' });
        return;
      }
    } catch (e) { /* уведомления недоступны — не страшно */ }
    const el = document.createElement('div');
    el.className = 'card';
    el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(70px + env(safe-area-inset-bottom));z-index:60;box-shadow:var(--shadow);max-width:600px;margin:0 auto';
    el.innerHTML = '<b>' + Views.esc(title) + '</b><div class="small muted">' + Views.esc(body) + '</div>';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 5000);
  }

  /* --- Действия --- */

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const topicId = btn.dataset.topic;

    if (action === 'timer-start') {
      Store.startTimer(topicId, btn.dataset.mode);
      lastUnlocked = null;
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(function () {});
      }
      render(true);
    } else if (action === 'timer-pause') {
      Store.pauseTimer();
      render(true);
    } else if (action === 'unlock-practice') {
      Store.updateTopic(topicId, { theoryUnlockedManually: true });
      location.hash = '#/topic/' + topicId + '/practice';
    } else if (action === 'unlock-quiz') {
      Store.updateTopic(topicId, { practiceUnlockedManually: true });
      render();
    } else if (action === 'practice-done') {
      const p = Store.topic(topicId);
      Store.updateTopic(topicId, { practiceDone: !p.practiceDone });
      render(true);
    } else if (action === 'quiz-submit') {
      submitQuiz(topicId);
    } else if (action === 'quiz-retry') {
      quizSessions[topicId] = newQuizSession(CURRICULUM.getTopic(topicId).topic);
      render();
      window.scrollTo(0, 0);
    } else if (action === 'set-theme') {
      Store.setSetting('theme', btn.dataset.value);
      applyTheme();
      render(true);
    } else if (action === 'set-goal') {
      Store.setSetting('weeklyGoalHours', Number(btn.dataset.value));
      render(true);
    } else if (action === 'export') {
      exportBackup();
    } else if (action === 'sync-run') {
      runSync(btn);
    } else if (action === 'sync-forget') {
      if (confirm('Забыть токен и id гиста? Сам gist на GitHub останется.')) {
        Sync.forget();
        render(true);
      }
    } else if (action === 'reset') {
      if (confirm('Удалить весь прогресс? Это действие нельзя отменить.')) {
        Store.reset();
        render();
      }
    } else if (action === 'toggle-theme') {
      const order = ['auto', 'light', 'dark'];
      const cur = Store.getState().settings.theme || 'auto';
      Store.setSetting('theme', order[(order.indexOf(cur) + 1) % order.length]);
      applyTheme();
    }
  });

  document.addEventListener('change', function (e) {
    const el = e.target;

    if (el.dataset.check !== undefined) {
      const p = Store.topic(el.dataset.topic);
      p.checks[el.dataset.check] = el.checked;
      if (!el.checked) delete p.checks[el.dataset.check];
      Store.commit();
      render(true);
    } else if (el.dataset.pstep !== undefined) {
      const p = Store.topic(el.dataset.topic);
      p.practiceSteps[el.dataset.pstep] = el.checked;
      if (!el.checked) delete p.practiceSteps[el.dataset.pstep];
      Store.commit();
      render(true);
    } else if (el.dataset.q !== undefined) {
      const form = el.closest('#quiz-form');
      const session = quizSessions[form.dataset.topic];
      if (!session || session.submitted) return;
      const qi = el.dataset.q;
      if (!session.answers[qi]) session.answers[qi] = {};
      session.answers[qi][el.dataset.opt] = el.checked;
    } else if (el.dataset.paper !== undefined) {
      Store.togglePaper(el.dataset.paper);
      render(true);
    } else if (el.dataset.firstweek !== undefined) {
      Store.toggleFirstWeek(el.dataset.firstweek);
      render(true);
    } else if (el.id === 'import-file') {
      const file = el.files && el.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          Store.importJSON(String(reader.result));
          alert('Прогресс восстановлен.');
          render();
        } catch (err) {
          alert('Не удалось прочитать файл: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  });

  document.addEventListener('input', function (e) {
    const el = e.target;
    if (el.dataset.notes === undefined) return;
    clearTimeout(notesTimer);
    notesTimer = setTimeout(function () {
      const p = Store.topic(el.dataset.notes);
      p.notes = el.value;
      Store.commit();
    }, 500);
  });

  /* --- Синхронизация --- */

  // Сообщение либо в строку статуса на экране настроек, либо всплывашкой, если её нет
  function syncStatus(text) {
    const el = document.querySelector('[data-sync-status]');
    if (el) el.textContent = text;
    else notify('Синхронизация', text);
  }

  function runSync(btn) {
    const tokenEl = document.getElementById('sync-token');
    const gistEl = document.getElementById('sync-gist');
    const patch = {};
    if (tokenEl && tokenEl.value.trim()) patch.token = tokenEl.value.trim();
    if (gistEl) patch.gistId = gistEl.value.trim();
    Sync.setConfig(patch);

    if (!Sync.isConfigured()) {
      syncStatus('Нужен токен GitHub с правом gist.');
      return;
    }

    // У кнопки в шапке подпись — это svg, её текст трогать нельзя
    const isIcon = !!btn.querySelector('svg');
    const label = btn.textContent;
    btn.disabled = true;
    if (!isIcon) btn.textContent = 'Синхронизация…';
    const statusEl = document.querySelector('[data-sync-status]');
    if (statusEl) statusEl.textContent = 'Обмен с GitHub…';

    Sync.run().then(function () {
      render(true);
      syncStatus('Готово — прогресс слит и выгружен.');
    }).catch(function (err) {
      btn.disabled = false;
      if (!isIcon) btn.textContent = label;
      syncStatus(err.message);
    });
  }

  function updateSyncButton() {
    const b = document.getElementById('sync-btn');
    if (b) b.hidden = !Sync.isConfigured();
  }

  function exportBackup() {
    const data = Store.exportJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ml-journey-backup-' + Store.todayKey() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* --- Тема оформления --- */

  function applyTheme() {
    const t = Store.getState().settings.theme || 'auto';
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }

  /* --- Жизненный цикл --- */

  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });

  // Фиксируем время при уходе со страницы, чтобы ничего не потерялось
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') Store.tickPersist();
    else { render(true); }
  });
  window.addEventListener('pagehide', function () { Store.tickPersist(); });

  // Если браузер не даёт писать в localStorage (частый случай при открытии через file://
  // в Safari или в приватном режиме), прогресс не сохранится — предупреждаем сразу.
  function checkStorage() {
    try {
      localStorage.setItem('__probe', '1');
      localStorage.removeItem('__probe');
      return true;
    } catch (e) { return false; }
  }

  if (!checkStorage()) {
    const warn = document.createElement('div');
    warn.className = 'card';
    warn.style.cssText = 'margin:12px 16px 0;border-color:var(--warn);max-width:940px;margin-left:auto;margin-right:auto';
    warn.innerHTML = '<b>Прогресс не сохраняется</b><div class="small muted">' +
      'Браузер запретил локальное хранилище. Чаще всего это происходит при открытии файла напрямую (file://) ' +
      'или в приватном окне. Запусти приложение через локальный сервер — см. README.</div>';
    document.body.insertBefore(warn, document.querySelector('main'));
  }

  applyTheme();
  render();
  setInterval(tick, 1000);

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (e) {
        console.warn('Service worker не зарегистрирован:', e.message);
      });
    });
  }
})();
