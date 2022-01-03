// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import "isomorphic-fetch";
import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import CodeEditor from "./CodeEditor";
import TextGenerator from "./TextGenerator";
import { provideComments, provideDocstring } from "./Completion";
import { env } from "process";
import TrialHelper from "./trial/TrialHelper";
import { loginOptions } from "./authentication/Prompts";
import { emailLogin } from "./authentication/EmailLogin";
import { LoginOption } from "./authentication/types";
import { githubLogin } from "./authentication/GitHubLogin";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "commentai" is now active!');

  let editor = vscode.window.activeTextEditor;

  const isEnabled = () => {
    // check if the extension is enabled
    return vscode.workspace
      .getConfiguration("readable")
      .get<boolean>("enableAutoComplete");
  };

  context.subscriptions.push(
    // register the completion item provider
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
          if (!linePrefix.endsWith("#")) {
            return undefined;
          }
          try {
            return await provideComments(position, document, "python");
          } catch (err: any) {
            console.log(err);
            vscode.window.showErrorMessage(err);
          }
        },
      },
      "#"
    ),

    vscode.languages.registerCompletionItemProvider(
      [
        { language: "javascript" },
        { language: "typescript" },
        { language: "cpp" },
        { language: "csharp" },
        { language: "php" },
        { language: "java" },
        { language: "javascriptreact" },
        { language: "typescriptreact" },
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

          try {
            if (linePrefix.endsWith("//")) {
              console.log(linePrefix);
              return await provideComments(position, document);
            } else {
              return undefined;
            }
          } catch (err: any) {
            console.log(err);
            vscode.window.showErrorMessage(err);
          }
        },
      },
      "/"
    ),

    vscode.languages.registerCompletionItemProvider(
      [
        { language: "javascript" },
        { language: "typescript" },
        { language: "cpp" },
        { language: "csharp" },
        { language: "php" },
        { language: "java" },
      ],
      {
        async provideCompletionItems(document, position, token, context) {
          let isEnabled = vscode.workspace // get the configuration
            .getConfiguration("readable")
            .get<boolean>("enableAutoComplete");
          if (!isEnabled || TrialHelper.TrialEnded) {
            return;
          }

          console.log("it is working");

          const linePrefix = document // get the line prefix
            .lineAt(position)
            .text.substring(0, position.character);

          if (!linePrefix.endsWith("/**")) {
            return undefined;
          }
          console.log("working docstring things");
          return await provideDocstring(position, document);
        },
      },
      "*"
    ),

    vscode.languages.registerCompletionItemProvider(
      [{ language: "python" }],
      {
        async provideCompletionItems(document, position, token, context) {
          const isEnabled = vscode.workspace
            .getConfiguration("readable")
            .get<boolean>("enableAutoComplete");
          if (!isEnabled || TrialHelper.TrialEnded) {
            return;
          }

          const linePrefix = document
            .lineAt(position)
            .text.substring(0, position.character);

          if (!linePrefix.endsWith('"""')) {
            return;
          }

          try {
            return await provideDocstring(position, document, "python");
          } catch (err: any) {
            console.log(err);
            vscode.window.showErrorMessage(err);
          }

          return undefined;
        },
      },
      '"'
    )
  );

  const codeEditor = new CodeEditor(editor);
  const textGenerator = new TextGenerator();
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
      if (await authProvider.getSession()) {
        vscode.window.showInformationMessage("Already logged in!");
        return;
      }

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
      vscode.window.showInformationMessage("Successfully Logged In!");
    }),
    vscode.commands.registerCommand(
      "readable.resetPassword",
      authProvider.resetPassword
    ),
    vscode.commands.registerCommand("readable.enableAutoComplete", async () => {
      vscode.workspace
        .getConfiguration("readable")
        .update("enableAutoComplete", true, true);
    }),
    vscode.commands.registerCommand(
      "readable.disableAutoComplete",
      async () => {
        vscode.workspace
          .getConfiguration("readable")
          .update("enableAutoComplete", false, true);
      }
    ),

    vscode.commands.registerCommand(
      "readable.register",
      authProvider.registerAccount
    )
  );

  // await authProvider.checkAccount();

  // context.subscriptions.push(statusBarProvider.myStatusBar);
}

// this method is called when your extension is deactivated
export function deactivate() {} // make sure to log out here, and send an api request to delete the key with the token
