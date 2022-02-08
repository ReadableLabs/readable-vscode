export interface IChange {
  file: string;
  function: string;
  lastUpdated: string;
  changesCount: number;
}

export interface ICommentBounds {
  start: number;
  end: number;
}
