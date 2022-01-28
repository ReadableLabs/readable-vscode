import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export default class DatabaseTools {
  private _state: vscode.Memento & {
    setKeysForSync(keys: readonly string[]): void;
  };
  private _workspace: string;
  constructor(
    state: vscode.Memento & {
      setKeysForSync(keys: readonly string[]): void;
    },
    workspace: string
  ) {
    vscode.window.onDidChangeActiveTextEditor(
      async (e: vscode.TextEditor | undefined) => {
        if (!e) {
          return;
        }
      }
    );
    this._state = state;
    this._workspace = workspace;
  }
  public async addCode(workspace: string, codeSnippet: string) {
    try {
      let items = this._state.get<string>(workspace);
      if (!items) {
        items = "[]";
      }
      let itemsArray = JSON.parse(items);
      itemsArray.push(codeSnippet);
      if (itemsArray.length > 3) {
        itemsArray.shift();
      }
      await this._state.update(workspace, JSON.stringify(itemsArray));
    } catch (err: any) {
      await this.resetDb(workspace);
    }
  }

  public validateDb() {
    // validate json
  }

  public createDb() {} // create the sqlite tables

  public checkDbExists() {}

  public async resetDb(workspace: string) {
    await this._state.update(workspace, "[]");
  }
}
