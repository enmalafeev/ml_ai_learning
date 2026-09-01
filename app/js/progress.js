/* Вычисляемое состояние: из сырого прогресса в Store — в проценты, статусы и блокировки. */
(function () {
  'use strict';

  const PASS = 0.8; // порог сдачи теста

  function ratio(obj, total) {
    if (!total) return 1;
    let n = 0;
    for (const k in obj) if (obj[k]) n++;
    return Math.min(1, n / total);
  }

  function topicState(id) {
    const entry = window.CURRICULUM.getTopic(id);
    if (!entry) return null;
    const topic = entry.topic;
    const p = Store.topic(id);

    const theoryTarget = (topic.theoryMinutes || 0) * 60;
    const practiceTarget = (topic.practiceMinutes || 0) * 60;
    const theorySpent = Store.spent(id, 'theory');
    const practiceSpent = Store.spent(id, 'practice');

    const checkTotal = (topic.checklist || []).length;
    const checkRatio = ratio(p.checks, checkTotal);
    const checksDone = checkTotal === 0 || checkRatio >= 1;

    const stepTotal = topic.practice ? (topic.practice.steps || []).length : 0;
    const stepRatio = ratio(p.practiceSteps, stepTotal);

    const theoryTimeDone = theoryTarget === 0 || theorySpent >= theoryTarget;
    const practiceUnlocked = theoryTimeDone || p.theoryUnlockedManually;
    const quizUnlocked = p.practiceDone || p.practiceUnlockedManually;

    const hasQuiz = (topic.quiz || []).length > 0;
    const quizPassed = hasQuiz ? (p.quizBest !== null && p.quizBest >= PASS) : true;

    const done = checksDone && p.practiceDone && quizPassed;

    // Вес: теория 40%, практика 35%, тест 25%. Без теста вес делится между первыми двумя.
    const wTheory = hasQuiz ? 0.4 : 0.55;
    const wPractice = hasQuiz ? 0.35 : 0.45;
    const wQuiz = hasQuiz ? 0.25 : 0;

    const theoryScore = checkTotal
      ? 0.5 * Math.min(1, theoryTarget ? theorySpent / theoryTarget : 1) + 0.5 * checkRatio
      : Math.min(1, theoryTarget ? theorySpent / theoryTarget : 0);
    const practiceScore = p.practiceDone ? 1 : (stepTotal ? 0.85 * stepRatio : Math.min(0.85, practiceTarget ? practiceSpent / practiceTarget : 0));
    const quizScore = hasQuiz ? (p.quizBest || 0) : 0;

    const percent = Math.round(100 * (wTheory * theoryScore + wPractice * practiceScore + wQuiz * quizScore));

    let status = 'new';
    if (done) status = 'done';
    else if (quizUnlocked) status = 'quiz';
    else if (practiceUnlocked) status = 'practice';
    else if (theorySpent > 0 || checkRatio > 0) status = 'theory';

    return {
      id: id, topic: topic, block: entry.block, phase: entry.phase, raw: p,
      theoryTarget: theoryTarget, theorySpent: theorySpent,
      practiceTarget: practiceTarget, practiceSpent: practiceSpent,
      theoryRemaining: Math.max(0, theoryTarget - theorySpent),
      theoryTimeDone: theoryTimeDone,
      checkTotal: checkTotal, checkRatio: checkRatio, checksDone: checksDone,
      stepTotal: stepTotal, stepRatio: stepRatio,
      practiceUnlocked: practiceUnlocked, quizUnlocked: quizUnlocked,
      hasQuiz: hasQuiz, quizPassed: quizPassed, quizBest: p.quizBest,
      done: done, percent: Math.max(0, Math.min(100, percent)), status: status
    };
  }

  function aggregate(topics) {
    let sum = 0, done = 0, spent = 0, planned = 0;
    topics.forEach(function (t) {
      const s = topicState(t.id);
      sum += s.percent;
      if (s.done) done++;
      spent += s.theorySpent + s.practiceSpent;
      planned += s.theoryTarget + s.practiceTarget;
    });
    return {
      count: topics.length,
      done: done,
      percent: topics.length ? Math.round(sum / topics.length) : 0,
      spentSeconds: spent,
      plannedSeconds: planned
    };
  }

  function blockProgress(block) { return aggregate(block.topics); }
  function phaseProgress(phase) { return aggregate(window.CURRICULUM.phaseTopics(phase)); }

  function overall() {
    const all = window.CURRICULUM.phases.reduce(function (a, p) {
      return a.concat(window.CURRICULUM.phaseTopics(p));
    }, []);
    return aggregate(all);
  }

  /* Следующая тема для продолжения: первая незавершённая по порядку плана. */
  function nextUp() {
    const order = window.CURRICULUM.order;
    // Сначала — та, где уже есть прогресс, но она не закончена
    for (let i = 0; i < order.length; i++) {
      const s = topicState(order[i]);
      if (!s.done && s.status !== 'new') return s;
    }
    for (let i = 0; i < order.length; i++) {
      const s = topicState(order[i]);
      if (!s.done) return s;
    }
    return null;
  }

  function weekSeconds() {
    return Store.dailySeries(7).reduce(function (a, d) { return a + d.seconds; }, 0);
  }

  function streak() {
    const series = Store.dailySeries(180);
    let n = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i].seconds >= 60) n++;
      else if (i === series.length - 1) continue; // сегодня ещё может не быть занятий
      else break;
    }
    return n;
  }

  window.Progress = {
    PASS: PASS,
    topicState: topicState,
    blockProgress: blockProgress,
    phaseProgress: phaseProgress,
    overall: overall,
    nextUp: nextUp,
    weekSeconds: weekSeconds,
    streak: streak
  };
})();
