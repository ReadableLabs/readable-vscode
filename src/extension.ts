import * as vscode from "vscode";
import * as winston from "winston";
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
import { AccountOptionsProvider } from "./sideBar/AccountOptionsProvider";
import VscodeOutputTransport from "./logger/VscodeOutputTransport";
import { createLogger, setLoggerMetadata } from "./logger";

// let logger: winston.Logger;
let logger = createLogger({
  logUrl: "http://localhost:8080",
});

export async function activate(context: vscode.ExtensionContext) {
  // logger = winston.createLogger({
  //   level: "info",
  //   format: winston.format.json(),
  //   defaultMeta: { service: "user_service" },
  //   transports: [
  //     new winston.transports.File({ filename: "error.log", level: "error" }),
  //     new winston.transports.File({ filename: "debug.log" }),
  //     new winston.transports.Console({ format: winston.format.simple() }),
  //     new VscodeOutputTransport({ name: "Readable" }),
  //   ],
  // });
  logger.info({ message: "got here", hi: "diasjf" });

  console.log('Congratulations, your extension "Readable" is now active!');

  let authProvider = new ReadableAuthenticationProvider(context.secrets);
  // might break so put it lower

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

  const accountTree = new AccountOptionsProvider();
  let view = vscode.window.createTreeView("account", {
    treeDataProvider: accountTree,
  });

  vscode.commands.registerCommand("readable.setLoggedIn", () => {
    status.updateStatusBar();
    view.message = "You have successfully logged in";
  });

  vscode.commands.registerCommand("readable.setLoggedOut", () => {
    status.updateStatusBar();
    view.message = "You are logged out";
  });

  vscode.commands.registerCommand("readable.openLink", async (args) => {
    await vscode.env.openExternal(vscode.Uri.parse(args));
  });

  const resyncOptionsProvider = new ResyncOptionsProvider(context);
  vscode.window.createTreeView("resync", {
    treeDataProvider: resyncOptionsProvider,
  });

  vscode.commands.registerCommand("readable.refreshResync", async () => {
    resyncOptionsProvider.refreshResync();
  });
  vscode.commands.registerCommand("readable.stopResync", async () => {
    resyncOptionsProvider.stopResync();
  });

  checkAccount();
}

export function deactivate() {} // make sure to log out here, and send an api request to delete the key with the token

export { logger };
