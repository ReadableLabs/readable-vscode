import * as vscode from "vscode";
import Account from "./api/Account";
import { CodeCommentAuthenticationProvider } from "./AuthProvider";
import { ILoginCredentials, LoginOption } from "./types";

const promptEmail = async (): Promise<ILoginCredentials | undefined> => {
  const email = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: "Email",
    prompt: "Enter your email",
  });

  if (!email) {
    return;
  }

  const password = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: "Password",
    prompt: "Please enter in your password",
    password: true,
  });

  if (!password) {
    return;
  }
  return { email, password };
};

export const emailLogin = async (): Promise<string | undefined> => {
  const data = await promptEmail();
  if (!data) {
    return;
  }
  const key = await vscode.window.withProgress(
    {
      title: "Loggin In",
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
    },
    (progress, token) => {
      let p = new Promise<string>(async (resolve, reject) => {
        try {
          const key = await Account.EmailLogin(data);
          if (!key) {
            reject();
          } else {
            resolve(key);
          }
        } catch (err: any) {
          vscode.window.showErrorMessage(err);
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
