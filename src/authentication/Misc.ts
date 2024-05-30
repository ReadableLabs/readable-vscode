import * as vscode from "vscode";
import TrialHelper from "../trial/TrialHelper";
import Account from "./api/Account";
import { ReadableAuthenticationProvider } from "./AuthProvider";
import { emailLogin } from "./EmailLogin";
import { v4 as uuid } from "uuid";

export const checkSession = async () => {};

function generatePassword() {
  var length = 8,
    charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export const checkAccount = async (context: vscode.ExtensionContext) => {
  try {
    const session = await vscode.authentication.getSession(
      ReadableAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );
    if (!session) {
      const key = await vscode.window.withProgress(
        {
          cancellable: false,
          location: vscode.ProgressLocation.Notification,
          title: "Configuring Readable... Please Wait",
        },
        (progress, token) => {
          return new Promise<string>(async (resolve, reject) => {
            // await context.globalState.update("readable__email", undefined);
            // await context.globalState.update("readable__password", undefined);
            // return;
            let email = await context.globalState.get("readable__email");
            let password = await context.globalState.get("readable__password");
            let key: string;

            if (!email || !password) {
              let email = uuid() + "@readable.so";
              let password = generatePassword();

              await Account.Register(email, password, password);
              key = await Account.EmailLogin({
                email: email,
                password: password,
              });

              // await vscode.authentication.getSession(
              //   ReadableAuthenticationProvider.id,
              //   [key],
              //   { createIfNone: true }
              // );

              await context.globalState.update("readable__email", email);
              await context.globalState.update("readable__password", password);

              console.log("logged in");
              // then create an account
            } else {
              key = await Account.EmailLogin({
                email: email as string,
                password: password as string,
              });
            }

            resolve(key);
          });
        }
      );

      const session = await vscode.authentication.getSession(
        ReadableAuthenticationProvider.id,
        [key],
        { createIfNone: true }
      );
      const profile = await Account.GetProfile(session.accessToken);
      if (!profile) {
        return;
      }

      vscode.commands.executeCommand("readable.setLoggedIn");

      let show = await context.globalState.get("readable.hideInfoMessage");
      if (!show) {
        let r = await vscode.window.showInformationMessage(
          "Readable: To generate a docstring, press  ctrl ' (cmd ' on Mac) while your cursor is on any function, or click the button on the sidebar.",
          "Ok",
          "Don't Show Again"
        );

        if (r === "Don't Show Again") {
          await context.globalState.update("readable.hideInfoMessage", true);
        }
      }
      await TrialHelper.showTrialNotification(profile.trial_end);

      return;

      const result = await vscode.window.showInformationMessage(
        "Readable: No account detected. Make an account or login to continue.",
        "Log in",
        "Sign up"
      );
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
      vscode.commands.executeCommand("readable.setLoggedIn");
      if (profile.plan === "Premium") {
        return;
      }

      setTimeout(async () => {
        let show = await context.globalState.get("readable.hideInfoMessage");
        if (!show) {
          let r = await vscode.window.showInformationMessage(
            "Readable: To generate a docstring, press the 'Generate Docstring' button on the sidebar while your cursor is over any function. Alternatively, use the keyboard shortcut (ctrl + ' on windows, or cmd + ' on mac).",
            "Ok",
            "Don't Show Again"
          );

          if (r === "Don't Show Again") {
            await context.globalState.update("readable.hideInfoMessage", true);
          }
        }
      }, 500);
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
