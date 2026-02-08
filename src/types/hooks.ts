export type PlayerFilterType =
  | 'ALL_BATTERS'
  | 'ALL_PITCHERS'
  | 'C'
  | '1B'
  | '2B'
  | 'SS'
  | '3B'
  | 'OF'
  | 'Util'
  | 'SP'
  | 'RP';

// Season selection for dropdown
export type SeasonType = 'current' | 'last';

// Time period filter (only applicable when SeasonType is 'current')
export type TimePeriodType = 'full' | 'lastmonth' | 'lastweek';

// Yahoo API stat_type parameter values
// Note: 'lastseason' requires querying previous year's game key, not a type param
export type StatType = 'season' | 'lastmonth' | 'lastweek';

export interface UsePlayersOptions {
  start?: number;
  count?: number;
  playerType?: PlayerFilterType;
  fetchAll?: boolean;
  statType?: StatType;
  seasonYear?: 'current' | 'last';  // Which season to query (affects game key)
}

export interface PlayersQueryResult<T = unknown> {
  currentPageData?: T[];
  fullDataset?: T[];
  isLoadingCurrentPage: boolean;
  isLoadingFullDataset: boolean;
  error?: Error;
}
