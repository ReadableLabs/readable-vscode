import * as vscode from "vscode";
import Account from "./api/Account";
import { ReadableAuthenticationProvider } from "./AuthProvider";
import { ILoginCredentials, LoginOption } from "./types";

const promptEmail = async (): Promise<ILoginCredentials | undefined> => {
  const email = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: "Email",
    prompt: "Enter Email:",
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
      title: "Logging In",
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
    },
    (progress, token) => {
      let p = new Promise<string>(async (resolve, reject) => {
        try {
          const _key = await Account.EmailLogin(data);
          resolve(_key);
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
