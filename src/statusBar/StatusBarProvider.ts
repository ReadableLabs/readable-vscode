import * as vscode from "vscode";
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

  public updateStatusBar() {
    let status = this.getEnabled();
    this.statusBarItem.text = status.text;
    this.statusBarItem.command = status.command;
  }

  private getEnabled() {
    console.log(
      vscode.workspace
        .getConfiguration("readable")
        .get<boolean>("enableAutoComplete")
    );
    if (
      vscode.workspace
        .getConfiguration("readable")
        .get<boolean>("enableAutoComplete")
    ) {
      return {
        text: "$(check)  Readable: Enabled",
        command: "readable.disableAutoComplete",
      };
    } else {
      return {
        text: "$(circle-slash)  Readable: Disabled",
        command: "readable.enableAutoComplete",
      };
    }
  }
}
