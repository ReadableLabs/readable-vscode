import * as vscode from "vscode";
import * as fs from "fs";
import * as Git from "isomorphic-git";
import * as path from "path";

export default class CommentSync {
  constructor() {
    vscode.workspace.onDidSaveTextDocument(async (e) => {
      let dir = "/Users/2023_nevin_puri/Desktop/testinit";
      await Git.add({ fs, dir, filepath: "*" });
    });
  }
}
