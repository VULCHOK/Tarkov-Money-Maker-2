/**
 * i18n — Español (es) ✅ COMPLETE
 *
 * STATUS (2026-08-07)
 * [x] en  — complete (reference)
 * [x] fr  — complete
 * [x] de  — complete
 * [x] ru  — complete
 * [x] pl  — complete
 * [x] es  — complete
 */

const es = {
  // App / modes
  appTitle:        'Tarkov Money Maker 2',
  modeBadgePvp:    'Permanente',
  modeBadgePve:    'Cooperativo',
  modeBadgeSeason: 'Temporada 1',
  loading:         'Cargando',

  // Filters — Search
  filterSearchLabel:       'Buscar',
  filterSearchPlaceholder: 'Nombre del objeto, Enter o clic…',
  filterSearchAddTerm:     'Añadir otro término…',
  filterSearchAdd:         'añadir',

  // Filters — Profit
  filterProfitLabel: 'Beneficio mín.',

  // Filters — Player level
  filterLevelLabel: 'Nivel del jugador',

  // Filters — Min offers
  filterOffersLabel:    'Ofertas mín.',
  filterOffersDisabled: 'La API no proporciona el número de ofertas para este modo. Filtro desactivado.',

  // Filters — Trader tooltip
  traderEnable:  'activar',
  traderDisable: 'desactivar',

  // Filters — Intel Center
  intelNotBuilt: 'No construido',
  intelLevel1:   'Nivel 1',
  intelLevel2:   'Nivel 2',
  intelLevel3:   '-30% impuesto mercadillo',

  // ItemTable — columns
  colItem:       'Objeto',
  colBuyTrader:  'Comprar (Comerciante)',
  colSellTrader: 'Vender (Comerciante)',
  colAction:     'Acción',
  colBestProfit: '★ Mejor beneficio',
  colTraderFlea: 'Comerciante→Mercadillo',
  colFleaTrader: 'Mercadillo→Comerciante',
  colFlea:       'Mercadillo',

  // ItemTable — tooltips
  tooltipBuyPrices:  'Precios de compra por comerciante (tu nivel)',
  tooltipSellPrices: 'Precios de recompra de comerciantes',

  // ItemTable — flea tooltip
  flea24h:    'Mercadillo — 24h',
  fleaCur:    'Actual',
  fleaLow:    'Mín. 24h',
  fleaAvg:    'Med. 24h',
  fleaHigh:   'Máx. 24h',
  fleaOffers: 'Ofertas',

  // ItemTable — recommendations
  recFTS: 'Comprar mercadillo → Vender comerciante',
  recBTF: 'Comprar comerciante → Vender mercadillo',

  // ItemTable — mobile card
  cardBuy:    'Comprar',
  cardSell:   'Vender',
  cardOffers: 'ofertas',

  // ItemTable — pagination
  paginationOf:      'de',
  paginationPerPage: 'Por página:',
  paginationPage:    'Página',
  paginationTapSort: 'Toca para ordenar',

  // ItemTable — empty state
  noItems: 'No se encontraron objetos rentables. Baja el umbral de beneficio o activa más comerciantes.',

  // ApiStatus
  apiStatusTitle:        'Estado de sincronización',
  apiStatusOnline:       'tarkov.dev Online',
  apiStatusDegraded:     'tarkov.dev Degradado',
  apiStatusOffline:      'tarkov.dev Offline',
  apiStatusChecking:     'Comprobando…',
  apiStatusGlobal:       'Estado global',
  apiStatusLastSync:     'Última sync',
  apiStatusItems:        'Objetos sincronizados',
  apiStatusItemsSub:     'total acumulado',
  apiStatusSource:       'Fuente API',
  apiStatusSourceSub:    'comprobación auto cada 30s',
  apiStatusCheckedAt:    'Comprobado',
  apiStatusModeStatus:   'Estado',
  apiStatusModeItems:    'Objetos',
  apiStatusModeLastSync: 'Última sync',
  apiStatusModeDuration: 'Duración',
  apiStatusNever:        'nunca',
  apiStatusJustNow:      'ahora mismo',
  apiStatusMinutesAgo:   'min atrás',
  apiStatusHoursAgo:     'h atrás',
  apiStatusRest:         'REST',

  // ExportButtons
  exportCSV:  'Exportar como CSV',
  exportJSON: 'Exportar como JSON',
};

export default es;
