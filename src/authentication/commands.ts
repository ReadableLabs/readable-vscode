import * as vscode from "vscode";
import { StatusBarProvider } from "../statusBar/StatusBarProvider";
import Account from "./api/Account";
import { ReadableAuthenticationProvider } from "./AuthProvider";
import { emailLogin } from "./EmailLogin";
import { githubLogin } from "./GitHubLogin";
import { loginOptions } from "./Prompts";
import { registerOptions } from "./Prompts";
import { emailRegister } from "./Misc";
import { SecretStorage } from "vscode";
import { vsCodeDivider } from "@vscode/webview-ui-toolkit";

const status = new StatusBarProvider();
export const login = async () => {
  let key: string | undefined;
  const selection = await vscode.window.showQuickPick(loginOptions);

  if (!selection) {
    return;
  }

  if (selection === loginOptions[0]) {
    const _key = await githubLogin();
    key = _key;
  } else if (selection === loginOptions[1]) {
    const _key = await emailLogin();
    key = _key;
  } else {
    return;
  }

  if (!key) {
    return;
  }

  await vscode.authentication.getSession(
    ReadableAuthenticationProvider.id,
    [key],
    { createIfNone: true }
  );
  vscode.window.showInformationMessage("Readable: Successfully logged in!");
  setTimeout(() => {
    status.updateStatusBar();
    vscode.window.showInformationMessage(
      "Readable: To generate a docstring, press  ctrl ' (cmd ' on Mac) while your cursor is in any function OR if the function is highlighted."
    );
  }, 500);
};

export const register = async () => {
  const session = await vscode.authentication.getSession(
    ReadableAuthenticationProvider.id,
    [],
    { createIfNone: false }
  );
  if (session) {
    vscode.window.showInformationMessage(
      "Readable: You are already logged in!"
    );
    return;
  }
  let choice = await vscode.window.showQuickPick(registerOptions);

  if (!choice) {
    return;
  }

  if (choice === registerOptions[0]) {
    const key = await githubLogin();

    if (!key) {
      return;
    }

    await vscode.authentication.getSession(
      ReadableAuthenticationProvider.id,
      [key],
      { createIfNone: true }
    );
    await vscode.window.showInformationMessage("Readable: Logged in!");
  } else if (choice === registerOptions[1]) {
    await emailRegister();
  } else {
    return;
  }
};

export const resetPassword = async () => {
  const email = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: "Email",
    prompt: "Enter in your email",
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
          vscode.window.showErrorMessage(err.message);
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

export const logout = async (authProvider: ReadableAuthenticationProvider) => {
  const session = await vscode.authentication.getSession(
    ReadableAuthenticationProvider.id,
    [],
    { createIfNone: false }
  );
  if (!session) {
    vscode.window.showInformationMessage(
      "Readable: You are already logged out"
    );
    return;
  }
  Account.emailLogout(session.accessToken);
  authProvider.logoutRemoveSession();
  vscode.window.showInformationMessage("Readable: Successfully logged out");
  return;
};
