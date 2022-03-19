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
      let ranges = await getOutOfSyncComments(folder, file, e.document);
      updateDecorations(ranges);
      // get each out of sync line, add it to  total dict with line and range, and then for each of the changed functions, check the params
    });
    vscode.workspace.onDidSaveTextDocument(async (e) => {
      if (!vscode.workspace.workspaceFolders) {
        return;
      }
      const folder = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const file = path.relative(folder, e.uri.fsPath);
      console.log(file);
      await sync(folder);
      let ranges = await getOutOfSyncComments(folder, file, e);
      updateDecorations(ranges);
    });
  }
}

const acceptedSymbols = [
  vscode.SymbolKind.Method,
  vscode.SymbolKind.Function,
  vscode.SymbolKind.Constant,
];

/**
 * the epic
 * @returns
 */
const getFunctions = async () => {
  const symbols = await CodeEditor.getAllSymbols();
  let fullSymbols = [];
  for (let symbol of symbols) {
    if (symbol.kind === vscode.SymbolKind.Class) {
      for (let child of symbol.children) {
        if (acceptedSymbols.includes(child.kind)) {
          fullSymbols.push(child);
        }
      }
    } else {
      fullSymbols.push(symbol);
    }
  }
  return fullSymbols;
};

const getOutOfSyncComments = async (
  folder: string,
  file: string,
  editor: vscode.TextDocument
) => {
  let blameText = await blame(folder, file);
  const symbols = await getFunctions();
  const document = getDocumentTextFromEditor(editor);
  let updatingRanges: vscode.Range[] = [];
  for (let symbol of symbols) {
    let commentRange = getCommentRange(
      symbol.range.start.line - 2,
      document.split("\n")
    );
    if (!commentRange) {
      continue;
    }
    if (needsUpdating(symbol, commentRange, blameText)) {
      console.log(
        `${symbol.name} with comment range ${commentRange.start.line} - ${commentRange.end.line} needs updating`
      );
      updatingRanges.push(commentRange);
    }
  }
  return updatingRanges;
  updateDecorations(updatingRanges);
  console.log(blameText);
  console.log("done");
};
