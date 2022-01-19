import * as vscode from "vscode";

export interface StatusBarUpdateEvent {
  title: string;

  command: string;
}
