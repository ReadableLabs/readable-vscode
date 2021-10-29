import * as vscode from "vscode";

const codeLensEnabled = () =>
  vscode.workspace.getConfiguration("commentai").get("enableCodeLens", true);

const showFeedback = () =>
  vscode.workspace.getConfiguration("commentai").get("showFeedback", true);

export { codeLensEnabled, showFeedback };
