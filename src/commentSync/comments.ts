import * as vscode from "vscode";
import { IChange } from "./interfaces";
import { getSymbolFromName } from "./utils";

/**
 * Gets the range of the comment that is associated with the given line.
 * @param {number} line - the line to get the comment range for.
 * @param {string[]} document - the document to get the comment range for.
 * @returns {vscode.Range | undefined} - the range of the comment that is associated with the given line.
 */
const getCommentRange = (
  line: number,
  document: string[]
): vscode.Range | undefined => {
  if (!vscode.window.activeTextEditor) {
    throw new Error("Error: no active text editor");
  }

  let startLine = line >= 0 ? line : 0,
    endLine = line >= 0 ? line : 0;

  while (startLine > 0) {
    if (document[startLine].includes("*/")) {
      if (startLine === line) {
        startLine--;
        continue;
      } else {
        return;
      }
      // pass in i - 2 so you don't hit this
    } else if (document[startLine].includes("/*")) {
      // found start range
      break;
    }
    startLine--;
  }

  while (endLine < document.length - 1) {
    // console.log("end line " + endLine);
    // try -1
    // TODO: refactor to remove all whitespace and check. Benchmark results
    if (document[endLine].includes("/*")) {
      if (endLine === line) {
        endLine++;
        continue;
      } else {
        // to get parameters changed, get start range, get start character, and traverse the lines + characters (string as single line) until you find the )
        return;
      }
    } else if (document[endLine].includes("*/")) {
      break;
    }
    endLine++;
  }

  //   let i = line;
  //   //   let i = symbol.range.start.line - 1; // change so that -1 is already passed in and it assumes you're already in a comment. Also make it find comment range at bottom as well as top with both for loops

  //   if (i < 0) {
  //     return;
  //   }

  //   console.log(document[i]);
  //   if (!document[i].includes("*/") && !document[i].includes("//")) {
  //     return;
  //   }

  //   while (!document[i].includes("/*")) {
  //     console.log(document[i]);
  //     // do a check to see if the current line doesn't include // in this
  //     if (i - 1 < 0) {
  //       console.log("failed to find comment");
  //       return;
  //     }
  //     i--;
  //   }
  //   const startLine = i;
  const startCharacter = vscode.window.activeTextEditor.document.lineAt(
    // refactor, don't use line at, just check document for first non whitespace character index
    startLine
  ).firstNonWhitespaceCharacterIndex;
  //   const endLine = i;
  //   const endLine = symbol.range.start.line - 1; // fix 15 instead of 16
  const endCharacter =
    // vscode.window.activeTextEditor.document.lineAt(endLine).text.length;
    document[endLine].length;
  return new vscode.Range(
    new vscode.Position(startLine, startCharacter),
    new vscode.Position(endLine, endCharacter)
  );
};

const getNewCommentRanges = (
  symbols: vscode.DocumentSymbol[],
  changes: IChange[],
  fileName: string,
  textDocument: string[]
) => {
  let currentComments = changes;
  let allComments: IChange[] = [];
  for (let [index, comment] of currentComments.entries()) {
    if (comment.file === fileName) {
      let symbol = getSymbolFromName(symbols, comment.function);
      if (!symbol) {
        continue;
      }
      let range = getCommentRange(symbol.range.start.line - 1, textDocument);
      if (!range) {
        continue;
      }
      if (
        textDocument[range.start.line].includes("/*") &&
        textDocument[range.end.line].includes("*/")
      ) {
        currentComments[index].range = range;
        allComments.push(currentComments[index]);
      }
    }
  }
  return allComments;
};

const getValidCommentRanges = (
  changes: IChange[],
  document: string[],
  fileName: string
) => {
  let allChanges: IChange[] = [];
  for (let change of changes) {
    if (change.file !== fileName) {
      continue;
    }
    if (
      document[change.range.start.line].includes("/*") &&
      document[change.range.end.line].includes("*/")
    ) {
      allChanges.push(change);
    }
  }
  return allChanges;
};

const getSymbolFromCommentRange = (
  symbols: vscode.DocumentSymbol[],
  commentRange: vscode.Range
) => {
  // we ain't going through the document, just compare it to symbols with the end range of comment - 1 and check for each symbol if it's a thing
  let i = commentRange.end.line + 1;
  for (let symbol of symbols) {
    if (i >= symbol.range.start.line && i <= symbol.range.end.line) {
      // check if it's a class
      if (symbol.kind === vscode.SymbolKind.Class) {
        for (let _symbol of symbol.children) {
          if (i >= _symbol.range.start.line && i <= _symbol.range.end.line) {
            return _symbol;
          }
        }
      }
      return symbol;
    }
  }
  return;
};

export {
  getCommentRange,
  getSymbolFromCommentRange,
  getNewCommentRanges,
  getValidCommentRanges,
};
