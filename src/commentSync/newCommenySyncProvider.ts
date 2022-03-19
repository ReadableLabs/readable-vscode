import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { blame, sync } from "../commentSyncAPI";
import CodeEditor from "../CodeEditor";
import { getCommentRange } from "./comments";
import {
  getAllInlineComments,
  getDocumentTextFromEditor,
  updateDecorations,
} from "./utils";
import { needsUpdating } from "./sync";
import { composedParent } from "@microsoft/fast-foundation";

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
      let document = getDocumentText(e).split("\n");
      const folder = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const file = path.relative(folder, e.uri.fsPath);
      console.log(file);
      await sync(folder);
      let ranges = await getOutOfSyncComments(folder, file, e);

      let inline = await getOutOfSyncInlineComments(folder, file, e);

      updateDecorations([...ranges, ...inline]);
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
const getDocumentText = (e: vscode.TextDocument) => {
  // fix bug in constructor
  return e.getText(
    new vscode.Range(
      // gets all the lines in the document
      new vscode.Position(0, 0),
      new vscode.Position(e.lineCount, e.lineAt(e.lineCount - 1).lineNumber)
    )
  );
};

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

const toRange = (line: number, maxChars: number) => {
  return new vscode.Range(
    new vscode.Position(line, 0),
    new vscode.Position(line, maxChars)
  );
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
      // console.log(
      //   `${symbol.name} with comment range ${commentRange.start.line} - ${commentRange.end.line} needs updating`
      // );
      updatingRanges.push(commentRange);
    }
  }
  return updatingRanges;
  updateDecorations(updatingRanges);
  console.log(blameText);
  console.log("done");
};

const checkSync = (
  line: number,
  blame: { [index: number]: number },
  totalLines: number,
  amount: number
) => {
  let commentTime = blame[line];
  let safeStart = line - amount > 0 ? line - amount : 0;
  let safeEnd = line + amount < totalLines ? line + amount : totalLines;
  for (let i = safeStart; i <= safeEnd; i++) {
    // check if document[i] is not a comment, and then return true
    if (blame[i] > commentTime) {
      return true;
    }
    return false;
  }
};

const getOutOfSyncInlineComments = async (
  folder: string,
  file: string,
  editor: vscode.TextDocument
) => {
  let document = getDocumentText(editor).split("\n");
  if (!document) {
    return [];
  }
  let outOfSyncLines: vscode.Range[] = [];
  const fileBlame = await blame(folder, file);
  const allComments = getAllInlineComments(document);
  for (let line of allComments) {
    if (checkSync(line + 1, fileBlame, document.length, 5)) {
      console.log(`${line + 1} is out of sync`);
      let comment = toRange(line, document[line].length);
      outOfSyncLines.push(comment);
    }
    // line + 1
  }
  return outOfSyncLines;
};
