import * as vscode from "vscode";

const codeLensEnabled = () =>
  vscode.workspace.getConfiguration("readable").get("enableCodeLens", true);

const showFeedback = () =>
  vscode.workspace.getConfiguration("readable").get("showFeedback", true);

export { codeLensEnabled, showFeedback };
