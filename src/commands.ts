import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";

export default class Commands {
  static enableCodeLensCommand = () => {
    vscode.workspace
      .getConfiguration("commentai")
      .update("enableCodeLens", true, true);
  };

  static disableCodeLensCommand = () => {
    vscode.workspace
      .getConfiguration("commentai")
      .update("enableCodeLens", false, true);
  };

  static welcomeMessage = async () => {};

  static loginCommand = async () => {
    const session = await vscode.authentication.getSession(
      CodeCommentAuthenticationProvider.id,
      [],
      { createIfNone: true }
    );
    console.log(session);
  };
}
