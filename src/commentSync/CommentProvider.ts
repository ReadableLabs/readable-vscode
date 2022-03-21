import * as vscode from "vscode";
import * as path from "path";
import { blame } from "../commentSyncAPI";
import CodeEditor from "../CodeEditor";
import { getCommentRange } from "./comments";
import { getDocumentTextFromEditor, updateDecorations } from "./utils";
import { needsUpdating } from "./sync";

export default class CommentProvider implements vscode.Comment {
  id: number;
  savedBody: string | vscode.MarkdownString;
  constructor(
    public body: string | vscode.MarkdownString,
    public mode: vscode.CommentMode,
    public author: vscode.CommentAuthorInformation,
    public contextValue?: string,
    public reactions?: vscode.CommentReaction[],
    public label?: string
  ) {
    this.id = 696969;
    this.savedBody = body;
  }
}

export const getCommentRanges = {
  provideCommentingRanges: async (
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ) => {
    if (!vscode.workspace.workspaceFolders) {
      return [];
    }
    const folder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const file = path.relative(folder, document.uri.fsPath);
    let ranges = await getOutOfSyncComments(folder, file, document);

    let inline = await getOutOfSyncInlineComments(folder, file, document);
    return [...inline, ...ranges];
  },
};

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

const isInlineComment = (document: string[], line: number) => {
  if (
    !document[line].includes("//") &&
    !document[line].includes("*") &&
    !document[line].includes("/*") &&
    !document[line].includes("*/")
  ) {
    // use refeg
    return false;
  }
  return true;
  // return document[line].includes("//");
};

const checkSync = (
  line: vscode.Range,
  blame: { [index: number]: number },
  // totalLines: number,
  document: string[],
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
    line.end.line + amount < document.length
      ? line.end.line + amount
      : line.end.line;
  for (let i = safeStart; i < line.start.line; i++) {
    // get document, and check if line is comment
    if (!isInlineComment(document, i)) {
      if (blame[i] > commentTime) {
        return true;
      }
    }
  }
  for (let k = safeEnd; k > line.end.line; k--) {
    if (!isInlineComment(document, k)) {
      if (blame[k] > commentTime) {
        return true;
      }
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
    if (checkSync(inlineComment, fileBlame, document, 5)) {
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
    startLine > 1 &&
    document[startLine - 1].indexOf("//", commentIndex) !== -1
  ) {
    // maybe have it at the char index, but idk
    startLine--;
  }
  while (
    endLine + 1 < document.length &&
    document[endLine + 1].indexOf("//", commentIndex) !== -1
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
      console.log(`${document[line]} is an inline comment`);
      let range = getInlineCommentGroup(line, document);
      if (range.end.line === line) {
        line++;
      } else {
        line = range.end.line;
      }
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
  console.log("comments");
  console.log(commentLines);
  return commentLines;
};
