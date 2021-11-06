import * as vscode from "vscode";

export const enableCodeLensCommand = () => {
  vscode.workspace
    .getConfiguration("commentai")
    .update("enableCodeLens", true, true);
};

export const disableCodeLensCommand = () => {
  vscode.workspace
    .getConfiguration("commentai")
    .update("enableCodeLens", false, true);
};
