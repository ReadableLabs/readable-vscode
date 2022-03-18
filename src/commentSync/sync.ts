import * as vscode from "vscode";

export const needsUpdating = (
  symbol: vscode.DocumentSymbol,
  commentRange: vscode.Range,
  blameInfo: { [index: number]: number }
): boolean => {
  let latestCommentTime: number = 0;
  let latestFunctionTime: number = 0;
  for (
    let i = commentRange.start.line + 1;
    i < commentRange.end.line + 1;
    i++
  ) {
    let latest = blameInfo[i];
    if (latestCommentTime < latest) {
      latestCommentTime = latest;
    }
  }
  for (
    let b = symbol.range.start.line + 1;
    b < symbol.range.end.line + 1;
    b++
  ) {
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
