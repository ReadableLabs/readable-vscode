import * as vscode from "vscode";

export interface IChange {
  file: string;
  function: string;
  range: vscode.Range;
  changesCount: number;
}

export interface ICommentBounds {
  start: number;
  end: number;
}
