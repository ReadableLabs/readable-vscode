import * as vscode from "vscode";
import TrialHelper from "../trial/TrialHelper";
import Account from "./api/Account";
import { ReadableAuthenticationProvider } from "./AuthProvider";
import { emailLogin } from "./EmailLogin";
import { getSpan, report } from "../metrics";

export const checkSession = async () => {};

export const checkAccount = async () => {
  try {
    let span = getSpan("readable");
    const session = await vscode.authentication.getSession(
      ReadableAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );
    if (!session) {
      span.report({ session: false });
      const result = await vscode.window.showInformationMessage(
        "Readable: No account detected. Make an account or login to continue.",
        "Log in",
        "Sign up"
      );
      if (result === "Log in") {
        span.report({ ctaActionClicked: "login" });
        await vscode.commands.executeCommand("readable.login");
      } else if (result === "Sign up") {
        span.report({ ctaActionClicked: "signup" });
        await vscode.commands.executeCommand("readable.register");
      } else {
        span.report({ ctaActionClicked: "none" });
        return;
      }
    } else {
      const profile = await Account.GetProfile(session.accessToken);
      if (!profile) {
        return;
      }
      span.report({ session: true, profile: profile.id });

      vscode.commands.executeCommand("readable.setLoggedIn");
      if (profile.plan === "Premium") {
        span.report({ isPremium: true });
        return;
      }

      span.report({ isPremium: false, trialEnd: profile.trial_end });
      await TrialHelper.showTrialNotification(profile.trial_end);
    }
    console.log(span.value);
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
