/**
 * i18n — Русский (ru) ✅ COMPLETE
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
  filterSearchPlaceholder: 'Название предмета, Enter или нажмите…',
  filterSearchAddTerm:     'Добавить ещё термин…',
  filterSearchAdd:         'добавить',

  // Filters — Profit
  filterProfitLabel: 'Мин. прибыль',

  // Filters — Player level
  filterLevelLabel: 'Уровень игрока',

  // Filters — Min offers
  filterOffersLabel:    'Мин. предложений',
  filterOffersDisabled: 'API не предоставляет количество предложений для этого режима. Фильтр отключён.',

  // Filters — Trader tooltip
  traderEnable:  'включить',
  traderDisable: 'отключить',

  // Filters — Intel Center
  intelNotBuilt: 'Не построен',
  intelLevel1:   'Уровень 1',
  intelLevel2:   'Уровень 2',
  intelLevel3:   '-30% налог на барахолке',

  // ItemTable — columns
  colItem:       'Предмет',
  colBuyTrader:  'Купить (торговец)',
  colSellTrader: 'Продать (торговец)',
  colAction:     'Действие',
  colBestProfit: '\u2605 Лучшая прибыль',
  colTraderFlea: 'Торговец\u2192Барахолка',
  colFleaTrader: 'Барахолка\u2192Торговец',
  colFlea:       'Барахолка',

  // ItemTable — tooltips
  tooltipBuyPrices:  'Цены покупки у торговцев (ваш уровень)',
  tooltipSellPrices: 'Цены выкупа у торговцев',

  // ItemTable — flea tooltip
  flea24h:    'Барахолка \u2014 24ч',
  fleaCur:    'Текущая',
  fleaLow:    'Мин. 24ч',
  fleaAvg:    'Средняя 24ч',
  fleaHigh:   'Макс. 24ч',
  fleaOffers: 'Предложений',

  // ItemTable — recommendations
  recFTS: 'Купить на барахолке \u2192 Продать торговцу',
  recBTF: 'Купить у торговца \u2192 Продать на барахолке',

  // ItemTable — mobile card
  cardBuy:    'Купить',
  cardSell:   'Продать',
  cardOffers: 'предл.',

  // ItemTable — pagination
  paginationOf:      'из',
  paginationPerPage: 'На странице:',
  paginationPage:    'Стр.',
  paginationTapSort: 'Нажмите для сортировки',

  // ItemTable — empty state
  noItems: 'Прибыльных предметов не найдено. Снизьте минимальную прибыль или включите больше торговцев.',

  // ApiStatus
  apiStatusTitle:        'Статус синхронизации',
  apiStatusOnline:       'tarkov.dev Онлайн',
  apiStatusDegraded:     'tarkov.dev Нестабилен',
  apiStatusOffline:      'tarkov.dev Офлайн',
  apiStatusChecking:     'Проверка…',
  apiStatusGlobal:       'Общий статус',
  apiStatusLastSync:     'Последний синхр.',
  apiStatusItems:        'Синхр. предметов',
  apiStatusItemsSub:     'всего накопленных',
  apiStatusSource:       'Источник API',
  apiStatusSourceSub:    'проверяется каждые 30с',
  apiStatusCheckedAt:    'Проверено',
  apiStatusModeStatus:   'Статус',
  apiStatusModeItems:    'Предметы',
  apiStatusModeLastSync: 'Последний синхр.',
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
