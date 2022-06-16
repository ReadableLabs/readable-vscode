// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import "isomorphic-fetch";
import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import CodeEditor from "./CodeEditor";
import { provideComments, provideDocstring } from "./completion/Completion";
import TrialHelper from "./trial/TrialHelper";
import { loginOptions, registerOptions } from "./authentication/Prompts";
import { emailLogin } from "./authentication/EmailLogin";
import { githubLogin } from "./authentication/GitHubLogin";
import { checkAccount, register, resetPassword } from "./authentication/Misc";
import { StatusBarProvider } from "./statusBar/StatusBarProvider";
import { HelpOptionsProvider } from "./sideBar/HelpOptionsProvider";
import {
  insertCommentCommand,
  insertDocstringCommand,
} from "./commands/commands";
import { Resync } from "./resync";
import { ResyncOptionsProvider } from "./sideBar/ResyncOptionsProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export async function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "Readable" is now active!');

  // Get the password for the readable account, if it exists, and if it doesn't, prompt the user for it.
  const status = new StatusBarProvider();

  const isEnabled = () => {
    // check if the extension is enabled
    return vscode.workspace
      .getConfiguration("readable")
      .get<boolean>("enableAutoComplete");
  };

  const helpTree = new HelpOptionsProvider();
  vscode.window.createTreeView("help", { treeDataProvider: helpTree });

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      [{ language: "python" }],
      {
        async provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position,
          token: vscode.CancellationToken,
          context: vscode.CompletionContext
        ) {
          if (!isEnabled()) {
            return;
          }
          const linePrefix = document
            .lineAt(position)
            .text.substring(0, position.character);

          const line = document.lineAt(position).text;

          try {
            if (
              linePrefix.includes("#") &&
              position.character > line.trimLeft().indexOf("#")
            ) {
              return new Promise<vscode.CompletionItem[] | undefined>(
                async (resolve, reject) => {
                  let updatedText =
                    vscode.window.activeTextEditor?.document.lineAt(
                      position
                    ).text;
                  if (updatedText === line) {
                    let comment = await provideComments(
                      position,
                      document,
                      "python"
                    );
                    resolve(comment);
                  } else {
                    resolve(undefined);
                  }
                }
              );
            } else {
              return undefined;
            }
          } catch (err: any) {
            console.log(err);
          }
        },
      },
      " ",
      ","
    ),

    vscode.languages.registerCompletionItemProvider(
      [
        { language: "javascript" },
        { language: "typescript" },
        { language: "cpp" },
        { language: "c" },
        { language: "csharp" },
        { language: "php" },
        { language: "java" },
        { language: "javascriptreact" },
        { language: "typescriptreact" },
        { language: "php" },
      ],
      {
        async provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position,
          token: vscode.CancellationToken,
          context: vscode.CompletionContext
        ) {
          let isEnabled = vscode.workspace // get the configuration
            .getConfiguration("readable")
            .get<boolean>("enableAutoComplete");
          if (!isEnabled || TrialHelper.TrialEnded) {
            return;
          }

          const linePrefix = document // get the line prefix
            .lineAt(position)
            .text.substring(0, position.character);

          const line = document.lineAt(position).text;

          try {
            if (
              line.includes("//") &&
              position.character > line.trimLeft().indexOf("//")
            ) {
              return new Promise<vscode.CompletionItem[] | undefined>(
                async (resolve, reject) => {
                  let updatedText =
                    vscode.window.activeTextEditor?.document.lineAt(
                      position
                    ).text;
                  let language = CodeEditor.getLanguageId();
                  if (updatedText === line) {
                    let comment = await provideComments(
                      position,
                      document,
                      language
                    );
                    resolve(comment);
                  } else {
                    resolve(undefined);
                  }
                }
              );
            } else {
              return undefined;
            }
          } catch (err: any) {
            console.log(err);
            vscode.window.showErrorMessage(err.message);
          }
        },
      },
      " ",
      ","
    ),
    vscode.commands.registerCommand(
      "readable.insertComment",
      insertCommentCommand
    ),

    vscode.commands.registerCommand(
      "readable.rightClickComment",
      insertDocstringCommand
    )
  );

  let authProvider = new CodeCommentAuthenticationProvider(context.secrets);

  context.subscriptions.push(
    vscode.authentication.registerAuthenticationProvider(
      CodeCommentAuthenticationProvider.id,
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
        CodeCommentAuthenticationProvider.id,
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

    vscode.commands.registerCommand("readable.version", async () => {
      const version = context.extension.packageJSON.version;
      if (!version) {
        vscode.window.showInformationMessage("Error: Unable to get version");
        return;
      }
      vscode.window.showInformationMessage(
        "Readable is currently on version " + version
      );
    }),

    vscode.commands.registerCommand("readable.register", async () => {
      const session = await vscode.authentication.getSession(
        CodeCommentAuthenticationProvider.id,
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
          CodeCommentAuthenticationProvider.id,
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
    CodeCommentAuthenticationProvider.id,
    [],
    { createIfNone: false }
  );

  const resyncOptionsProvider = new ResyncOptionsProvider(context);
  vscode.window.createTreeView("resync", {
    treeDataProvider: resyncOptionsProvider,
  });

  console.log(context.globalStorageUri.fsPath);

  checkAccount();
}

export function deactivate() {} // make sure to log out here, and send an api request to delete the key with the token
