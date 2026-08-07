/**
 * i18n — English (en) ✅ COMPLETE
 * All UI strings are present and up to date.
 *
 * STATUS (2026-08-07)
 * [x] en  — complete (reference)
 * [x] fr  — complete
 * [ ] de  — TODO tomorrow
 * [ ] ru  — TODO tomorrow
 * [ ] pl  — TODO tomorrow
 * [ ] es  — TODO tomorrow
 *
 * HOW TO ADD A LANGUAGE
 * 1. Duplicate this file, rename to <code>.js  (e.g. de.js)
 * 2. Translate every value; never remove a key
 * 3. Export as default
 * 4. Register in hooks/useT.js : import de from '../i18n/de'; const LOCALES = { en, fr, de, ... }
 * 5. Add to LANGS array in App.js with flag SVG + label
 */

const en = {
  // App / modes
  appTitle:        'Tarkov Money Maker 2',
  modeBadgePvp:    'Permanent',
  modeBadgePve:    'Co-op',
  modeBadgeSeason: 'Season 1',
  loading:         'Loading',

  // Filters — Search
  filterSearchLabel:       'Search',
  filterSearchPlaceholder: 'Item name, Enter or click…',
  filterSearchAddTerm:     'Add another term…',
  filterSearchAdd:         'add',

  // Filters — Profit
  filterProfitLabel: 'Min. profit',

  // Filters — Player level
  filterLevelLabel: 'Player level',

  // Filters — Min offers
  filterOffersLabel:    'Min. offers',
  filterOffersDisabled: 'API does not provide offer count for this mode. Filter disabled.',

  // Filters — Trader tooltip
  traderEnable:  'enable',
  traderDisable: 'disable',

  // Filters — Intel Center
  intelNotBuilt: 'Not built',
  intelLevel1:   'Level 1',
  intelLevel2:   'Level 2',
  intelLevel3:   '-30% flea tax',

  // ItemTable — columns
  colItem:       'Item',
  colBuyTrader:  'Buy (Trader)',
  colSellTrader: 'Sell (Trader)',
  colAction:     'Action',
  colBestProfit: '\u2605 Best Profit',
  colTraderFlea: 'Trader\u2192Flea',
  colFleaTrader: 'Flea\u2192Trader',
  colFlea:       'Flea',

  // ItemTable — tooltips
  tooltipBuyPrices:  'Buy prices by trader (your level)',
  tooltipSellPrices: 'Trader buy-back prices',

  // ItemTable — flea tooltip
  flea24h:    'Flea \u2014 24h',
  fleaCur:    'Current',
  fleaLow:    'Low 24h',
  fleaAvg:    'Avg 24h',
  fleaHigh:   'High 24h',
  fleaOffers: 'Offers',

  // ItemTable — recommendations
  recFTS: 'Buy Flea \u2192 Sell Trader',
  recBTF: 'Buy Trader \u2192 Sell Flea',

  // ItemTable — mobile card
  cardBuy:    'Buy',
  cardSell:   'Sell',
  cardOffers: 'offers',

  // ItemTable — pagination
  paginationOf:      'of',
  paginationPerPage: 'Per page:',
  paginationPage:    'Page',
  paginationTapSort: 'Tap to sort',

  // ItemTable — empty state
  noItems: 'No profitable items found. Try lowering the profit threshold or enabling more traders.',

  // ApiStatus
  apiStatusTitle:        'Sync status',
  apiStatusOnline:       'tarkov.dev Online',
  apiStatusDegraded:     'tarkov.dev Degraded',
  apiStatusOffline:      'tarkov.dev Offline',
  apiStatusChecking:     'Checking…',
  apiStatusGlobal:       'Overall status',
  apiStatusLastSync:     'Last sync',
  apiStatusItems:        'Items synced',
  apiStatusItemsSub:     'total cumulative',
  apiStatusSource:       'API source',
  apiStatusSourceSub:    'auto-checked every 30s',
  apiStatusCheckedAt:    'Checked',
  apiStatusModeStatus:   'Status',
  apiStatusModeItems:    'Items',
  apiStatusModeLastSync: 'Last sync',
  apiStatusModeDuration: 'Duration',
  apiStatusNever:        'never',
  apiStatusJustNow:      'just now',
  apiStatusMinutesAgo:   'm ago',
  apiStatusHoursAgo:     'h ago',
  apiStatusRest:         'REST',

  // ExportButtons
  exportCSV:  'Export as CSV',
  exportJSON: 'Export as JSON',
};

export default en;
