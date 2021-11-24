// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import "isomorphic-fetch";
import * as vscode from "vscode";
import axios from "axios";
import { CodeLensProvider } from "./codelens/CodeLensProvider";
import { getSymbols } from "./symbols";
import { GENERATING_NOTIFICATION_TEXT } from "./globals/consts";
import { StatusBarProvider } from "./statusbar/StatusBarProvider";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import { disableCodeLensCommand, enableCodeLensCommand } from "./commands";
import { GithubProvider } from "./authentication/GithubAuthProvider";
import CodeEditor from "./CodeEditor";
import { read } from "fs";
import TextGenerator from "./TextGenerator";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "commentai" is now active!');

  let editor = vscode.window.activeTextEditor;

  // const codeLensProvider = new CodeLensProvider();
  const statusBarProvider = new StatusBarProvider();
  const codeEditor = new CodeEditor(editor);
  const textGenerator = new TextGenerator();
  // const githubProvider = new GithubProvider();

  context.subscriptions.push(
    vscode.authentication.registerAuthenticationProvider(
      CodeCommentAuthenticationProvider.id,
      "Readable-Auth",
      new CodeCommentAuthenticationProvider(context.secrets)
    )
  );

  // vscode.languages.registerCodeLensProvider("*", codeLensProvider);
  // todo: make this just generate a key and not prompt the user for authentication
  // try {
  //   const session = await vscode.authentication.getSession(
  //     CodeCommentAuthenticationProvider.id,
  //     [],
  //     { createIfNone: true }
  //   );
  //   console.log(session);
  // } catch (err) {
  //   console.log(err);
  //   vscode.window.showErrorMessage(
  //     "Error logging in with Readable. To log in, open the command palette and type 'Readable: Login''",
  //     "Don't show again"
  //   );
  // }

  context.subscriptions.push(
    vscode.commands.registerCommand("commentai.helloWorld", async () => {
      let symbols = await codeEditor.getAllSymbols();
      console.log(symbols);
    }),
    vscode.commands.registerCommand("commentai.login", async () => {
      const session = await vscode.authentication.getSession(
        CodeCommentAuthenticationProvider.id,
        [],
        { createIfNone: true }
      );
      console.log(session);
    })
  );

  vscode.commands.registerCommand(
    "commentai.generateSummaryComment",
    async () => {
      const session = await vscode.authentication.getSession(
        CodeCommentAuthenticationProvider.id,
        [],
        { createIfNone: true }
      );
      console.log(session);
      return;
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
                language
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

  let generate = vscode.commands.registerCommand(
    "commentai.generateComment",
    async () => {
      vscode.window.withProgress(
        {
          cancellable: false,
          title: "Generating comment",
          location: vscode.ProgressLocation.Notification,
        },
        (progress, token) => {
          let p = new Promise<void>(async (resolve, reject) => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
              return;
            }
          });
          return p;
        }
      );
      // vscode.window.withProgress(
      //   {
      //     cancellable: false,
      //     title: GENERATING_NOTIFICATION_TEXT,
      //     location: vscode.ProgressLocation.Notification,
      //   },
      //   (progress, token) => {
      //     let p = new Promise<void>(async (resolve, reject) => {
      //       let editor = vscode.window.activeTextEditor;
      //       if (!editor) return;
      //       let selection = editor.selection;
      //       let text = editor.document.getText(selection);
      //       let generatedComment = await commentProvider.generateComment(
      //         text,
      //         editor.document.languageId,
      //         12
      //       ); // default for now, get the symbol in range of this for later
      //       await insertComment(
      //         new vscode.Position(
      //           editor.selection.start.line,
      //           editor.selection.start.character
      //         ),
      //         generatedComment,
      //         editor
      //       );
      //     });
      //     return p;
      //   }
      // );
    }
  );

  vscode.commands.registerCommand("commentai.commentFile", async () => {
    throw new Error("Error: Not implemented");
  });

  context.subscriptions.push(generate, statusBarProvider.myStatusBar);
}

// this method is called when your extension is deactivated
export function deactivate() {} // make sure to log out here, and send an api request to delete the key with the token
