import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";

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

export const welcomeMessage = async () => {};

export const loginCommand = async () => {
  const session = await vscode.authentication.getSession(
    CodeCommentAuthenticationProvider.id,
    [],
    { createIfNone: true }
  );
  console.log(session);
};
