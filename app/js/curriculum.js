/* Сборка учебного плана из блоков + индекс тем. */
(function () {
  'use strict';

  const PHASE0 = {
    id: 'phase-0',
    title: 'Фаза 0. Фундамент: Python и математика',
    period: 'Сентябрь — середина октября 2026 (6 недель)',
    hours: '~60 часов',
    plannedHours: 60,
    goal: 'Перестать спотыкаться о синтаксис и нотацию. Не выучить математику, а научиться её читать.',
    checkpoint: 'Ты можешь на NumPy без подсказок реализовать линейную регрессию с обучением через градиентный спуск и объяснить, что означает каждая строчка формулы обновления весов.',
    blocks: [
      window.ML_PHASE0_BLOCK_PY,
      window.ML_PHASE0_BLOCK_LA,
      window.ML_PHASE0_BLOCK_CALC,
      window.ML_PHASE0_BLOCK_PROB,
      window.ML_PHASE0_BLOCK_CHECK
    ]
  };

  const PHASES = [PHASE0, window.ML_PHASE1, window.ML_PHASE2, window.ML_PHASE3, window.ML_SCIENCE];

  /* Плоский индекс: id -> { topic, block, phase, order } */
  const INDEX = {};
  const ORDER = [];
  PHASES.forEach(function (phase) {
    phase.blocks.forEach(function (block) {
      block.topics.forEach(function (topic) {
        INDEX[topic.id] = { topic: topic, block: block, phase: phase, order: ORDER.length };
        ORDER.push(topic.id);
      });
    });
  });

  function getTopic(id) { return INDEX[id] || null; }

  function phaseTopics(phase) {
    return phase.blocks.reduce(function (acc, b) { return acc.concat(b.topics); }, []);
  }

  function topicMinutes(topic) {
    return (topic.theoryMinutes || 0) + (topic.practiceMinutes || 0);
  }

  function nextTopicId(id) {
    const i = ORDER.indexOf(id);
    return i >= 0 && i + 1 < ORDER.length ? ORDER[i + 1] : null;
  }

  function prevTopicId(id) {
    const i = ORDER.indexOf(id);
    return i > 0 ? ORDER[i - 1] : null;
  }

  window.CURRICULUM = {
    phases: PHASES,
    index: INDEX,
    order: ORDER,
    papers: window.ML_PAPERS,
    firstWeek: window.ML_FIRST_WEEK,
    timeline: window.ML_TIMELINE,
    rules: window.ML_RULES,
    getTopic: getTopic,
    phaseTopics: phaseTopics,
    topicMinutes: topicMinutes,
    nextTopicId: nextTopicId,
    prevTopicId: prevTopicId,
    totalTopics: ORDER.length
  };
})();
