import * as vscode from "vscode";

export const needsUpdating = (
  symbol: vscode.DocumentSymbol,
  commentRange: vscode.Range,
  blameInfo: { [index: number]: number }
): boolean => {
  let latestCommentTime: number = 0;
  let latestFunctionTime: number = 0;
  for (let i = commentRange.start.line; i < commentRange.end.line; i++) {
    let latest = blameInfo[i];
    if (latestCommentTime < latest) {
      latestCommentTime = latest;
    }
  }
  for (let b = symbol.range.start.line; b < symbol.range.end.line; b++) {
    let latest = blameInfo[b];
    if (latestFunctionTime < latest) {
      latestFunctionTime = latest;
    }
  }
  if (latestFunctionTime > latestCommentTime) {
    return true;
  }
  return false;
};
