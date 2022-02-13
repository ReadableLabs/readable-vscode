import * as vscode from "vscode";

export interface IRange {
  line: number;
  character: number;
}

export interface IParsedChange extends IUnknownChange {
  range: IRange[];
}

interface IUnknownChange {
  file: string;
  function: string;
  changesCount: number;
}

export interface IChange extends IUnknownChange {
  range: vscode.Range;
}

export interface ICommentBounds {
  start: number;
  end: number;
}
