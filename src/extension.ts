// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import "isomorphic-fetch";
import * as vscode from "vscode";
import axios from "axios";
import { CodeLensProvider } from "./CodeLensProvider";
import {
  getLanguageId,
  getTextRange,
  insertComment,
} from "./comment/commentTools";
import { getSymbols } from "./symbols";
import { CommentProvider } from "./generation/CommentProvider";
import { GENERATING_NOTIFICATION_TEXT } from "./globals/consts";
import { StatusBarProvider } from "./statusbar/StatusBarProvider";
import { HelloWorldPanel } from "./HelloWorldPanel";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import { disableCodeLensCommand, enableCodeLensCommand } from "./commands";
import { GithubProvider } from "./authentication/GithubAuthProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "commentai" is now active!');

  const codeLensProvider = new CodeLensProvider();
  const commentProvider = new CommentProvider();
  const statusBarProvider = new StatusBarProvider();
  // const githubProvider = new GithubProvider();

  context.subscriptions.push(
    vscode.authentication.registerAuthenticationProvider(
      CodeCommentAuthenticationProvider.id,
      "Readable-Auth",
      new CodeCommentAuthenticationProvider(context.secrets)
    )
  );

  vscode.languages.registerCodeLensProvider("*", codeLensProvider);
  try {
    const session = await vscode.authentication.getSession(
      CodeCommentAuthenticationProvider.id,
      [],
      { createIfNone: true }
    );
    console.log(session);
  } catch (err) {
    vscode.window.showErrorMessage(
      "Error logging in with Readable. To log in, press ctrl + shift + p and type 'Readable: Login'"
    );
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "commentai.enableCodeLens",
      enableCodeLensCommand
    ),

    vscode.commands.registerCommand(
      "commentai.disableCodeLens",
      disableCodeLensCommand
    ),

    vscode.commands.registerCommand("commentai.parseFile", async () => {
      // get something which gets triggered when the document changes and check the language then with the imports
      console.log("we're not using antlr over here buddy");
    }),

    vscode.commands.registerCommand("commentai.helloWorld", async () => {
      HelloWorldPanel.createOrShow(context.extensionUri);
    }),

    vscode.commands.registerCommand("commentai.login", async () => {
      // const session = await githubProvider.lib();
      const session = await vscode.authentication.getSession(
        CodeCommentAuthenticationProvider.id,
        [],
        { createIfNone: true }
      );
      console.log(session);
      // const session = await vscode.authentication.getSession(
      //   CodeCommentAuthenticationProvider.id,
      //   [],
      //   { createIfNone: true }
      // );
      // console.log(session);
    })
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let generate = vscode.commands.registerCommand(
    "commentai.generateComment",
    async () => {
      vscode.window.withProgress(
        {
          cancellable: false,
          title: GENERATING_NOTIFICATION_TEXT,
          location: vscode.ProgressLocation.Notification,
        },
        (progress, token) => {
          let p = new Promise<void>(async (resolve, reject) => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) return;
            let selection = editor.selection;
            let text = editor.document.getText(selection);
            let generatedComment = await commentProvider.generateComment(
              text,
              editor.document.languageId,
              12
            ); // default for now, get the symbol in range of this for later
            await insertComment(
              new vscode.Position(
                editor.selection.start.line,
                editor.selection.start.character
              ),
              generatedComment
            );
          });
          return p;
        }
      );
    }
  );

  vscode.commands.registerCommand("commentai.commentFile", async () => {
    let symbols: vscode.SymbolInformation[] | undefined = await getSymbols();
    if (symbols === undefined) {
      // show error message
      return;
    }
    symbols.forEach((value) => {});
  });

  interface ICodeLensAction {
    range: vscode.Range;
    kind: vscode.SymbolKind;
  }

  vscode.commands.registerCommand(
    "commentai.codelensAction",
    async ({ range, kind }: ICodeLensAction) => {
      vscode.window.withProgress(
        {
          cancellable: true,
          title: "Generating Comment",
          location: vscode.ProgressLocation.Notification,
        },
        async (process, token) => {
          let p = new Promise<void>(async (resolve, reject) => {
            try {
              let userCode = getTextRange(range);
              let language = getLanguageId();
              if (userCode === "" || language === "") {
                reject("No language");
              }
              let generatedComment = await commentProvider.generateComment(
                userCode,
                language,
                kind
              );
              await insertComment(
                new vscode.Position(range.start.line, range.start.character),
                generatedComment
              );
              resolve();
            } catch (err) {
              reject("Error Generating comment");
            }
          });
          return p;
        }
      );
    }
  );

  vscode.commands.registerCommand("commentai.statusBarClicked", async () => {
    let command = await statusBarProvider.showMenu();
    console.log(command);
  });

  context.subscriptions.push(generate, statusBarProvider.myStatusBar);
}

// this method is called when your extension is deactivated
export function deactivate() {} // make sure to log out here, and send an api request to delete the key with the token
