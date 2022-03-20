import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { blame, sync } from "../commentSyncAPI";
import CodeEditor from "../CodeEditor";
import { getCommentRange } from "./comments";
import { getDocumentTextFromEditor, updateDecorations } from "./utils";
import { needsUpdating } from "./sync";
import { composedParent } from "@microsoft/fast-foundation";
import { allowedNodeEnvironmentFlags } from "process";

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
  // call with line + 1 because blame is not 0 index
  line: vscode.Range,
  blame: { [index: number]: number },
  totalLines: number,
  amount: number
) => {
  let commentTime = blame[line.start.line];
  for (let b = line.start.line; b < line.end.line; b++) {
    if (blame[b] > commentTime) {
      commentTime = b;
    }
  }
  let safeStart =
    line.start.line - amount > 0 ? line.start.line - amount : line.start.line;
  let safeEnd =
    line.end.line + amount < totalLines
      ? line.end.line + amount
      : line.end.line;
  for (let i = safeStart; i < line.start.line; i++) {
    if (blame[i] > commentTime) {
      return true;
    }
  }
  for (let k = safeEnd; k > line.end.line; k--) {
    if (blame[k] > commentTime) {
      return true;
    }
  }
  return false;
  // let safeStart = line - amount > 0 ? line - amount : 0;
  // let safeEnd = line + amount < totalLines ? line + amount : totalLines;
  // for (let i = safeStart; i <= safeEnd; i++) {
  //   // check if document[i] is not a comment, and then return true
  //   if (blame[i] > commentTime) {
  //     return true;
  //   }
  //   return false;
  // }
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
  for (let inlineComment of allComments) {
    if (checkSync(inlineComment, fileBlame, document.length, 5)) {
      console.log(
        `${inlineComment.start.line} - ${inlineComment.end.line} is out of sync`
      );
      // let comment = toRange(line, document[line].length);
      outOfSyncLines.push(inlineComment);
    }
    // line + 1
  }
  return outOfSyncLines;
};

// so comments
// like this
// pass in line + 1
const getInlineCommentGroup = (
  line: number,
  document: string[]
): vscode.Range => {
  let startLine = line,
    endLine = line;
  let commentIndex = document[line].indexOf("//");
  while (
    document[startLine].indexOf("//", commentIndex) !== -1 &&
    startLine > 0
  ) {
    // maybe have it at the char index, but idk
    startLine--;
  }
  while (
    document[endLine].indexOf("//", commentIndex) !== -1 &&
    endLine < document.length
  ) {
    endLine++;
  }
  return new vscode.Range(
    new vscode.Position(startLine, commentIndex),
    new vscode.Position(endLine, document[endLine].length)
  );
};

const getAllInlineComments = (document: string[]) => {
  // refactor to be ranges, and get group right here, check if it already has a range
  let commentLines: vscode.Range[] = [];
  let line = 0;
  while (line < document.length) {
    if (document[line].includes("//")) {
      let range = getInlineCommentGroup(line, document);
      line = range.end.line;
      commentLines.push(range);
    } else {
      line++;
    }
  }
  // for (let [index, line] of document.entries()) {
  //   if (line.includes("//")) {
  //     commentLines.push(index);
  //   }
  // }
  return commentLines;
};
