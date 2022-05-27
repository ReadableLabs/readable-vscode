export interface ResyncItemAddedEvent {
  readonly fileName: string;
  readonly relativePath: string;
  readonly lastUpdate: string;
  readonly commitDiff: number;
  readonly commentStart: number;
  readonly commentEnd: number;
}
