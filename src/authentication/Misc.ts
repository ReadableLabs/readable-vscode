import * as vscode from "vscode";
import TrialHelper from "../trial/TrialHelper";
import Account from "./api/Account";
import { CodeCommentAuthenticationProvider } from "./AuthProvider";
import { v4 as uuidv4 } from "uuid";
import { emailLogin } from "./EmailLogin";

export const checkSession = async () => {};

export const checkAccount = async (secrets: vscode.SecretStorage) => {
  try {
    const session = await vscode.authentication.getSession(
      CodeCommentAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );
    console.log(session);
    if (!session) {
      let email = await secrets.get("readable:email");
      let pass = await secrets.get("readable:pass");

      if (!email || !pass) {
        vscode.window.withProgress(
          {
            title: "Performing first time setup",
            location: vscode.ProgressLocation.Notification,
            cancellable: false,
          },
          (proress, token) => {
            let p = new Promise<void>(async (resolve, reject) => {
              try {
                email = uuidv4().replace(/-/g, "") + "@readable.so";
                console.log(email);
                pass = uuidv4();
                await Account.Register(email, pass, pass);
                await secrets.store("readable:email", email);
                await secrets.store("readable:pass", pass);
                const key = await Account.EmailLogin({
                  email: email,
                  password: pass,
                });
                const account = await vscode.authentication.getSession(
                  CodeCommentAuthenticationProvider.id,
                  [key],
                  { createIfNone: true, silent: true }
                );
                resolve();
              } catch (err: any) {
                await secrets.delete("readable:email");
                await secrets.delete("readable:pass");
                vscode.window.showErrorMessage(err.message);
              }
            });
            return p;
          }
        );
      }

      const result = await vscode.window.showInformationMessage(
        "No account detected. Make an account or login to use Readable.",
        "Log in",
        "Sign up"
      );
      console.log(result);
      if (result === "Log in") {
        await vscode.commands.executeCommand("readable.login");
      } else if (result === "Sign up") {
        await vscode.commands.executeCommand("readable.register");
      } else {
        return;
      }
    } else {
      const profile = await Account.GetProfile(session.accessToken);
      if (!profile) {
        return;
      }
      if (profile.plan === "Premium") {
        return;
      }
      await TrialHelper.showTrialNotification(profile.trial_end);
    }
  } catch (err: any) {
    vscode.window.showErrorMessage(err.message);
  }
};

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
    vscode.window.showInformationMessage("Success! Try logging in.");
  } catch (err: any) {
    vscode.window.showErrorMessage(err.message);
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
