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
  | 'RP'
  | 'P';

export interface UsePlayersOptions {
  start?: number;
  count?: number;
  playerType?: PlayerFilterType;
} 