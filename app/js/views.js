/* Рендеринг экранов. Каждая функция возвращает HTML-строку. */
(function () {
  'use strict';

  const C = window.CURRICULUM;

  /* --- Утилиты --- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
    if (h && m) return h + ' ч ' + m + ' мин';
    if (h) return h + ' ч';
    if (m) return m + ' мин';
    return sec > 0 ? 'меньше минуты' : '0 мин';
  }

  function fmtMinutes(min) {
    if (min >= 60) {
      const h = Math.floor(min / 60), m = min % 60;
      return m ? h + ' ч ' + m + ' мин' : h + ' ч';
    }
    return min + ' мин';
  }

  function fmtClock(sec) {
    const neg = sec < 0;
    sec = Math.abs(Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const body = (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(s).padStart(2, '0');
    return (neg ? '+' : '') + body;
  }

  function ring(percent, done) {
    return '<div class="ring' + (done ? ' done' : '') + '" style="--p:' + percent + '"><span>' + percent + '</span></div>';
  }

  function bar(percent, done) {
    return '<div class="bar' + (done ? ' ok' : '') + '"><i style="width:' + percent + '%"></i></div>';
  }

  const STATUS_LABEL = {
    'new': 'Не начата',
    'theory': 'Теория',
    'practice': 'Практика',
    'quiz': 'Тест',
    'done': 'Завершена'
  };

  /* --- Дашборд --- */

  function dashboard() {
    const ov = Progress.overall();
    const next = Progress.nextUp();
    const week = Progress.weekSeconds();
    const goal = Store.getState().settings.weeklyGoalHours || 11;
    const weekPct = Math.min(100, Math.round(100 * week / (goal * 3600)));
    const st = Progress.streak();
    const todaySec = Store.dailySeries(1)[0].seconds;

    let h = '';

    h += '<h1>План входа в ИИ и ML</h1>';
    h += '<p class="lede">Аспирантура по специальности 1.2.1 · старт 01.09.2026</p>';

    // Продолжить
    if (next) {
      const isNew = next.status === 'new';
      h += '<div class="card">';
      h += '<div class="tiny faint" style="text-transform:uppercase;letter-spacing:.05em;font-weight:600">' +
        (isNew ? 'Следующая тема' : 'Продолжить') + '</div>';
      h += '<h3 style="margin:6px 0 2px;font-size:17px">' + esc(next.topic.title) + '</h3>';
      h += '<div class="small muted" style="margin-bottom:12px">' + esc(next.phase.title.split('.')[0]) +
        ' · ' + esc(next.block.title) + ' · ' + fmtMinutes(C.topicMinutes(next.topic)) + '</div>';
      h += bar(next.percent, false);
      h += '<div class="btn-row" style="margin-top:14px">';
      h += '<a class="btn primary" href="#/topic/' + next.id + '">' + (isNew ? 'Начать' : 'Продолжить') + '</a>';
      h += '<a class="btn ghost" href="#/plan">Весь план</a>';
      h += '</div></div>';
    } else {
      h += '<div class="card"><h3>План пройден целиком</h3><p class="muted small" style="margin:0">Все темы закрыты. Дальше — только научная работа.</p></div>';
    }

    // Статистика
    h += '<div class="card"><div class="grid-3">';
    h += '<div class="stat"><div class="stat-n">' + Math.round(todaySec / 60) + '</div><div class="stat-l">минут сегодня</div></div>';
    h += '<div class="stat"><div class="stat-n">' + ov.done + '</div><div class="stat-l">из ' + ov.count + ' тем</div></div>';
    h += '<div class="stat"><div class="stat-n">' + st + '</div><div class="stat-l">' + plural(st, 'день подряд', 'дня подряд', 'дней подряд') + '</div></div>';
    h += '</div><hr style="margin:14px 0">';
    h += '<div class="row" style="margin-bottom:7px"><div class="row-grow small">Неделя: ' + fmtDur(week) + ' из ' + goal + ' ч</div>' +
      '<div class="small faint">' + weekPct + '%</div></div>';
    h += bar(weekPct, weekPct >= 100);
    h += '<div class="tiny faint" style="margin-top:9px">Бюджет из плана — 10–12 часов в неделю. Меньше 8 — план поедет.</div>';
    h += '</div>';

    // Фазы
    h += '<div class="section-head"><h2>Фазы</h2><a class="small" href="#/plan">все темы</a></div>';
    C.phases.forEach(function (phase) {
      const pr = Progress.phaseProgress(phase);
      h += '<a class="card card-link pad-sm" href="#/phase/' + phase.id + '">';
      h += '<div class="row">' + ring(pr.percent, pr.percent >= 100);
      h += '<div class="row-grow"><div style="font-weight:600;font-size:14.5px">' + esc(phase.title) + '</div>';
      h += '<div class="tiny faint">' + esc(phase.period) + '</div>';
      h += '<div class="tiny muted" style="margin-top:3px">' + pr.done + ' из ' + pr.count + ' тем · ' + esc(phase.hours) + '</div>';
      h += '</div></div></a>';
    });

    // Первая неделя
    const fwState = Store.getState().firstWeek;
    const fwDone = C.firstWeek.filter(function (i) { return fwState[i.id]; }).length;
    h += '<div class="section-head"><h2>Первая неделя</h2><span class="badge' + (fwDone === C.firstWeek.length ? ' ok' : '') + '">' + fwDone + '/' + C.firstWeek.length + '</span></div>';
    h += '<div class="card"><ul class="checklist">';
    C.firstWeek.forEach(function (item) {
      h += '<li><label><input type="checkbox" data-firstweek="' + item.id + '"' + (fwState[item.id] ? ' checked' : '') + '>';
      h += '<span>' + esc(item.text);
      if (item.url) h += ' <a href="' + esc(item.url) + '" target="_blank" rel="noopener" class="tiny">↗</a>';
      h += '</span></label></li>';
    });
    h += '</ul></div>';

    // Правила
    h += '<div class="section-head"><h2>Три правила</h2></div>';
    h += '<div class="card">';
    C.rules.forEach(function (r, i) {
      h += '<div class="callout" style="margin:' + (i ? '14px' : '2px') + ' 0 0">' + esc(r) + '</div>';
    });
    h += '</div>';

    h += '<div class="callout warn" style="margin-top:22px"><b>Главный риск</b> — попытка изучить всё. Кандидатская защищается не за широту, а за один конкретный результат в одной узкой точке.</div>';

    return h;
  }

  /* --- План: все фазы --- */

  function plan() {
    let h = '<h1>План</h1><p class="lede">' + C.totalTopics + ' тем в пяти треках. Фаза 0 наполнена полностью, остальные заведены как каркас.</p>';

    h += '<div class="card"><h3 style="margin-bottom:10px">Ориентир по срокам</h3>';
    C.timeline.forEach(function (t) {
      h += '<div class="kv"><div><b class="mono tiny">' + esc(t.period) + '</b><div class="small">' + esc(t.focus) + '</div>' +
        '<div class="tiny faint">' + esc(t.checkpoint) + '</div></div></div>';
    });
    h += '</div>';

    C.phases.forEach(function (phase) {
      const pr = Progress.phaseProgress(phase);
      h += '<div class="section-head"><h2>' + esc(phase.title) + '</h2><span class="badge' + (pr.percent >= 100 ? ' ok' : '') + '">' + pr.percent + '%</span></div>';
      h += '<div class="small muted" style="margin:-4px 0 10px">' + esc(phase.period) + ' · ' + esc(phase.hours) + '</div>';
      phase.blocks.forEach(function (block) {
        const bp = Progress.blockProgress(block);
        h += '<div class="section-head" style="margin:16px 0 7px"><h3 style="font-size:13.5px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.04em">' +
          esc(block.title) + '</h3><span class="tiny faint">' + bp.done + '/' + bp.count + '</span></div>';
        h += topicList(block.topics);
      });
    });
    return h;
  }

  function topicList(topics) {
    let h = '<div class="topic-list">';
    topics.forEach(function (t) {
      const s = Progress.topicState(t.id);
      h += '<a class="topic-row" href="#/topic/' + t.id + '">';
      h += '<span class="dot-state ' + (s.done ? 'done' : (s.status !== 'new' ? 'progress' : '')) + '"></span>';
      h += '<div class="row-grow"><div class="t">' + esc(t.title) + '</div>';
      h += '<div class="s">' + fmtMinutes(C.topicMinutes(t)) + ' · ' + STATUS_LABEL[s.status] +
        (t.stub ? ' · <span class="faint">каркас</span>' : '') + '</div></div>';
      h += '<div style="width:38px;flex:none">' + bar(s.percent, s.done) + '</div>';
      h += '</a>';
    });
    return h + '</div>';
  }

  /* --- Фаза --- */

  function phaseView(id) {
    const phase = C.phases.filter(function (p) { return p.id === id; })[0];
    if (!phase) return notFound();
    const pr = Progress.phaseProgress(phase);

    let h = '<a class="backlink" href="#/">← Дашборд</a>';
    h += '<h1>' + esc(phase.title) + '</h1>';
    h += '<p class="lede">' + esc(phase.period) + ' · ' + esc(phase.hours) + '</p>';

    h += '<div class="card"><div class="row" style="margin-bottom:12px">' + ring(pr.percent, pr.percent >= 100) +
      '<div class="row-grow"><div style="font-weight:600">' + pr.done + ' из ' + pr.count + ' тем закрыто</div>' +
      '<div class="tiny faint">Учтено времени: ' + fmtDur(pr.spentSeconds) + ' из ' + fmtDur(pr.plannedSeconds) + ' заведённых в темах</div></div></div>';
    if (phase.plannedHours && Math.abs(phase.plannedHours * 3600 - pr.plannedSeconds) > 3600) {
      h += '<div class="tiny faint">По плану на фазу отведено ~' + phase.plannedHours + ' ч. В темах пока расписано ' +
        Math.round(pr.plannedSeconds / 3600) + ' ч — остальное добавится при наполнении каркаса.</div>';
    }
    h += '</div>';

    h += '<div class="card"><h3>Цель</h3><p class="small muted" style="margin:0">' + esc(phase.goal) + '</p>';
    if (phase.checkpoint) {
      h += '<h3 style="margin-top:14px">Критерий готовности</h3><p class="small muted" style="margin:0">' + esc(phase.checkpoint) + '</p>';
    }
    h += '</div>';

    phase.blocks.forEach(function (block) {
      const bp = Progress.blockProgress(block);
      h += '<div class="section-head"><h2>' + esc(block.title) + '</h2><span class="badge">' + bp.done + '/' + bp.count + '</span></div>';
      if (block.hint) h += '<p class="small muted" style="margin:-4px 0 10px">' + esc(block.hint) + '</p>';
      h += topicList(block.topics);
    });
    return h;
  }

  /* --- Тема --- */

  function topicView(id, step, quizSession) {
    const s = Progress.topicState(id);
    if (!s) return notFound();
    const t = s.topic;
    step = step || defaultStep(s);

    let h = '<a class="backlink" href="#/phase/' + s.phase.id + '">← ' + esc(s.phase.title.split(':')[0]) + '</a>';
    h += '<div class="chips" style="margin-bottom:8px"><span class="badge">' + esc(s.block.title) + '</span>';
    h += '<span class="badge">' + fmtMinutes(C.topicMinutes(t)) + '</span>';
    if (t.stub) h += '<span class="badge stub">каркас · тест не наполнен</span>';
    if (s.done) h += '<span class="badge ok">завершена</span>';
    h += '</div>';
    h += '<h1>' + esc(t.title) + '</h1>';
    if (t.summary) h += '<p class="lede">' + esc(t.summary) + '</p>';

    // Шаги
    h += '<div class="steps">';
    h += stepBtn(id, 'theory', 'Теория', fmtMinutes(t.theoryMinutes || 0), step === 'theory', s.theoryTimeDone && s.checksDone, false);
    h += stepBtn(id, 'practice', 'Практика', fmtMinutes(t.practiceMinutes || 0), step === 'practice', s.raw.practiceDone, !s.practiceUnlocked);
    h += stepBtn(id, 'quiz', 'Тест', s.hasQuiz ? t.quiz.length + ' ' + plural(t.quiz.length, 'вопрос', 'вопроса', 'вопросов') : 'нет', step === 'quiz', s.quizPassed && s.hasQuiz, !s.quizUnlocked);
    h += '</div>';

    if (step === 'theory') h += theoryStep(s);
    else if (step === 'practice') h += practiceStep(s);
    else h += quizStep(s, quizSession);

    // Навигация
    const nextId = C.nextTopicId(id), prevId = C.prevTopicId(id);
    h += '<hr><div class="btn-row" style="justify-content:space-between">';
    h += prevId ? '<a class="btn sm ghost" href="#/topic/' + prevId + '">← Предыдущая</a>' : '<span></span>';
    h += nextId ? '<a class="btn sm ghost" href="#/topic/' + nextId + '">Следующая →</a>' : '<span></span>';
    h += '</div>';
    return h;
  }

  function defaultStep(s) {
    if (!s.practiceUnlocked) return 'theory';
    if (!s.quizUnlocked) return 'practice';
    if (s.hasQuiz && !s.quizPassed) return 'quiz';
    if (!s.checksDone) return 'theory';
    return 'quiz';
  }

  function stepBtn(id, key, label, sub, active, done, locked) {
    const cls = 'step' + (active ? ' active' : '') + (done ? ' done' : '') + (locked ? ' locked' : '');
    return '<a class="' + cls + '" href="#/topic/' + id + '/' + key + '" style="text-decoration:none">' +
      (done ? '✓ ' : '') + label + '<small>' + esc(sub) + '</small></a>';
  }

  /* Шаг 1: теория */
  function theoryStep(s) {
    const t = s.topic;
    const running = Store.isRunning(s.id, 'theory');
    const remaining = s.theoryTarget - s.theorySpent;
    let h = '';

    // Таймер
    h += '<div class="card timer-card' + (running ? ' timer-running' : '') + '">';
    h += '<div class="tiny faint" style="text-transform:uppercase;letter-spacing:.06em;font-weight:600">' +
      (remaining > 0 ? 'Осталось изучать' : 'Время выработано') + '</div>';
    h += '<div class="timer-display' + (remaining <= 0 ? ' over' : '') + '" data-timer="theory">' + fmtClock(remaining) + '</div>';
    h += '<div class="timer-sub">' + fmtDur(s.theorySpent) + ' из ' + fmtMinutes(t.theoryMinutes || 0) + ' по плану</div>';
    h += '<div class="btn-row" style="justify-content:center">';
    if (running) {
      h += '<button class="btn primary" data-action="timer-pause">Пауза</button>';
    } else {
      h += '<button class="btn primary" data-action="timer-start" data-mode="theory" data-topic="' + s.id + '">' +
        (s.theorySpent > 0 ? 'Продолжить' : 'Начать изучение') + '</button>';
    }
    if (!s.practiceUnlocked) {
      h += '<button class="btn ghost" data-action="unlock-practice" data-topic="' + s.id + '">Я уже знаю тему</button>';
    }
    h += '</div>';
    if (remaining <= 0) {
      h += '<div class="tiny" style="color:var(--ok);margin-top:12px">Практика открыта. Таймер можно оставить включённым — время продолжит учитываться.</div>';
    }
    h += '</div>';

    // Ресурсы
    if ((t.resources || []).length) {
      h += '<div class="section-head"><h2>Материалы</h2></div><div class="card">';
      t.resources.forEach(function (r) {
        const inner = '<div class="res-t">' + esc(r.title) + (r.url ? ' <span class="ext">↗</span>' : '') + '</div>' +
          '<div class="res-src">' + esc(r.source || '') + '</div>' +
          (r.note ? '<div class="res-note">' + esc(r.note) + '</div>' : '');
        h += r.url
          ? '<a class="res" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + inner + '</a>'
          : '<div class="res">' + inner + '</div>';
      });
      h += '</div>';
    }

    // Чек-лист
    if (s.checkTotal) {
      h += '<div class="section-head"><h2>Что должно остаться в голове</h2><span class="badge' +
        (s.checksDone ? ' ok' : '') + '">' + Math.round(s.checkRatio * s.checkTotal) + '/' + s.checkTotal + '</span></div>';
      h += '<div class="card"><ul class="checklist">';
      t.checklist.forEach(function (item, i) {
        h += '<li><label><input type="checkbox" data-check="' + i + '" data-topic="' + s.id + '"' +
          (s.raw.checks[i] ? ' checked' : '') + '><span>' + esc(item) + '</span></label></li>';
      });
      h += '</ul></div>';
    }

    if (s.practiceUnlocked) {
      h += '<a class="btn primary wide" href="#/topic/' + s.id + '/practice">Перейти к практике →</a>';
    }
    return h;
  }

  /* Шаг 2: практика */
  function practiceStep(s) {
    const t = s.topic;
    if (!s.practiceUnlocked) {
      return '<div class="locked-note"><b>Практика откроется, когда отработает таймер теории.</b>' +
        '<div style="margin-top:8px">Осталось ' + fmtClock(s.theoryTarget - s.theorySpent) + '.</div>' +
        '<div class="btn-row" style="justify-content:center;margin-top:14px">' +
        '<a class="btn sm" href="#/topic/' + s.id + '/theory">К теории</a>' +
        '<button class="btn sm ghost" data-action="unlock-practice" data-topic="' + s.id + '">Открыть сейчас</button></div></div>';
    }
    if (!t.practice) {
      return '<div class="locked-note">Практическое задание для этой темы пока не заведено. Это тема-каркас: сформулируй задание сам, опираясь на материалы, и запиши его в заметках.</div>' +
        notesBlock(s) +
        '<button class="btn primary wide" data-action="practice-done" data-topic="' + s.id + '" style="margin-top:12px">' +
        (s.raw.practiceDone ? 'Отметить как невыполненное' : 'Практика выполнена') + '</button>';
    }

    const running = Store.isRunning(s.id, 'practice');
    let h = '';

    h += '<div class="card"><h3>' + esc(t.practice.title) + '</h3>';
    if (t.practice.description) h += '<p class="small muted" style="margin:6px 0 0">' + esc(t.practice.description) + '</p></div>';
    else h += '</div>';

    // Таймер практики (без блокировок, просто учёт времени)
    h += '<div class="card pad-sm"><div class="row">';
    h += '<div class="row-grow"><div class="small" style="font-weight:560">Время на практику</div>' +
      '<div class="tiny faint">' + fmtDur(s.practiceSpent) + ' из ' + fmtMinutes(t.practiceMinutes || 0) + ' по плану</div></div>';
    h += '<div class="mono" style="font-size:17px;font-weight:600" data-timer="practice">' + fmtClock(s.practiceSpent) + '</div>';
    h += running
      ? '<button class="btn sm" data-action="timer-pause">Пауза</button>'
      : '<button class="btn sm primary" data-action="timer-start" data-mode="practice" data-topic="' + s.id + '">Старт</button>';
    h += '</div></div>';

    if ((t.practice.steps || []).length) {
      h += '<div class="section-head"><h2>Шаги</h2><span class="badge' + (s.stepRatio >= 1 ? ' ok' : '') + '">' +
        Math.round(s.stepRatio * s.stepTotal) + '/' + s.stepTotal + '</span></div>';
      h += '<div class="card"><ul class="checklist">';
      t.practice.steps.forEach(function (item, i) {
        h += '<li><label><input type="checkbox" data-pstep="' + i + '" data-topic="' + s.id + '"' +
          (s.raw.practiceSteps[i] ? ' checked' : '') + '><span>' + esc(item) + '</span></label></li>';
      });
      h += '</ul></div>';
    }

    if ((t.practice.acceptance || []).length) {
      h += '<div class="section-head"><h2>Критерии готовности</h2></div><div class="card">';
      t.practice.acceptance.forEach(function (a) {
        h += '<div class="callout" style="margin:0 0 12px">' + esc(a) + '</div>';
      });
      h += '</div>';
    }

    h += notesBlock(s);

    h += '<button class="btn ' + (s.raw.practiceDone ? '' : 'primary') + ' wide" data-action="practice-done" data-topic="' + s.id + '" style="margin-top:14px">' +
      (s.raw.practiceDone ? '✓ Практика выполнена — отменить' : 'Практика выполнена') + '</button>';

    if (s.raw.practiceDone && s.hasQuiz) {
      h += '<a class="btn wide" href="#/topic/' + s.id + '/quiz" style="margin-top:8px">Перейти к тесту →</a>';
    }
    return h;
  }

  function notesBlock(s) {
    return '<div class="section-head"><h2>Заметки</h2></div><div class="card">' +
      '<textarea data-notes="' + s.id + '" placeholder="Что получилось, что нет, какие вопросы остались. Это черновик рабочего журнала.">' +
      esc(s.raw.notes) + '</textarea>' +
      '<div class="tiny faint" style="margin-top:6px">Сохраняется автоматически</div></div>';
  }

  /* Шаг 3: тест */
  function quizStep(s, session) {
    const t = s.topic;
    if (!s.hasQuiz) {
      return '<div class="locked-note"><b>Тест для этой темы не наполнен.</b>' +
        '<div style="margin-top:8px">Это тема-каркас. Вопросы добавляются вручную — см. README, раздел «Как добавить тему».</div></div>';
    }
    if (!s.quizUnlocked) {
      return '<div class="locked-note"><b>Тест откроется после практики.</b>' +
        '<div style="margin-top:8px">Смысл порядка в том, что вопросы проверяют понимание, а понимание даёт именно практика.</div>' +
        '<div class="btn-row" style="justify-content:center;margin-top:14px">' +
        '<a class="btn sm" href="#/topic/' + s.id + '/practice">К практике</a>' +
        '<button class="btn sm ghost" data-action="unlock-quiz" data-topic="' + s.id + '">Открыть сейчас</button></div></div>';
    }

    let h = '';
    if (s.quizBest !== null) {
      h += '<div class="card pad-sm"><div class="row"><div class="row-grow small">Лучший результат: <b>' +
        Math.round(s.quizBest * 100) + '%</b> · попыток: ' + s.raw.quizAttempts + '</div>' +
        (s.quizPassed ? '<span class="badge ok">сдан</span>' : '<span class="badge warn">нужно ' + Math.round(Progress.PASS * 100) + '%</span>') +
        '</div></div>';
    }

    const submitted = session && session.submitted;

    h += '<form id="quiz-form" data-topic="' + s.id + '">';
    t.quiz.forEach(function (q, qi) {
      const perm = session.perm[qi];
      const picked = session.answers[qi] || {};
      h += '<div class="q"><div class="q-num">Вопрос ' + (qi + 1) + ' из ' + t.quiz.length +
        (q.correct.length > 1 ? ' · несколько ответов' : '') + '</div>';
      h += '<div class="q-text">' + esc(q.q) + '</div>';
      perm.forEach(function (origIdx, pos) {
        const isCorrect = q.correct.indexOf(origIdx) >= 0;
        const isPicked = !!picked[origIdx];
        let cls = 'opt';
        if (submitted) {
          if (isPicked && isCorrect) cls += ' correct';
          else if (isPicked && !isCorrect) cls += ' wrong';
          else if (!isPicked && isCorrect) cls += ' reveal';
        }
        h += '<label class="' + cls + '"><input type="checkbox" data-q="' + qi + '" data-opt="' + origIdx + '"' +
          (isPicked ? ' checked' : '') + (submitted ? ' disabled' : '') + '>' +
          '<span>' + esc(q.options[origIdx]) + '</span></label>';
      });
      if (submitted && q.explain) {
        h += '<div class="explain"><b>' + (isQuestionCorrect(q, picked) ? 'Верно.' : 'Неверно.') + '</b> ' + esc(q.explain) + '</div>';
      }
      h += '</div>';
    });
    h += '</form>';

    if (!submitted) {
      h += '<button class="btn primary wide" data-action="quiz-submit" data-topic="' + s.id + '">Проверить ответы</button>';
    } else {
      const score = session.score;
      const pass = score >= Progress.PASS;
      h += '<div class="card score"><div class="score-n' + (pass ? ' pass' : '') + '">' + Math.round(score * 100) + '%</div>';
      h += '<div class="small muted">' + session.right + ' из ' + t.quiz.length + ' — ' +
        (pass ? 'тест сдан' : 'нужно минимум ' + Math.round(Progress.PASS * 100) + '%') + '</div>';
      h += '<div class="btn-row" style="justify-content:center;margin-top:14px">';
      h += '<button class="btn" data-action="quiz-retry" data-topic="' + s.id + '">Пройти заново</button>';
      const nextId = C.nextTopicId(s.id);
      if (pass && nextId) h += '<a class="btn primary" href="#/topic/' + nextId + '">Следующая тема →</a>';
      h += '</div></div>';
    }
    return h;
  }

  function isQuestionCorrect(q, picked) {
    const chosen = Object.keys(picked).filter(function (k) { return picked[k]; }).map(Number).sort();
    const correct = q.correct.slice().sort();
    return chosen.length === correct.length && chosen.every(function (v, i) { return v === correct[i]; });
  }

  /* --- Статьи --- */

  function papers() {
    const state = Store.getState().papers;
    const total = C.papers.reduce(function (a, g) { return a + g.items.length; }, 0);
    const done = C.papers.reduce(function (a, g) {
      return a + g.items.filter(function (i) { return state[i.n]; }).length;
    }, 0);

    let h = '<h1>Обязательные статьи</h1>';
    h += '<p class="lede">Читать в этом порядке, начиная с Фазы 2. Минимум, без которого разговор с научным сообществом не получается.</p>';
    h += '<div class="card pad-sm"><div class="row" style="margin-bottom:8px"><div class="row-grow small">Прочитано ' + done + ' из ' + total + '</div>' +
      '<div class="small faint">' + Math.round(100 * done / total) + '%</div></div>' + bar(Math.round(100 * done / total), done === total) + '</div>';

    h += '<div class="callout">Метод трёх проходов из заметки S. Keshav «How to Read a Paper» экономит месяцы. ' +
      '<a href="https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf" target="_blank" rel="noopener">Три страницы ↗</a></div>';

    C.papers.forEach(function (group) {
      h += '<div class="section-head"><h2>' + esc(group.group) + '</h2></div><div class="card">';
      group.items.forEach(function (p) {
        h += '<div class="paper"><input type="checkbox" data-paper="' + p.n + '"' + (state[p.n] ? ' checked' : '') + '>';
        h += '<span class="n">' + p.n + '</span><div class="row-grow">';
        h += p.url
          ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener" style="font-weight:' + (p.key ? '650' : '500') + '">' + esc(p.title) + ' ↗</a>'
          : '<span style="font-weight:' + (p.key ? '650' : '500') + '">' + esc(p.title) + '</span>';
        if (!p.url) h += '<div class="tiny faint">Прямой ссылки нет — искать по названию</div>';
        if (p.note) h += '<div class="res-note">' + esc(p.note) + '</div>';
        h += '</div></div>';
      });
      h += '</div>';
    });
    return h;
  }

  /* --- Статистика --- */

  function stats() {
    const ov = Progress.overall();
    const series = Store.dailySeries(56);
    const max = Math.max(1, series.reduce(function (a, d) { return Math.max(a, d.seconds); }, 0));
    const total = Object.keys(Store.getState().daily).reduce(function (a, k) { return a + Store.getState().daily[k]; }, 0);

    let h = '<h1>Прогресс</h1><p class="lede">Учитывается только время, отмеренное таймером внутри приложения.</p>';

    h += '<div class="card"><div class="grid-3">';
    h += '<div class="stat"><div class="stat-n">' + Math.round(total / 3600) + '</div><div class="stat-l">часов всего</div></div>';
    h += '<div class="stat"><div class="stat-n">' + ov.done + '</div><div class="stat-l">тем закрыто</div></div>';
    h += '<div class="stat"><div class="stat-n">' + ov.percent + '%</div><div class="stat-l">общий прогресс</div></div>';
    h += '</div></div>';

    h += '<div class="section-head"><h2>Последние 8 недель</h2></div>';
    h += '<div class="card"><div class="heat">';
    series.forEach(function (d) {
      const lvl = d.seconds === 0 ? 0 : Math.min(4, Math.ceil(4 * d.seconds / max));
      h += '<i data-l="' + lvl + '" title="' + d.date + ': ' + fmtDur(d.seconds) + '"></i>';
    });
    h += '</div><div class="tiny faint" style="margin-top:9px">Каждая клетка — день. Наведи курсор, чтобы увидеть дату и время.</div></div>';

    h += '<div class="section-head"><h2>По фазам</h2></div><div class="card">';
    C.phases.forEach(function (p) {
      const pr = Progress.phaseProgress(p);
      h += '<div style="margin-bottom:16px"><div class="row" style="margin-bottom:6px">' +
        '<div class="row-grow small" style="font-weight:560">' + esc(p.title.split('.')[0] + '.' + (p.title.split('.')[1] || '')) + '</div>' +
        '<div class="tiny faint">' + pr.done + '/' + pr.count + ' · ' + fmtDur(pr.spentSeconds) + '</div></div>' +
        bar(pr.percent, pr.percent >= 100) + '</div>';
    });
    h += '</div>';

    // Незавершённые темы с начатым прогрессом
    const started = C.order.map(Progress.topicState).filter(function (s) { return !s.done && s.status !== 'new'; });
    if (started.length) {
      h += '<div class="section-head"><h2>В работе</h2><span class="badge">' + started.length + '</span></div>';
      h += topicList(started.map(function (s) { return s.topic; }));
    }
    return h;
  }

  /* --- Настройки --- */

  function settings() {
    const st = Store.getState().settings;
    let h = '<h1>Настройки</h1>';

    h += '<div class="card"><h3>Тема оформления</h3><div class="btn-row" style="margin-top:10px">';
    [['auto', 'Как в системе'], ['light', 'Светлая'], ['dark', 'Тёмная']].forEach(function (o) {
      h += '<button class="btn sm' + (st.theme === o[0] ? ' primary' : '') + '" data-action="set-theme" data-value="' + o[0] + '">' + o[1] + '</button>';
    });
    h += '</div></div>';

    h += '<div class="card"><h3>Недельная норма</h3>';
    h += '<p class="small muted">План рассчитан на 10–12 часов в неделю. Меньше 8 — сроки поедут.</p>';
    h += '<div class="btn-row">';
    [8, 10, 11, 12, 15].forEach(function (n) {
      h += '<button class="btn sm' + (st.weeklyGoalHours === n ? ' primary' : '') + '" data-action="set-goal" data-value="' + n + '">' + n + ' ч</button>';
    });
    h += '</div></div>';

    h += '<div class="card"><h3>Резервная копия</h3>';
    h += '<p class="small muted">Прогресс хранится только в этом браузере. Очистка данных сайта его удалит — делай копию хотя бы раз в месяц.</p>';
    h += '<div class="btn-row"><button class="btn sm" data-action="export">Скачать копию</button>';
    h += '<label class="btn sm" style="cursor:pointer">Загрузить копию<input type="file" accept="application/json" id="import-file" hidden></label></div>';
    h += '</div>';

    h += '<div class="card"><h3>Сброс</h3>';
    h += '<p class="small muted">Удалит весь прогресс: время, чек-листы, результаты тестов, заметки.</p>';
    h += '<button class="btn sm" data-action="reset" style="border-color:var(--danger);color:var(--danger)">Сбросить прогресс</button></div>';

    h += '<div class="card"><h3>О приложении</h3>';
    h += '<p class="small muted" style="margin:0">Собрано на основе файла ml-plan-aspirantura-1.2.1.md. ' +
      'Фаза 0 наполнена полностью (' + C.phases[0].blocks.reduce(function (a, b) { return a + b.topics.length; }, 0) +
      ' тем с материалами, заданиями и тестами), остальные фазы заведены как каркас: структура и ресурсы есть, тесты наполняются по мере подхода.</p></div>';

    return h;
  }

  function notFound() {
    return '<h1>Страница не найдена</h1><p class="lede">Такого экрана нет.</p><a class="btn" href="#/">На дашборд</a>';
  }

  window.Views = {
    dashboard: dashboard, plan: plan, phase: phaseView, topic: topicView,
    papers: papers, stats: stats, settings: settings, notFound: notFound,
    esc: esc, fmtDur: fmtDur, fmtClock: fmtClock, fmtMinutes: fmtMinutes,
    isQuestionCorrect: isQuestionCorrect
  };
})();
