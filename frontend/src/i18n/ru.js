/**
 * i18n — Русский (ru) ✅ COMPLETE
 *
 * STATUS (2026-08-07)
 * [x] en  — complete (reference)
 * [x] fr  — complete
 * [x] de  — complete
 * [x] ru  — complete
 * [x] pl  — complete
 * [x] es  — complete
 */

const ru = {
  // App / modes
  appTitle:        'Tarkov Money Maker 2',
  modeBadgePvp:    'Постоянный',
  modeBadgePve:    'Кооп',
  modeBadgeSeason: 'Сезон 1',
  loading:         'Загрузка',

  // Filters — Search
  filterSearchLabel:       'Поиск',
  filterSearchPlaceholder: 'Название предмета, Enter или клик…',
  filterSearchAddTerm:     'Добавить ещё термин…',
  filterSearchAdd:         'добавить',

  // Filters — Profit
  filterProfitLabel: 'Мин. прибыль',

  // Filters — Player level
  filterLevelLabel: 'Уровень игрока',

  // Filters — Min offers
  filterOffersLabel:    'Мин. предложений',
  filterOffersDisabled: 'API не предоставляет кол-во предложений для этого режима. Фильтр отключён.',

  // Filters — Trader tooltip
  traderEnable:  'включить',
  traderDisable: 'отключить',

  // Filters — Intel Center
  intelNotBuilt: 'Не построен',
  intelLevel1:   'Уровень 1',
  intelLevel2:   'Уровень 2',
  intelLevel3:   '-30% налог барахолки',

  // ItemTable — columns
  colItem:       'Предмет',
  colBuyTrader:  'Купить (Торговец)',
  colSellTrader: 'Продать (Торговец)',
  colAction:     'Действие',
  colBestProfit: '★ Лучшая прибыль',
  colTraderFlea: 'Торговец→Барахолка',
  colFleaTrader: 'Барахолка→Торговец',
  colFlea:       'Барахолка',

  // ItemTable — tooltips
  tooltipBuyPrices:  'Цены покупки у торговцев (ваш уровень)',
  tooltipSellPrices: 'Цены выкупа торговцами',

  // ItemTable — flea tooltip
  flea24h:    'Барахолка — 24ч',
  fleaCur:    'Текущая',
  fleaLow:    'Мин. 24ч',
  fleaAvg:    'Средн. 24ч',
  fleaHigh:   'Макс. 24ч',
  fleaOffers: 'Предложения',

  // ItemTable — recommendations
  recFTS: 'Купить на барахолке → Продать торговцу',
  recBTF: 'Купить у торговца → Продать на барахолке',

  // ItemTable — mobile card
  cardBuy:    'Купить',
  cardSell:   'Продать',
  cardOffers: 'предл.',

  // ItemTable — pagination
  paginationOf:      'из',
  paginationPerPage: 'На странице:',
  paginationPage:    'Страница',
  paginationTapSort: 'Нажмите для сортировки',

  // ItemTable — empty state
  noItems: 'Выгодных предметов не найдено. Снизьте порог прибыли или включите больше торговцев.',

  // ApiStatus
  apiStatusTitle:        'Статус синхронизации',
  apiStatusOnline:       'tarkov.dev Онлайн',
  apiStatusDegraded:     'tarkov.dev Ограничен',
  apiStatusOffline:      'tarkov.dev Офлайн',
  apiStatusChecking:     'Проверка…',
  apiStatusGlobal:       'Общий статус',
  apiStatusLastSync:     'Последняя синхр.',
  apiStatusItems:        'Синхронизировано предметов',
  apiStatusItemsSub:     'всего накопленно',
  apiStatusSource:       'Источник API',
  apiStatusSourceSub:    'авто-проверка каждые 30с',
  apiStatusCheckedAt:    'Проверено',
  apiStatusModeStatus:   'Статус',
  apiStatusModeItems:    'Предметы',
  apiStatusModeLastSync: 'Последняя синхр.',
  apiStatusModeDuration: 'Длительность',
  apiStatusNever:        'никогда',
  apiStatusJustNow:      'только что',
  apiStatusMinutesAgo:   'мин. назад',
  apiStatusHoursAgo:     'ч. назад',
  apiStatusRest:         'REST',

  // ExportButtons
  exportCSV:  'Экспорт в CSV',
  exportJSON: 'Экспорт в JSON',
};

export default ru;
