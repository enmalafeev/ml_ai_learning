/* Фазы 1–3, параллельный научный трек, обязательные статьи, первая неделя.
   Каркас: структура, сроки и ресурсы заведены; чек-листы краткие, тесты не наполнены.
   Наполнять по мере подхода к фазе — см. README, раздел «Как добавить тему». */
(function () {
  'use strict';

  const R = {
    ymlBook: { title: 'Учебник по машинному обучению от Яндекса (ШАД)', url: 'https://education.yandex.ru/handbook/ml', source: 'education.yandex.ru', note: 'Главный материал Фазы 1 по плану. Идти подряд.' },
    islr: { title: 'An Introduction to Statistical Learning (ISLR)', url: 'https://www.statlearning.com/', source: 'statlearning.com', note: 'Бесплатный PDF. По плану — главы 2–9.' },
    esl: { title: 'The Elements of Statistical Learning (ESL)', url: 'https://hastie.su.domains/ElemStatLearn/', source: 'hastie.su.domains', note: 'Справочник для углублений, не читать подряд.' },
    geron: { title: 'Орельен Жерон, «Прикладное машинное обучение с Scikit-Learn, Keras и TensorFlow»', source: 'книга', note: 'По плану — часть I полностью. Эталонный практический workflow.' },
    bishopPRML: { title: 'К. Бишоп, «Pattern Recognition and Machine Learning»', source: 'книга', note: 'Пока — точечно, по конкретным темам.' },
    sklearn: { title: 'scikit-learn: User Guide', url: 'https://scikit-learn.org/stable/user_guide.html', source: 'scikit-learn.org' },
    voroncov: { title: 'Курс К. В. Воронцова «Машинное обучение»', url: 'http://www.machinelearning.ru/', source: 'machinelearning.ru', note: 'Более математичный взгляд. По плану — полезен именно под кандидатский экзамен. Лекции есть на YouTube.' },
    ngML: { title: 'Machine Learning Specialization, Andrew Ng', url: 'https://www.coursera.org/specializations/machine-learning-introduction', source: 'coursera.org', note: 'Параллельно, для интуиции. Смотреть на 1.5x, задания делать.' },
    kaggle: { title: 'Kaggle: соревнования', url: 'https://www.kaggle.com/competitions', source: 'kaggle.com' },
    d2l: { title: 'Dive into Deep Learning (d2l.ai)', url: 'https://d2l.ai/', source: 'd2l.ai', note: 'Основной текстовый материал Фазы 2, код на PyTorch.' },
    karpathy: { title: 'Andrej Karpathy, Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html', source: 'karpathy.ai', note: 'По плану — проходить первым в Фазе 2. Самый эффективный формат для программиста.' },
    dls: { title: 'Deep Learning School (МФТИ, ФПМИ)', source: 'бесплатный курс на русском', note: 'Два семестра: CV и NLP. Актуальную ссылку найди сам — адреса площадки менялись.' },
    pytorch: { title: 'PyTorch: официальные туториалы', url: 'https://pytorch.org/tutorials/', source: 'pytorch.org', note: 'По плану — изучать PyTorch, не TensorFlow.' },
    hf: { title: 'Hugging Face: курсы и документация', url: 'https://huggingface.co/learn', source: 'huggingface.co' },
    cs231n: { title: 'CS231n: Deep Learning for Computer Vision (Stanford)', url: 'https://cs231n.stanford.edu/', source: 'cs231n.stanford.edu', note: 'Университетский уровень, брать после DLS.' },
    cs224n: { title: 'CS224n: NLP with Deep Learning (Stanford)', url: 'https://web.stanford.edu/class/cs224n/', source: 'stanford.edu' },
    goodfellow: { title: 'Гудфеллоу, Бенджио, Курвилль, «Глубокое обучение»', url: 'https://www.deeplearningbook.org/', source: 'deeplearningbook.org', note: 'Канонический учебник, есть русский перевод. Читать как теоретическую опору, не подряд.' },
    murphy: { title: 'Кевин Мёрфи, Probabilistic Machine Learning', url: 'https://probml.github.io/pml-book/', source: 'probml.github.io', note: 'Два тома, бесплатные PDF. Самый полный современный справочник.' },
    jurafsky: { title: 'Jurafsky & Martin, Speech and Language Processing (3-е изд.)', url: 'https://web.stanford.edu/~jurafsky/slp3/', source: 'stanford.edu', note: 'Черновик доступен бесплатно.' },
    sutton: { title: 'Sutton & Barto, Reinforcement Learning: An Introduction', url: 'http://incompleteideas.net/book/the-book.html', source: 'incompleteideas.net', note: 'Бесплатный PDF.' },
    spinningUp: { title: 'Spinning Up in Deep RL (OpenAI)', url: 'https://spinningup.openai.com/', source: 'openai.com' },
    wandb: { title: 'Weights & Biases: трекинг экспериментов', url: 'https://wandb.ai/', source: 'wandb.ai' },
    colab: { title: 'Google Colab (бесплатные GPU)', url: 'https://colab.research.google.com/', source: 'colab.research.google.com' }
  };

  /* Компактный конструктор темы-заглушки. */
  function stub(id, title, summary, opts) {
    opts = opts || {};
    return {
      id: id,
      title: title,
      summary: summary,
      stub: true,
      theoryMinutes: opts.theory || 120,
      practiceMinutes: opts.practice || 120,
      resources: opts.resources || [],
      checklist: opts.checklist || [],
      practice: opts.task ? { title: opts.task, description: opts.taskDesc || '', steps: opts.steps || [], acceptance: opts.acceptance || [] } : null,
      quiz: []
    };
  }

  const PHASE1 = {
    id: 'phase-1',
    title: 'Фаза 1. Классическое машинное обучение',
    period: 'Середина октября 2026 — февраль 2027',
    hours: '~170 часов, ~4 месяца',
    plannedHours: 170,
    goal: 'Самая важная фаза. Классика — фундамент, на котором держатся и экзамен, и понимание нейросетей.',
    checkpoint: 'Тебе дают незнакомый табличный датасет и бизнес-задачу — ты за вечер строишь адекватный baseline, корректно валидируешь и объясняешь, почему выбрал именно эту модель и метрику.',
    blocks: [
      {
        id: 'p1-b-basics',
        title: 'Постановка задачи и оценка качества',
        hint: 'Выбор метрики и схемы валидации — это половина задачи. Ошибка здесь обесценивает любую модель.',
        topics: [
          stub('p1-setup', 'Постановка задач обучения с учителем и без', 'Типы задач, что такое обобщающая способность.', { resources: [R.ymlBook, R.islr, R.ngML], theory: 120, practice: 90 }),
          stub('p1-linreg', 'Линейная регрессия: полная теория', 'Возврат к теме Фазы 0, но уже со статистической стороны.', { resources: [R.ymlBook, R.islr, R.voroncov], theory: 150, practice: 150, task: 'Реализовать линейную регрессию на NumPy (перенести из Фазы 0 и расширить)' }),
          stub('p1-logreg', 'Логистическая регрессия', 'Классификация через вероятностную модель, log loss.', { resources: [R.ymlBook, R.islr], theory: 150, practice: 180, task: 'Реализовать логистическую регрессию с нуля на NumPy' }),
          stub('p1-regularization', 'Регуляризация L1/L2 и bias-variance tradeoff', 'Центральное понятие всей фазы и частый вопрос на экзамене.', { resources: [R.ymlBook, R.islr, R.esl], theory: 150, practice: 120 }),
          stub('p1-metrics', 'Метрики: accuracy, precision/recall, F1, ROC-AUC, MSE/MAE', 'Почему выбор метрики — половина задачи.', { resources: [R.ymlBook, R.sklearn], theory: 150, practice: 120 }),
          stub('p1-validation', 'Кросс-валидация и утечки данных', 'Утечка — самая дорогая ошибка в ML: её не видно, пока не станет поздно.', { resources: [R.ymlBook, R.sklearn, R.islr], theory: 120, practice: 120 })
        ]
      },
      {
        id: 'p1-b-models',
        title: 'Модели',
        hint: 'Градиентный бустинг обязателен: он до сих пор побеждает нейросети на табличных данных.',
        topics: [
          stub('p1-trees', 'Решающие деревья', 'Критерии разбиения, переобучение, обрезка.', { resources: [R.ymlBook, R.islr], theory: 120, practice: 150, task: 'Реализовать решающее дерево с нуля на NumPy' }),
          stub('p1-ensembles', 'Бэггинг и случайный лес', 'Почему усреднение независимых ошибок работает.', { resources: [R.ymlBook, R.islr, R.esl], theory: 120, practice: 120 }),
          stub('p1-boosting', 'Градиентный бустинг: XGBoost, LightGBM, CatBoost', 'Обязательная тема. Рабочая лошадь табличного ML.', { resources: [R.ymlBook, R.esl, { title: 'XGBoost docs', url: 'https://xgboost.readthedocs.io/', source: 'xgboost.readthedocs.io' }, { title: 'CatBoost docs', url: 'https://catboost.ai/docs/', source: 'catboost.ai' }], theory: 180, practice: 240 }),
          stub('p1-svm', 'SVM и ядровой трюк', 'Максимальный зазор, переход в спрямляющее пространство.', { resources: [R.ymlBook, R.islr, R.bishopPRML], theory: 150, practice: 120 }),
          stub('p1-knn', 'kNN и метрические методы', 'Проклятие размерности во всей красе.', { resources: [R.ymlBook, R.islr], theory: 90, practice: 90, task: 'Реализовать kNN с нуля на NumPy' }),
          stub('p1-bayes', 'Байесовский подход и наивный байес', 'Продолжение темы Байеса из Фазы 0.', { resources: [R.ymlBook, R.bishopPRML], theory: 120, practice: 90 })
        ]
      },
      {
        id: 'p1-b-unsup',
        title: 'Обучение без учителя и признаки',
        hint: '',
        topics: [
          stub('p1-clustering', 'Кластеризация: k-means, DBSCAN, иерархическая', 'Как оценивать качество там, где нет разметки.', { resources: [R.ymlBook, R.islr, R.sklearn], theory: 120, practice: 150, task: 'Реализовать k-means с нуля на NumPy' }),
          stub('p1-dimred', 'Снижение размерности: PCA, t-SNE, UMAP', 'PCA продолжает тему собственных векторов из Фазы 0.', { resources: [R.ymlBook, R.islr, { title: 'How to Use t-SNE Effectively (Distill)', url: 'https://distill.pub/2016/misread-tsne/', source: 'distill.pub' }], theory: 120, practice: 120 }),
          stub('p1-features', 'Feature engineering', 'Часто даёт больше прироста, чем смена модели.', { resources: [R.geron, R.ymlBook], theory: 120, practice: 180 })
        ]
      },
      {
        id: 'p1-b-practice',
        title: 'Практика фазы',
        hint: 'Три обязательных пункта практики прямо из плана.',
        topics: [
          stub('p1-scratch', 'Реализации с нуля на NumPy: сводный проект', 'Линейная и логистическая регрессия, k-means, дерево, kNN — без библиотек.', { theory: 30, practice: 600, task: 'Собрать все реализации в один модуль с общим интерфейсом fit/predict', acceptance: ['Каждая модель сравнена с эталоном из sklearn', 'Общий интерфейс, единый стиль кода', 'Есть тесты'] }),
          stub('p1-kaggle-start', 'Kaggle: 2–3 соревнования Getting Started', 'Не ради медали, а ради полного цикла.', { resources: [R.kaggle], theory: 30, practice: 480 }),
          stub('p1-kaggle-active', 'Kaggle: одно активное соревнование', 'Данные → признаки → валидация → модель → анализ ошибок.', { resources: [R.kaggle], theory: 30, practice: 720 })
        ]
      }
    ]
  };

  const PHASE2 = {
    id: 'phase-2',
    title: 'Фаза 2. Глубокое обучение',
    period: 'Март — август 2027',
    hours: '~250 часов, ~6 месяцев',
    plannedHours: 250,
    goal: 'От перцептрона до трансформера. Механизм внимания — центральная тема, разобрать до последней матрицы.',
    checkpoint: 'Трансформер, реализованный по оригинальной статье. Это обряд посвящения — после него всё остальное читается легко.',
    blocks: [
      {
        id: 'p2-b-base',
        title: 'Основы нейросетей',
        hint: 'По плану: Karpathy Zero to Hero проходить первым.',
        topics: [
          stub('p2-karpathy', 'Karpathy, Neural Networks: Zero to Hero', 'Строим бэкпроп, языковую модель и GPT с нуля построчно.', { resources: [R.karpathy], theory: 300, practice: 600 }),
          stub('p2-backprop', 'Перцептрон, обратное распространение, функции активации', 'Прямое продолжение цепного правила из Фазы 0.', { resources: [R.d2l, R.goodfellow, R.dls], theory: 180, practice: 180 }),
          stub('p2-training', 'Инициализация, нормализация (BatchNorm, LayerNorm), dropout', 'Приёмы, без которых глубокие сети не обучаются.', { resources: [R.d2l, R.goodfellow], theory: 180, practice: 180 }),
          stub('p2-optimizers', 'Оптимизаторы: SGD с моментом, RMSProp, Adam, расписания LR', 'Продолжение темы градиентного спуска из Фазы 0.', { resources: [R.d2l, { title: 'Adam (Kingma, Ba, 2014)', url: 'https://arxiv.org/abs/1412.6980', source: 'arxiv.org' }], theory: 150, practice: 150 }),
          stub('p2-pytorch', 'PyTorch: тензоры, autograd, training loop с нуля', 'Практика №1 из плана: без готовых обёрток.', { resources: [R.pytorch, R.d2l, R.colab], theory: 180, practice: 300, task: 'Написать полноценный training loop на PyTorch с нуля' })
        ]
      },
      {
        id: 'p2-b-cv',
        title: 'Компьютерное зрение',
        hint: '',
        topics: [
          stub('p2-cnn', 'Свёрточные сети: свёртка, пулинг, от LeNet до ResNet', 'Архитектурная линия, которую нужно знать целиком.', { resources: [R.d2l, R.cs231n, R.dls, { title: 'ResNet (He et al., 2015)', url: 'https://arxiv.org/abs/1512.03385', source: 'arxiv.org' }], theory: 240, practice: 300 }),
          stub('p2-transfer', 'Аугментации, transfer learning, fine-tuning', 'Практика №3 из плана: прямая репетиция экспериментов диссертации.', { resources: [R.d2l, R.hf], theory: 150, practice: 300, task: 'Fine-tuning предобученной модели под свою задачу' })
        ]
      },
      {
        id: 'p2-b-nlp',
        title: 'Последовательности и трансформеры',
        hint: 'Центральный блок Фазы 2.',
        topics: [
          stub('p2-rnn', 'Рекуррентные сети, LSTM/GRU и их ограничения', 'Понять ограничения, из которых вырос трансформер.', { resources: [R.d2l, R.cs224n], theory: 180, practice: 180 }),
          stub('p2-attention', 'Механизм внимания и трансформер', 'Разобрать до последней матрицы. Практика №2 из плана.', { resources: [{ title: 'Attention Is All You Need (Vaswani et al., 2017)', url: 'https://arxiv.org/abs/1706.03762', source: 'arxiv.org', note: 'Самая важная статья десятилетия.' }, { title: 'The Illustrated Transformer (Jay Alammar)', url: 'https://jalammar.github.io/illustrated-transformer/', source: 'jalammar.github.io' }, R.d2l, R.cs224n], theory: 300, practice: 600, task: 'Реализовать трансформер по оригинальной статье', acceptance: ['Реализация обучается на игрушечной задаче', 'Можешь объяснить назначение каждой матрицы Q, K, V', 'Многоголовое внимание реализовано, а не скопировано'] }),
          stub('p2-embeddings', 'Эмбеддинги: word2vec → BERT → современные', 'Как текст становится вектором.', { resources: [R.cs224n, R.hf, { title: 'BERT (Devlin et al., 2018)', url: 'https://arxiv.org/abs/1810.04805', source: 'arxiv.org' }], theory: 180, practice: 180 })
        ]
      },
      {
        id: 'p2-b-gen',
        title: 'Генеративные модели и RL',
        hint: '',
        topics: [
          stub('p2-generative', 'Автоэнкодеры, VAE, GAN, диффузионные модели', 'Четыре разных ответа на вопрос, как порождать данные.', { resources: [R.d2l, { title: 'GAN (Goodfellow et al., 2014)', url: 'https://arxiv.org/abs/1406.2661', source: 'arxiv.org' }, { title: 'VAE (Kingma, Welling, 2013)', url: 'https://arxiv.org/abs/1312.6114', source: 'arxiv.org' }, { title: 'DDPM (Ho et al., 2020)', url: 'https://arxiv.org/abs/2006.11239', source: 'arxiv.org' }], theory: 300, practice: 300 }),
          stub('p2-rl', 'Основы обучения с подкреплением', 'Обзорно, если тема не уходит в RL.', { resources: [R.sutton, R.spinningUp], theory: 180, practice: 120 }),
          stub('p2-tooling', 'Инструменты: Hugging Face, W&B, GPU', 'Инфраструктура экспериментов на годы вперёд.', { resources: [R.hf, R.wandb, R.colab], theory: 90, practice: 120 })
        ]
      }
    ]
  };

  const PHASE3 = {
    id: 'phase-3',
    title: 'Фаза 3. Специализация и научная работа',
    period: 'С сентября 2027 и до защиты',
    hours: 'Открытый горизонт',
    goal: 'Фундамент есть. Дальше углубляешься только туда, где твоя тема. Выбери одно направление и копай.',
    checkpoint: '2–3 публикации, сданный кандидатский экзамен по специальности.',
    blocks: [
      {
        id: 'p3-b-spec',
        title: 'Направления на выбор (выбрать одно)',
        hint: 'Козырь из плана: темы на стыке ML и веб-разработки — генерация и тестирование интерфейсов, модели кода, автоматизация разработки, анализ пользовательского поведения.',
        topics: [
          stub('p3-nlp', 'NLP и языковые модели', 'Наиболее вероятное направление при твоём фронтенд-бэкграунде.', { resources: [R.jurafsky, R.hf, R.cs224n], theory: 600, practice: 1200 }),
          stub('p3-cv', 'Компьютерное зрение', 'CS231n целиком, свежие работы по детекции и сегментации.', { resources: [R.cs231n], theory: 600, practice: 1200 }),
          stub('p3-rl', 'Обучение с подкреплением', 'Sutton & Barto плюс Spinning Up.', { resources: [R.sutton, R.spinningUp], theory: 600, practice: 1200 }),
          stub('p3-other', 'Графовые сети, рекомендательные системы, интерпретируемость, эффективность', 'Если тема уйдёт туда.', { theory: 600, practice: 1200 })
        ]
      }
    ]
  };

  const SCIENCE = {
    id: 'phase-science',
    title: 'Параллельный трек: научная работа',
    period: 'Запускается с ноября 2026, не после обучения',
    hours: 'Постоянно, 2–3 часа в неделю',
    goal: 'Здесь проваливается большинство аспирантов: два года учатся, потом в панике пишут диссертацию. Этот трек не ждёт окончания фаз.',
    checkpoint: 'Тема согласована с научруком, есть обзор литературы и первая публикация.',
    blocks: [
      {
        id: 'sci-b-start',
        title: 'Месяцы 1–3 (сентябрь — ноябрь 2026)',
        hint: 'Идёт параллельно Фазе 0 и началу Фазы 1.',
        topics: [
          stub('sci-passport', 'Паспорт специальности 1.2.1', 'Официальная карта областей исследований: из неё берутся вопросы экзамена и в неё должна попадать тема.', { resources: [{ title: 'ВАК при Минобрнауки России', url: 'https://vak.minobrnauki.gov.ru/', source: 'vak.minobrnauki.gov.ru', note: 'Скачать паспорт 1.2.1 в первую же неделю.' }], theory: 90, practice: 60, task: 'Отметить 3–4 области исследований, которые интересны и достижимы' }),
          stub('sci-supervisor', 'Первая встреча с научным руководителем', 'Прийти не с пустыми руками, а с 2–3 черновыми идеями на стыке ML и веб-разработки.', { theory: 60, practice: 180, task: 'Подготовить 2–3 черновые идеи темы и обсудить их' }),
          stub('sci-reading', 'Как читать научные статьи', 'Метод трёх проходов Кешава экономит месяцы.', { resources: [{ title: 'S. Keshav, How to Read a Paper', url: 'https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf', source: 'stanford.edu', note: 'Три страницы. Прочитать до того, как возьмёшься за первую статью.' }], theory: 45, practice: 120 }),
          stub('sci-infra', 'Инфраструктура: Zotero, Overleaf, arXiv, Papers with Code', 'Настроить один раз на все три года.', { resources: [{ title: 'Zotero', url: 'https://www.zotero.org/', source: 'zotero.org' }, { title: 'Overleaf', url: 'https://www.overleaf.com/', source: 'overleaf.com' }, { title: 'arXiv', url: 'https://arxiv.org/', source: 'arxiv.org' }, { title: 'Papers with Code', url: 'https://paperswithcode.com/', source: 'paperswithcode.com' }, { title: 'Semantic Scholar', url: 'https://www.semanticscholar.org/', source: 'semanticscholar.org' }, { title: 'eLIBRARY.ru', url: 'https://elibrary.ru/', source: 'elibrary.ru' }], theory: 60, practice: 120 })
        ]
      },
      {
        id: 'sci-b-mid',
        title: 'Месяцы 4–9',
        hint: '2–3 статьи в неделю, минимум одна разбирается детально.',
        topics: [
          stub('sci-habit', 'Привычка чтения: 2–3 статьи в неделю', 'Отдельный навык, тренируется только временем. С 3-го месяца — даже если понимаешь 30%.', { theory: 0, practice: 180 }),
          stub('sci-review', 'Обзор литературы по теме', 'Он же — первая глава диссертации.', { theory: 120, practice: 900 }),
          stub('sci-first-pub', 'Первая публикация: обзорная статья или доклад', 'Не жди «настоящих результатов»: первая публикация почти всегда обзорная.', { theory: 120, practice: 900 })
        ]
      },
      {
        id: 'sci-b-y2',
        title: 'Год 2 и далее',
        hint: '',
        topics: [
          stub('sci-experiments', 'Основные эксперименты и 2–3 публикации', 'Минимум одна в ВАК или Scopus.', { theory: 0, practice: 1800 }),
          stub('sci-exam', 'Кандидатский экзамен по специальности 1.2.1', 'Составляется на основе паспорта специальности.', { theory: 900, practice: 300 }),
          stub('sci-venues', 'Площадки: AI Journey, «Диалог», журналы перечня ВАК группы 1.2', 'Куда целиться с публикациями.', { theory: 90, practice: 60 }),
          stub('sci-thesis', 'Год 3: сведение результатов, текст, предзащита', '', { theory: 0, practice: 1800 })
        ]
      }
    ]
  };

  /* Обязательные к прочтению статьи. Читать в этом порядке, начиная с Фазы 2. */
  const PAPERS = [
    { group: 'Фундамент', items: [
      { n: 1, title: 'Rumelhart, Hinton, Williams (1986) — обратное распространение ошибки', url: null },
      { n: 2, title: 'Krizhevsky et al. (2012) — AlexNet, начало эры глубокого обучения', url: null },
      { n: 3, title: 'Srivastava et al. (2014) — Dropout', url: 'https://jmlr.org/papers/v15/srivastava14a.html' },
      { n: 4, title: 'Ioffe, Szegedy (2015) — Batch Normalization', url: 'https://arxiv.org/abs/1502.03167' },
      { n: 5, title: 'Kingma, Ba (2014) — Adam', url: 'https://arxiv.org/abs/1412.6980' },
      { n: 6, title: 'He et al. (2015) — ResNet', url: 'https://arxiv.org/abs/1512.03385' }
    ]},
    { group: 'Современность', items: [
      { n: 7, title: 'Vaswani et al. (2017) — Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', key: true, note: 'Самая важная статья десятилетия. Разобрать построчно, в помощь — «The Illustrated Transformer».' },
      { n: 8, title: 'Devlin et al. (2018) — BERT', url: 'https://arxiv.org/abs/1810.04805' },
      { n: 9, title: 'Brown et al. (2020) — GPT-3, few-shot learning', url: 'https://arxiv.org/abs/2005.14165' },
      { n: 10, title: 'Dosovitskiy et al. (2020) — Vision Transformer', url: 'https://arxiv.org/abs/2010.11929' },
      { n: 11, title: 'Ho et al. (2020) — Denoising Diffusion Probabilistic Models', url: 'https://arxiv.org/abs/2006.11239' },
      { n: 12, title: 'Hoffmann et al. (2022) — Chinchilla, законы масштабирования', url: 'https://arxiv.org/abs/2203.15556' },
      { n: 13, title: 'Ouyang et al. (2022) — InstructGPT, RLHF', url: 'https://arxiv.org/abs/2203.02155' },
      { n: 14, title: 'Hu et al. (2021) — LoRA', url: 'https://arxiv.org/abs/2106.09685' }
    ]},
    { group: 'Генеративные модели', items: [
      { n: 15, title: 'Goodfellow et al. (2014) — GAN', url: 'https://arxiv.org/abs/1406.2661' },
      { n: 16, title: 'Kingma, Welling (2013) — VAE', url: 'https://arxiv.org/abs/1312.6114' }
    ]}
  ];

  const FIRST_WEEK = [
    { id: 'fw-1', text: 'Скачать паспорт научной специальности 1.2.1 с сайта ВАК, отметить 3–4 интересных и достижимых пункта', url: 'https://vak.minobrnauki.gov.ru/' },
    { id: 'fw-2', text: 'Уточнить программу кандидатского экзамена по специальности и требования к публикациям' },
    { id: 'fw-3', text: 'Договориться о первой встрече с научным руководителем' },
    { id: 'fw-4', text: 'Открыть хендбук Яндекса по математике и пройти первый раздел', url: 'https://education.yandex.ru/handbook/math' },
    { id: 'fw-5', text: 'Завести репозиторий и рабочий журнал: что изучено, что прочитано, какие идеи' }
  ];

  const TIMELINE = [
    { period: 'сен–окт 2026', focus: 'Python, NumPy, математика', checkpoint: 'Линейная регрессия с нуля на NumPy' },
    { period: 'ноя 2026 – фев 2027', focus: 'Классическое ML', checkpoint: 'Полный цикл на Kaggle, тема согласована с научруком' },
    { period: 'мар–авг 2027', focus: 'Глубокое обучение, PyTorch', checkpoint: 'Трансформер, реализованный по статье' },
    { period: 'сен 2027 – авг 2028', focus: 'Специализация, эксперименты', checkpoint: '2–3 публикации, кандидатский экзамен' },
    { period: 'сен 2028 – авг 2029', focus: 'Диссертация', checkpoint: 'Предзащита' }
  ];

  const RULES = [
    'Никакого «сначала выучу всю математику». Математика подтягивается под задачу, а не до задачи.',
    'Каждая тема закрывается кодом. Прочитал про градиентный спуск — реализовал на NumPy.',
    'С 3-го месяца читаешь научные статьи параллельно с обучением, даже если понимаешь 30%. Это отдельный навык, он тренируется только временем.'
  ];

  window.ML_PHASE1 = PHASE1;
  window.ML_PHASE2 = PHASE2;
  window.ML_PHASE3 = PHASE3;
  window.ML_SCIENCE = SCIENCE;
  window.ML_PAPERS = PAPERS;
  window.ML_FIRST_WEEK = FIRST_WEEK;
  window.ML_TIMELINE = TIMELINE;
  window.ML_RULES = RULES;
})();
