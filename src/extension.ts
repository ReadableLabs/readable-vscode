// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import "isomorphic-fetch";
import * as vscode from "vscode";
import axios from "axios";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import Commands from "./commands";
import CodeEditor from "./CodeEditor";
import TextGenerator from "./TextGenerator";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "commentai" is now active!');

  let editor = vscode.window.activeTextEditor;

  const provider = vscode.languages.registerCompletionItemProvider(
    // "javascript",
    [
      { language: "javascript" },
      { language: "typescript" },
      { language: "cpp" },
      {
        language: "csharp",
      },
      {
        language: "go",
      },
      {
        language: "java",
      },
    ],
    {
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
      ) {
        const linePrefix = document
          .lineAt(position)
          .text.substring(0, position.character);
        if (!linePrefix.endsWith("//")) {
          return undefined;
        } else {
          const session = await vscode.authentication.getSession(
            CodeCommentAuthenticationProvider.id,
            [],
            { createIfNone: false }
          );
          if (!session) {
            return;
          }
          const full_codeSymbol = await codeEditor.getSymbolUnderCusor(); // show generating thing in bottom bar
          // const full_code = await codeEditor.getTextFromSymbol(full_codeSymbol); // make toggle to generate on and off from command
          let startLine: number, endLine: number;
          startLine =
            full_codeSymbol.range.start.line < position.line - 8
              ? position.line - 8
              : full_codeSymbol.range.start.line;
          endLine =
            full_codeSymbol.range.end.line > position.line + 16
              ? position.line + 16
              : full_codeSymbol.range.end.line;
          const full_code = await codeEditor.getTextInRange(
            new vscode.Range(
              new vscode.Position(startLine, 0),
              new vscode.Position(endLine, 0)
            ) // TODO: implement something which gets the starting character, not 0
          );
          console.log(full_code);
          // const selectedRange = codeEditor.getTextInRange();
          const autoCode = codeEditor // comment on bottom of IDE like the GitHub Copilot logo, but with Readable
            .getTextInRange(
              new vscode.Range(full_codeSymbol.range.start, position)
            )
            .trimRight();
          console.log(autoCode);
          // console.log(full_code);
          const { data } = await axios.post(
            "http://127.0.0.1:8000/complete/autocomplete/",
            {
              full_code: full_code,
              code: autoCode,
            },
            {
              headers: {
                Authorization: `Token ${session.accessToken}`,
              },
            }
          );
          if (
            data.includes("comment describing what the code below does") ||
            data.includes(
              "comment describing what the code above does" || data === ""
            )
          ) {
            let result = vscode.window.showWarningMessage(
              "No comment was able to be generated.",
              "Don't show again"
            );
            return [new vscode.CompletionItem("")];
          }
          console.log(data);
          let completion = new vscode.CompletionItem(
            data,
            vscode.CompletionItemKind.Text
          );
          return [completion];
        }
      },
    },
    "/"
  );

  // const codeLensProvider = new CodeLensProvider();
  // const statusBarProvider = new StatusBarProvider();
  const codeEditor = new CodeEditor(editor);
  const textGenerator = new TextGenerator();
  let authProvider = new CodeCommentAuthenticationProvider(context.secrets);
  // const githubProvider = new GithubProvider();

  context.subscriptions.push(
    vscode.authentication.registerAuthenticationProvider(
      CodeCommentAuthenticationProvider.id,
      "Readable-Auth",
      // new CodeCommentAuthenticationProvider(context.secrets)
      authProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("commentai.helloWorld", async () => {}),
    vscode.commands.registerCommand("commentai.login", Commands.loginCommand),
    vscode.commands.registerCommand(
      "commentai.resetPassword",
      authProvider.resetPassword
    ),
    vscode.commands.registerCommand(
      "commentai.rightClickCommentbackup",
      async () => {
        console.log("hello");
        const session = await vscode.authentication.getSession(
          CodeCommentAuthenticationProvider.id,
          [],
          { createIfNone: true }
        );
        if (!session) {
          vscode.window.showErrorMessage("Error: Please login");
          return;
        }
        vscode.window.withProgress(
          {
            cancellable: true,
            location: vscode.ProgressLocation.Notification,
            title: "Generating Comment",
          },
          (progress, token) => {
            const p = new Promise<void>(async (resolve, reject) => {
              let symbols = await codeEditor.getAllSymbols();
              console.log(symbols);
              vscode.window.showInformationMessage("done");
              resolve();
            });
            return p;
          }
        );
      }
    ),
    vscode.commands.registerCommand("commentai.rightClickComment", async () => {
      const session = await vscode.authentication.getSession(
        CodeCommentAuthenticationProvider.id,
        [],
        { createIfNone: true }
      );
      if (!session) {
        vscode.window.showErrorMessage("Error: Please login.");
        return;
      }
      vscode.window.withProgress(
        {
          cancellable: true,
          location: vscode.ProgressLocation.Notification,
          title: "Generating Comment",
        },
        (progress, token) => {
          const p = new Promise<void>(async (resolve, reject) => {
            try {
              let selectedCode: string | null;
              let spaces: number | null;
              let startPosition: vscode.Position | null;
              if (codeEditor.hasSelection()) {
                let selection = codeEditor.getSelection();
                selectedCode = codeEditor.getTextFromSelection(selection);
                spaces = selectedCode.search(/\S/);
                startPosition = selection.start;
              } else {
                let selectedSymbol = await codeEditor.getSymbolUnderCusor();
                selectedCode = codeEditor.getTextFromSymbol(selectedSymbol);
                spaces = selectedSymbol.range.start.character;
                startPosition = selectedSymbol.range.start;
              }
              let language = codeEditor.getLanguageId();
              if (token.isCancellationRequested) {
                return;
              }
              // const generatedComment = await textGenerator.generateSummary(
              //   selectedCode,
              //   language,
              //   session.accessToken
              // );
              const generatedComment = await textGenerator.generateComment(
                selectedCode,
                language,
                session.accessToken
              );
              if (token.isCancellationRequested) {
                return;
              }
              let formattedComment = codeEditor.formatText(
                // add a check to see if the string it returns is empty, and show a warning or error
                generatedComment,
                spaces
              );
              if (token.isCancellationRequested) {
                return;
              }
              await codeEditor.insertTextAtPosition(
                formattedComment,
                startPosition
                // selectedSymbol.range.start
              );
              resolve();
            } catch (err: any) {
              console.log(err);
              vscode.window.showErrorMessage(err.toString());
              reject();
            }
          });
          return p;
        }
      );
    }),

    vscode.commands.registerCommand(
      "commentai.register",
      authProvider.registerAccount
    )
  );
  vscode.commands.registerCommand(
    "commentai.generateSummaryComment",
    async () => {
      const session = await vscode.authentication.getSession(
        CodeCommentAuthenticationProvider.id,
        [],
        { createIfNone: true }
      );
      if (!session) {
        vscode.window.showErrorMessage("Error: Please login.");
      }
      vscode.window.withProgress(
        {
          cancellable: true,
          title: "Generating Comment",
          location: vscode.ProgressLocation.Notification,
        },
        (progress: vscode.Progress<{}>, token: vscode.CancellationToken) => {
          let p = new Promise<void>(async (resolve, reject) => {
            try {
              console.log("generating");
              let text = codeEditor.getSelectedText();
              // let spaces = /^\s/.test(text);
              let spaces = text.search(/\S/);
              console.log(spaces); // -1
              let selection = codeEditor.getSelection();
              let language = codeEditor.getLanguageId();
              if (token.isCancellationRequested) {
                return;
              }
              let generatedComment = await textGenerator.generateSummary(
                text,
                language,
                session.accessToken
              );
              let formattedText = codeEditor.formatText(
                generatedComment,
                spaces
              );
              console.log(formattedText);

              if (token.isCancellationRequested) {
                return;
              }
              await codeEditor.insertTextAtPosition(
                formattedText,
                selection.start
              );
              console.log("generated");
              resolve();
              // call the comment generation function withb the comment type
              // todo: get inline comments working
            } catch (err: any) {
              vscode.window.showErrorMessage(err.toString());
              console.log(err);
              reject();
            }
          });
          return p;
        }
      );
    }
  );

  vscode.commands.registerCommand("commentai.commentFile", async () => {
    throw new Error("Error: Not implemented");
  });

  // context.subscriptions.push(statusBarProvider.myStatusBar);
}

// this method is called when your extension is deactivated
export function deactivate() {} // make sure to log out here, and send an api request to delete the key with the token
