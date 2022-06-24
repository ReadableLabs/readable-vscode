import * as vscode from "vscode";

export interface IInsertArgs {
  cursor: vscode.Position;
  document: vscode.TextDocument;
  language: string;
}
