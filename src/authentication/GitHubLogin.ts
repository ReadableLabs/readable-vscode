import * as vscode from "vscode";
import Account from "./api/Account";

export const githubLogin = async (): Promise<string | undefined> => {
  const session = await vscode.authentication.getSession(
    "github",
    ["user:email"],
    { createIfNone: true }
  );
  if (!session) {
    return;
  }
  const key = await vscode.window.withProgress(
    {
      title: "Logging in with GitHub",
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
    },
    (progress, token) => {
      let p = new Promise<string>(async (resolve, reject) => {
        try {
          const key = await Account.GitHubLogin(session.accessToken);
          if (!key) {
            reject();
          }
          resolve(key);
        } catch (err: any) {
          vscode.window.showErrorMessage(err.message);
          if (err.response) {
            vscode.window.showErrorMessage(err.response);
          }
        }
      });
      return p;
    }
  );
  return key;
};
