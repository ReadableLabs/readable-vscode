import * as vscode from "vscode";
import * as Git from "nodegit";
import * as path from "path";

export default class CommentSyncProvider {
  private _path: string | undefined;
  constructor() {
    if (vscode.workspace.workspaceFolders) {
      this._path = vscode.workspace.workspaceFolders[0].uri.path;
      console.log(this._path);
    }
    vscode.workspace.onDidChangeWorkspaceFolders((e) => {
      this._path = e.added[0].uri.path;
    });
  }

  public checkGit() {}
}
