import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { blame, sync } from "../commentSyncAPI";

export default class CommentSync {
  constructor() {
    vscode.workspace.onDidSaveTextDocument(async (e) => {
      if (!vscode.workspace.workspaceFolders) {
        return;
      }
      const folder = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const file = path.relative(folder, e.uri.fsPath);
      console.log(file);
      await sync(folder);
      let blameText = await blame(folder, file);
      console.log(blameText);
      console.log("done");
    });
  }
}
