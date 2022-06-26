import * as vscode from "vscode";
import { ReadableAuthenticationProvider } from "./authentication/AuthProvider";
import { loginOptions, registerOptions } from "./authentication/Prompts";
import { emailLogin } from "./authentication/EmailLogin";
import { githubLogin } from "./authentication/GitHubLogin";
import { checkAccount, register, resetPassword } from "./authentication/Misc";
import { StatusBarProvider } from "./statusBar/StatusBarProvider";
import { HelpOptionsProvider } from "./sideBar/HelpOptionsProvider";
import { ResyncOptionsProvider } from "./sideBar/ResyncOptionsProvider";
import { inlineProvider } from "./completion/providers";
import {
  insertDocstringCommand,
  insertInlineCommentCommand,
  regenerateCommentCommand,
} from "./completion/commands";

export async function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "Readable" is now active!');

  let authProvider = new ReadableAuthenticationProvider(context.secrets);

  context.subscriptions.push(
    inlineProvider,

    vscode.commands.registerCommand(
      "readable.insertInlineComment",
      insertInlineCommentCommand
    ),

    vscode.commands.registerCommand(
      "readable.rightClickComment",
      insertDocstringCommand
    )
  );

  vscode.commands.registerCommand(
    "readable.regenerateComment",
    regenerateCommentCommand
  );

  context.subscriptions.push(
    vscode.authentication.registerAuthenticationProvider(
      ReadableAuthenticationProvider.id,
      "Readable-Auth",
      authProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("readable.login", async () => {
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
    }),

    vscode.commands.registerCommand("readable.reportBug", async () => {
      await vscode.env.openExternal(
        vscode.Uri.parse("https://github.com/ReadableLabs/readable/issues")
      );
    }),

    vscode.commands.registerCommand("readable.resetPassword", resetPassword),
    vscode.commands.registerCommand("readable.enableAutoComplete", () => {
      vscode.workspace
        .getConfiguration("readable")
        .update("enableAutoComplete", true, true);
      setTimeout(() => {
        status.updateStatusBar();
      }, 500);
    }),
    vscode.commands.registerCommand("readable.disableAutoComplete", () => {
      vscode.workspace
        .getConfiguration("readable")
        .update("enableAutoComplete", false, true);
      setTimeout(() => {
        status.updateStatusBar();
      }, 500);
    }),
    vscode.commands.registerCommand("readable.register", async () => {
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
        await register();
      } else {
        return;
      }
    })
  );

  const session = await vscode.authentication.getSession(
    ReadableAuthenticationProvider.id,
    [],
    { createIfNone: false }
  );

  vscode.commands.registerCommand("readable.version", async () => {
    // resyncOptionsProvider.resync?.checkProject();
    const version = context.extension.packageJSON.version;
    if (!version) {
      vscode.window.showInformationMessage("Error: Unable to get version");
      return;
    }
    vscode.window.showInformationMessage(
      "Readable is currently on version " + version
    );
  });
  // view on did expand element

  const status = new StatusBarProvider();

  const helpTree = new HelpOptionsProvider();
  vscode.window.createTreeView("help", { treeDataProvider: helpTree });

  const resyncOptionsProvider = new ResyncOptionsProvider(context);
  vscode.window.createTreeView("resync", {
    treeDataProvider: resyncOptionsProvider,
  });

  checkAccount();
}

export function deactivate() {} // make sure to log out here, and send an api request to delete the key with the token
