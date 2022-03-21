import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { blame, sync } from "../commentSyncAPI";
import CodeEditor from "../CodeEditor";
import { getCommentRange } from "./comments";
import { getDocumentTextFromEditor, updateDecorations } from "./utils";
import { needsUpdating } from "./sync";

export default class CommentSync {
  constructor() {
    vscode.window.onDidChangeActiveTextEditor(async (e) => {
      if (!e) {
        return;
      }
      if (!vscode.workspace.workspaceFolders) {
        return;
      }
      const folder = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const file = path.relative(folder, e.document.uri.fsPath);
      //   let ranges = await getOutOfSyncComments(folder, file, e.document);
      //   updateDecorations(ranges);
      // get each out of sync line, add it to  total dict with line and range, and then for each of the changed functions, check the params
    });
    vscode.workspace.onDidSaveTextDocument(async (e) => {
      if (!vscode.workspace.workspaceFolders) {
        return;
      }
      //   let document = getDocumentText(e).split("\n");
      const folder = vscode.workspace.workspaceFolders[0].uri.fsPath;
      //   const file = path.relative(folder, e.uri.fsPath);
      //   console.log(file);
      await sync(folder);
      //   let ranges = await getOutOfSyncComments(folder, file, e);

      //   let inline = await getOutOfSyncInlineComments(folder, file, e);

      //   updateDecorations([...ranges, ...inline]);
    });
  }
}
