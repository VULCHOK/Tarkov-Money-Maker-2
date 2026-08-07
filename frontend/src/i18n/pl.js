/**
 * i18n — Polski (pl) ✅ COMPLETE
 *
 * STATUS (2026-08-07)
 * [x] en  — complete (reference)
 * [x] fr  — complete
 * [x] de  — complete
 * [x] ru  — complete
 * [x] pl  — complete
 * [x] es  — complete
 */

const pl = {
  // App / modes
  appTitle:        'Tarkov Money Maker 2',
  modeBadgePvp:    'Stały',
  modeBadgePve:    'Kooperacja',
  modeBadgeSeason: 'Sezon 1',
  loading:         'Ładowanie',

  // Filters — Search
  filterSearchLabel:       'Szukaj',
  filterSearchPlaceholder: 'Nazwa przedmiotu, Enter lub kliknij…',
  filterSearchAddTerm:     'Dodaj kolejny termin…',
  filterSearchAdd:         'dodaj',

  // Filters — Profit
  filterProfitLabel: 'Min. zysk',

  // Filters — Player level
  filterLevelLabel: 'Poziom gracza',

  // Filters — Min offers
  filterOffersLabel:    'Min. ofert',
  filterOffersDisabled: 'API nie dostarcza liczby ofert dla tego trybu. Filtr wyłączony.',

  // Filters — Trader tooltip
  traderEnable:  'włącz',
  traderDisable: 'wyłącz',

  // Filters — Intel Center
  intelNotBuilt: 'Nie zbudowano',
  intelLevel1:   'Poziom 1',
  intelLevel2:   'Poziom 2',
  intelLevel3:   '-30% podatek pchli targ',

  // ItemTable — columns
  colItem:       'Przedmiot',
  colBuyTrader:  'Kup (Handlarz)',
  colSellTrader: 'Sprzedaj (Handlarz)',
  colAction:     'Akcja',
  colBestProfit: '★ Najlepszy zysk',
  colTraderFlea: 'Handlarz→Pchli targ',
  colFleaTrader: 'Pchli targ→Handlarz',
  colFlea:       'Pchli targ',

  // ItemTable — tooltips
  tooltipBuyPrices:  'Ceny zakupu u handlarzy (twój poziom)',
  tooltipSellPrices: 'Ceny odkupu handlarzy',

  // ItemTable — flea tooltip
  flea24h:    'Pchli targ — 24h',
  fleaCur:    'Aktualna',
  fleaLow:    'Min. 24h',
  fleaAvg:    'Śr. 24h',
  fleaHigh:   'Maks. 24h',
  fleaOffers: 'Oferty',

  // ItemTable — recommendations
  recFTS: 'Kup na pchli targ → Sprzedaj handlarzowi',
  recBTF: 'Kup u handlarza → Sprzedaj na pchli targ',

  // ItemTable — mobile card
  cardBuy:    'Kup',
  cardSell:   'Sprzedaj',
  cardOffers: 'ofert',

  // ItemTable — pagination
  paginationOf:      'z',
  paginationPerPage: 'Na stronie:',
  paginationPage:    'Strona',
  paginationTapSort: 'Dotknij aby posortować',

  // ItemTable — empty state
  noItems: 'Nie znaleziono opłacalnych przedmiotów. Obniż próg zysku lub włącz więcej handlarzy.',

  // ApiStatus
  apiStatusTitle:        'Status synchronizacji',
  apiStatusOnline:       'tarkov.dev Online',
  apiStatusDegraded:     'tarkov.dev Ograniczony',
  apiStatusOffline:      'tarkov.dev Offline',
  apiStatusChecking:     'Sprawdzanie…',
  apiStatusGlobal:       'Status globalny',
  apiStatusLastSync:     'Ostatnia sync',
  apiStatusItems:        'Zsynchronizowane przedmioty',
  apiStatusItemsSub:     'łącznie skumulowane',
  apiStatusSource:       'Źródło API',
  apiStatusSourceSub:    'auto-sprawdzanie co 30s',
  apiStatusCheckedAt:    'Sprawdzono',
  apiStatusModeStatus:   'Status',
  apiStatusModeItems:    'Przedmioty',
  apiStatusModeLastSync: 'Ostatnia sync',
  apiStatusModeDuration: 'Czas trwania',
  apiStatusNever:        'nigdy',
  apiStatusJustNow:      'przed chwilą',
  apiStatusMinutesAgo:   'min temu',
  apiStatusHoursAgo:     'godz. temu',
  apiStatusRest:         'REST',

  // ExportButtons
  exportCSV:  'Eksportuj jako CSV',
  exportJSON: 'Eksportuj jako JSON',
};

export default pl;
