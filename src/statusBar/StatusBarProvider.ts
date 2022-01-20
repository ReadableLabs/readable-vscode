import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "../authentication/AuthProvider";
import { StatusBarUpdateEvent } from "../Events/StatusBarUpdateEvent";

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
    this.statusBarItem.show(); // show the s
    let status = this.getEnabled();
    this.updateStatusBar();
  }

  public async updateStatusBar() {
    let status = await this.getEnabled();
    this.statusBarItem.text = status.text;
    this.statusBarItem.command = status.command;
  }

  private async getEnabled() {
    console.log(
      vscode.workspace
        .getConfiguration("readable")
        .get<boolean>("enableAutoComplete")
    );
    if (
      !(await vscode.authentication.getSession(
        CodeCommentAuthenticationProvider.id,
        [],
        { createIfNone: false }
      ))
    ) {
      return {
        text: "$(account)  Readable: Login",
        command: "readable.login",
      };
    } else if (
      vscode.workspace
        .getConfiguration("readable")
        .get<boolean>("enableAutoComplete")
    ) {
      return {
        text: "$(check)  Readable: Enabled",
        command: "readable.disableAutoComplete",
      };
    } else if (
      vscode.workspace
        .getConfiguration("readable")
        .get<boolean>("enableAutoComplete") === false
    ) {
      return {
        text: "$(circle-slash)  Readable: Disabled",
        command: "readable.enableAutoComplete",
      };
    } else {
      return {
        text: "$(error)  Readable: Error",
        command: "",
      };
    }
  }
}
