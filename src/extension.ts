// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import "isomorphic-fetch";
import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import CodeEditor from "./CodeEditor";
import TextGenerator from "./TextGenerator";
import { provideComments, provideDocstring } from "./Completion";

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

  // register the completion item provider
  const pythonProvider = vscode.languages.registerCompletionItemProvider(
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
  );

  const provider = vscode.languages.registerCompletionItemProvider(
    [
      { language: "javascript" },
      { language: "typescript" },
      { language: "cpp" },
      { language: "csharp" },
      { language: "php" },
      { language: "java" },
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
        if (!isEnabled) {
          return;
        }

        console.log("it is working");

        const linePrefix = document // get the line prefix
          .lineAt(position)
          .text.substring(0, position.character);

        console.log(linePrefix);

        try {
          if (linePrefix.endsWith("//")) {
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
  );

  const docstringProvider = vscode.languages.registerCompletionItemProvider(
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
        if (!isEnabled) {
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
  );

  const pythonDocstringProvider =
    vscode.languages.registerCompletionItemProvider(
      [{ language: "python" }],
      {
        async provideCompletionItems(document, position, token, context) {
          const isEnabled = vscode.workspace
            .getConfiguration("readable")
            .get<boolean>("enableAutoComplete");
          if (!isEnabled) {
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
    );

  const codeEditor = new CodeEditor(editor);
  const textGenerator = new TextGenerator();
  let authProvider = new CodeCommentAuthenticationProvider(context.secrets);

  context.subscriptions.push(
    // register the authentication provider
    vscode.authentication.registerAuthenticationProvider(
      CodeCommentAuthenticationProvider.id,
      "Readable-Auth",
      authProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("readable.login", async () => {
      await vscode.authentication.getSession(
        CodeCommentAuthenticationProvider.id,
        [],
        { createIfNone: true }
      );
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

  const session = await vscode.authentication.getSession(
    CodeCommentAuthenticationProvider.id,
    [],
    { createIfNone: false }
  );
  if (!session) {
    const result = await vscode.window.showInformationMessage(
      "No account detected. Make an account or login to use Readable.",
      "Log In",
      "Sign up"
    );
    if (!result) return;
    if (result === "Log In") {
      await vscode.commands.executeCommand("readable.login");
    } else if (result === "Sign up") {
      await vscode.commands.executeCommand("readable.register");
    }
  }

  // context.subscriptions.push(statusBarProvider.myStatusBar);
}

// this method is called when your extension is deactivated
export function deactivate() {} // make sure to log out here, and send an api request to delete the key with the token
