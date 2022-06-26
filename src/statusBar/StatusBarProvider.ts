import * as vscode from "vscode";
import { ReadableAuthenticationProvider } from "../authentication/AuthProvider";
import { StatusType } from "./statusType";

export class StatusBarProvider {
  private statusBarItem: vscode.StatusBarItem;
  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      10
    ); // implement functions for file on change, language check, and when the user clicks the status bar item
    // use events, things like that
    // use vscode events and sync it up with all of this stuff
    this.statusBarItem.text = "$(sync~spin)";
    this.statusBarItem.show();
    this.updateStatusBar();
  }

  public async updateStatusBar() {
    let status = await this.getStatus();
    this.statusBarItem.text = status.text;
    this.statusBarItem.command = status.command;
  }

  private async getStatus() {
    let authStatus = await vscode.authentication.getSession(
      ReadableAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );

    let enabled = vscode.workspace
      .getConfiguration("readable")
      .get<boolean>("enableAutoComplete");

    if (!authStatus) {
      return StatusType.login;
    } else if (enabled) {
      return StatusType.enabled;
    } else if (!enabled) {
      return StatusType.disabled;
    } else {
      return StatusType.error;
    }
  }
}
