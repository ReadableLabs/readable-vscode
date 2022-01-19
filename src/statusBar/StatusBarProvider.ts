import * as vscode from "vscode";
import { StatusBarUpdateEvent } from "../Events/StatusBarUpdateEvent";

export class StatusBarProvider {
  private statusBarItem: vscode.StatusBarItem;
  constructor() {
    let hi = new vscode.EventEmitter<StatusBarUpdateEvent>();
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      10
    ); // implement functions for file on change, language check, and when the user clicks the status bar item
    // use events, things like that
    // use vscode events and sync it up with all of this stuff
    let status = this.getEnabled();
    this.statusBarItem.text = status.text;
    this.statusBarItem.command = status.command;
  }

  onDidChangeConfig = () => {};

  private getEnabled() {
    if (
      vscode.workspace.getConfiguration("readable").get<boolean>("isEnabled")
    ) {
      return {
        text: "Readable: Enabled",
        command: "readable.enableAutoComplete",
      };
    } else {
      return {
        text: "Readable: Disabled",
        command: "readable.enableAutoComplete",
      };
    }
  }
}
