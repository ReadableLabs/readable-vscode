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
import {
  disableCodeLensCommand,
  enableCodeLensCommand,
  loginCommand,
} from "./commands";
import CodeEditor from "./CodeEditor";
import { read } from "fs";
import TextGenerator from "./TextGenerator";
import { resolve } from "path";
import { symbolKinds } from "./codelens/consts";

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
    vscode.commands.registerCommand("commentai.login", loginCommand),
    vscode.commands.registerCommand("commentai.rightClickComment", async () => {
      let selection = codeEditor.getSelection();
      console.log(selection);
      let symbols = await codeEditor.getAllSymbols();
      console.log(symbols);
      let position = codeEditor.getCursorPosition();
      if (
        selection.start.line === selection.end.line &&
        selection.start.character === selection.end.character
      ) {
      }
      symbols.map((symbol) => {
        // if (symbol.kind === vscode.SymbolKind.Class) {
        //   symbol.children.map((_symbol) => {
        //     if (
        //       symbol.kind === vscode.SymbolKind.Method ||
        //       vscode.SymbolKind.Function ||
        //       vscode.SymbolKind.Constant
        //     ) {
        //     }
        //   });
        // }
        if (
          symbol.range.start.line <= position &&
          symbol.range.end.line &&
          position
        ) {
          console.log("found the symbol");
          console.log(symbol);
        }
      });
      vscode.window.showInformationMessage("done");
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

  context.subscriptions.push(statusBarProvider.myStatusBar);
}

// this method is called when your extension is deactivated
export function deactivate() {} // make sure to log out here, and send an api request to delete the key with the token
