import * as vscode from "vscode";
import { ReadableAuthenticationProvider } from "./authentication/AuthProvider";
import { checkAccount } from "./authentication/Misc";
import { StatusBarProvider } from "./statusBar/StatusBarProvider";
import { HelpOptionsProvider } from "./sideBar/HelpOptionsProvider";
import { ResyncOptionsProvider } from "./sideBar/ResyncOptionsProvider";
import { inlineProvider } from "./completion/providers";
import {
  insertDocstringCommand,
  insertInlineCommentCommand,
  regenerateCommentCommand,
} from "./completion/commands";
import {
  login,
  logout,
  register,
  resetPassword,
} from "./authentication/commands";
import { Resync } from "./resync/index";

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
      "readable.insertDocstringComment",
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
    vscode.commands.registerCommand("readable.login", login),
    vscode.commands.registerCommand("readable.logout", async () => {
      logout(authProvider);
    }),
    vscode.commands.registerCommand("readable.register", register),
    vscode.commands.registerCommand("readable.resetPassword", resetPassword),

    vscode.commands.registerCommand("readable.reportBug", async () => {
      await vscode.env.openExternal(
        vscode.Uri.parse("https://github.com/ReadableLabs/readable/issues")
      );
    }),

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
    })
  );

  vscode.commands.registerCommand("readable.version", async () => {
    resyncOptionsProvider.refresh();
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

  //Side bar
  const helpTree = new HelpOptionsProvider();
  vscode.window.createTreeView("help", { treeDataProvider: helpTree });

  const resyncOptionsProvider = new ResyncOptionsProvider(context);
  vscode.window.createTreeView("resync", {
    treeDataProvider: resyncOptionsProvider,
  });

  vscode.commands.registerCommand("readable.refreshResync", async () => {
    resyncOptionsProvider.resync?.refreshResync();
  });
  vscode.commands.registerCommand("readable.stopResync", async () => {
    resyncOptionsProvider.resync?.stopResync();
  });

  checkAccount();
}

export function deactivate() {} // make sure to log out here, and send an api request to delete the key with the token
