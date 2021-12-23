// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import "isomorphic-fetch";
import * as vscode from "vscode";
import axios from "axios";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import Commands from "./commands";
import CodeEditor from "./CodeEditor";
import TextGenerator from "./TextGenerator";
import { provideComments } from "./Completion";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "commentai" is now active!');

  let editor = vscode.window.activeTextEditor;

  const isEnabled = () => {
    return vscode.workspace
      .getConfiguration("readable")
      .get<boolean>("enableAutoComplete");
  };

  const pythonProvider = vscode.languages.registerCompletionItemProvider(
    // register a completion item provider
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
    // "javascript",
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
        if (!linePrefix.endsWith("//")) {
          // if it doesn't end with a comment
          return undefined;
        } else {
          try {
            return await provideComments(position, document);
          } catch (err: any) {
            console.log(err);
            vscode.window.showErrorMessage(err);
          }
        }
      },
    },
    "/"
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
    vscode.commands.registerCommand("readable.login", Commands.loginCommand),
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
    // vscode.commands.registerCommand("commentai.rightClickComment", async () => {
    //   const session = await vscode.authentication.getSession(
    //     CodeCommentAuthenticationProvider.id,
    //     [],
    //     { createIfNone: true }
    //   );
    //   if (!session) {
    //     vscode.window.showErrorMessage("Error: Please login.");
    //     return;
    //   }
    //   vscode.window.withProgress(
    //     {
    //       cancellable: true,
    //       location: vscode.ProgressLocation.Notification,
    //       title: "Generating Comment",
    //     },
    //     (progress, token) => {
    //       const p = new Promise<void>(async (resolve, reject) => {
    //         try {
    //           let selectedCode: string | null;
    //           let spaces: number | null;
    //           let startPosition: vscode.Position | null;
    //           if (codeEditor.hasSelection()) {
    //             let selection = codeEditor.getSelection();
    //             selectedCode = codeEditor.getTextFromSelection(selection);
    //             spaces = selectedCode.search(/\S/);
    //             startPosition = selection.start;
    //           } else {
    //             let selectedSymbol = await codeEditor.getSymbolUnderCusor();
    //             selectedCode = codeEditor.getTextFromSymbol(selectedSymbol);
    //             spaces = selectedSymbol.range.start.character;
    //             startPosition = selectedSymbol.range.start;
    //           }
    //           let language = codeEditor.getLanguageId();
    //           if (token.isCancellationRequested) {
    //             return;
    //           }
    //           // const generatedComment = await textGenerator.generateSummary(
    //           //   selectedCode,
    //           //   language,
    //           //   session.accessToken
    //           // );
    //           const generatedComment = await textGenerator.generateComment(
    //             selectedCode,
    //             language,
    //             session.accessToken
    //           );
    //           if (token.isCancellationRequested) {
    //             return;
    //           }
    //           let formattedComment = codeEditor.formatText(
    //             // add a check to see if the string it returns is empty, and show a warning or error
    //             generatedComment,
    //             spaces
    //           );
    //           if (token.isCancellationRequested) {
    //             return;
    //           }
    //           await codeEditor.insertTextAtPosition(
    //             formattedComment,
    //             startPosition
    //             // selectedSymbol.range.start
    //           );
    //           resolve();
    //         } catch (err: any) {
    //           console.log(err);
    //           vscode.window.showErrorMessage(err.toString());
    //           reject();
    //         }
    //       });
    //       return p;
    //     }
    //   );
    // }),

    vscode.commands.registerCommand(
      "readable.register",
      authProvider.registerAccount
    )
  );
  // vscode.commands.registerCommand(
  //   "commentai.generateSummaryComment",
  //   async () => {
  //     const session = await vscode.authentication.getSession(
  //       CodeCommentAuthenticationProvider.id,
  //       [],
  //       { createIfNone: true }
  //     );
  //     if (!session) {
  //       vscode.window.showErrorMessage("Error: Please login.");
  //     }
  //     vscode.window.withProgress(
  //       {
  //         cancellable: true,
  //         title: "Generating Comment",
  //         location: vscode.ProgressLocation.Notification,
  //       },
  //       (progress: vscode.Progress<{}>, token: vscode.CancellationToken) => {
  //         let p = new Promise<void>(async (resolve, reject) => {
  //           try {
  //             console.log("generating");
  //             let text = codeEditor.getSelectedText();
  //             // let spaces = /^\s/.test(text);
  //             let spaces = text.search(/\S/);
  //             console.log(spaces); // -1
  //             let selection = codeEditor.getSelection();
  //             let language = codeEditor.getLanguageId();
  //             if (token.isCancellationRequested) {
  //               return;
  //             }
  //             let generatedComment = await textGenerator.generateSummary(
  //               text,
  //               language,
  //               session.accessToken
  //             );
  //             let formattedText = codeEditor.formatText(
  //               generatedComment,
  //               spaces
  //             );
  //             console.log(formattedText);

  //             if (token.isCancellationRequested) {
  //               return;
  //             }
  //             await codeEditor.insertTextAtPosition(
  //               formattedText,
  //               selection.start
  //             );
  //             console.log("generated");
  //             resolve();
  //             // call the comment generation function withb the comment type
  //             // todo: get inline comments working
  //           } catch (err: any) {
  //             vscode.window.showErrorMessage(err.toString());
  //             console.log(err);
  //             reject();
  //           }
  //         });
  //         return p;
  //       }
  //     );
  //   }
  // );

  const session = await vscode.authentication.getSession(
    CodeCommentAuthenticationProvider.id,
    [],
    { createIfNone: false }
  );
  if (!session) {
    const result = await vscode.window.showInformationMessage(
      "No account detected. Make an account or login to use Readable.",
      "Log In With GitHub",
      "Sign up with Email"
    );
    if (!result) return;
    if (result === "Log In With GitHub") {
      // if the user chooses to log in with GitHub
      await vscode.commands.executeCommand("readable.login");
    } else if (result === "Sign up with Email") {
      // if the user chooses to sign up with email
      await vscode.commands.executeCommand("readable.register");
    }
  }

  // context.subscriptions.push(statusBarProvider.myStatusBar);
}

// this method is called when your extension is deactivated
export function deactivate() {} // make sure to log out here, and send an api request to delete the key with the token
