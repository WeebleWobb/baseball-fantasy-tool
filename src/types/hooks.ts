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

export interface UsePlayersOptions {
  start?: number;
  count?: number;
  playerType?: PlayerFilterType;
  fetchAll?: boolean; // New option for comprehensive dataset loading
}

export interface PlayersQueryResult<T = unknown> {
  currentPageData?: T[];
  fullDataset?: T[];
  isLoadingCurrentPage: boolean;
  isLoadingFullDataset: boolean;
  error?: Error;
} 