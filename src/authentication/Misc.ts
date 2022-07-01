import * as vscode from "vscode";
import TrialHelper from "../trial/TrialHelper";
import Account from "./api/Account";
import { ReadableAuthenticationProvider } from "./AuthProvider";
import { emailLogin } from "./EmailLogin";

export const checkSession = async () => {};

export const checkAccount = async () => {
  try {
    const session = await vscode.authentication.getSession(
      ReadableAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );
    console.log(session);
    if (!session) {
      // const result = await vscode.window.showInformationMessage(
      //   "Readable: No account detected. Make an account or login to continue.",
      //   "Log in",
      //   "Sign up"
      // );
      // if (result === "Log in") {
      //   await vscode.commands.executeCommand("readable.login");
      // } else if (result === "Sign up") {
      //   await vscode.commands.executeCommand("readable.register");
      // } else {
      //   return;
      // }
    } else {
      const profile = await Account.GetProfile(session.accessToken);
      if (!profile) {
        return;
      }
      vscode.commands.executeCommand("readable.setLoggedIn");
      if (profile.plan === "Premium") {
        return;
      }
      await TrialHelper.showTrialNotification(profile.trial_end);
    }
  } catch (err: any) {
    vscode.window.showErrorMessage(err.message);
  }
};

export const emailRegister = async () => {
  try {
    const email = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Email",
      prompt: "Enter in an email",
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

    await vscode.window.withProgress(
      {
        title: "Registering",
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
      },
      (progress, token) => {
        const p = new Promise<void>(async (resolve, reject) => {
          const _detail = await Account.Register(email, password1, password2);
          resolve();
        });
        return p;
      }
    );
    vscode.window.showInformationMessage("Readable: Success! Try logging in.");
  } catch (err: any) {
    vscode.window.showErrorMessage(err.message);
  }
};
