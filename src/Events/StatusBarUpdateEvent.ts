import * as vscode from "vscode";

export interface StatusBarUpdateEvent
  extends vscode.Event<{ title: string; command: string }> {
  title: string;

  command: string;

  test3: number;
}
