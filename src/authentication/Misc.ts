import * as vscode from "vscode";
import Account from "./api/Account";
import { emailLogin } from "./EmailLogin";

export const register = async () => {
  try {
    const email = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Email",
      prompt: "Enter an email",
    });

    if (!email) {
      return;
    }

    const password1 = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Password",
      prompt: "Enter in a password",
      password: true,
    });

    if (!password1) {
      return;
    }

    const password2 = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Password",
      prompt: "Repeat the password",
      password: true,
    });

    if (password1 !== password2) {
      vscode.window.showErrorMessage("Error: Passwords do not match");
      return;
    }

    let detail = await vscode.window.withProgress(
      {
        title: "Registering",
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
      },
      (progress, token) => {
        const p = new Promise<string>(async (resolve, reject) => {
          const _detail = await Account.Register(email, password1, password2);
          resolve(_detail);
        });
        return p;
      }
    );
    if (!detail) {
      return;
    }
    vscode.window.showInformationMessage(
      detail + " Check your inbox and try logging in."
    );
  } catch (err: any) {
    vscode.window.showErrorMessage(err);
  }
};

export const resetPassword = async () => {
  const email = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: "Email",
    prompt: "Enter your email",
  });

  if (!email) {
    return;
  }

  const detail = await vscode.window.withProgress(
    {
      title: "Sending Password Reset Email",
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
    },
    (progress, token) => {
      const p = new Promise<string>(async (resolve, reject) => {
        try {
          const detail = await Account.ResetPassword(email);
          if (!detail) {
            reject();
            return;
          }
          resolve(detail);
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
  vscode.window.showInformationMessage(detail);
};
