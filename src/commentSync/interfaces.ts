import * as vscode from "vscode";

export interface IRange {
  line: number;
  character: number;
}

export interface IParsedChange extends IUnknownChange {
  range: IRange[];
  params: IRange[];
}

interface IUnknownChange {
  file: string;
  function: string;
  changesCount: number;
  isReturnChanged: boolean;
  isArgsChanged: boolean;
  symbol: vscode.DocumentSymbol;
}

export interface IChange extends IUnknownChange {
  range: vscode.Range;
  params: vscode.Range;
}

export interface ICommentBounds {
  start: number;
  end: number;
}
