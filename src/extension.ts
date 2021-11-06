// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import "isomorphic-fetch";
import * as vscode from "vscode";
import axios from "axios";
import { CodeLensProvider } from "./codelens/CodeLensProvider";
import {
  getLanguageId,
  getTextRange,
  insertComment,
} from "./comment/commentTools";
import { getSymbols } from "./symbols";
import { CommentProvider } from "./generation/CommentProvider";
import { GENERATING_NOTIFICATION_TEXT } from "./globals/consts";
import { StatusBarProvider } from "./statusbar/StatusBarProvider";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import { disableCodeLensCommand, enableCodeLensCommand } from "./commands";
import { GithubProvider } from "./authentication/GithubAuthProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "commentai" is now active!');

  // const codeLensProvider = new CodeLensProvider();
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

  // vscode.languages.registerCodeLensProvider("*", codeLensProvider);
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

    vscode.commands.registerCommand("commentai.login", async () => {
      const session = await vscode.authentication.getSession(
        CodeCommentAuthenticationProvider.id,
        [],
        { createIfNone: true }
      );
      console.log(session);
    })
  );

  interface IRange {
    parent: object;
    range: vscode.Range;
  }

  vscode.commands.registerCommand(
    "commentai.generateSummaryComment",
    async () => {
      try {
        console.log("ok");
        let editor = vscode.window.activeTextEditor;
        if (!editor?.selection.start || !editor.selection.end) {
          throw new Error("find me in the lcub");
        }
        let selectionRange = new vscode.Range(
          editor?.selection.start,
          editor?.selection.end
        );
        if (!editor) throw new Error("No editor");

        // console.log(editor.document.getText(editor.selection));
        // console.log(editor.selection.start);
        let hi =
          await vscode.commands.executeCommand<vscode.SemanticTokensLegend>(
            "vscode.provideDocumentRangeSemanticTokens",
            editor.document.uri,
            selectionRange
            // editor.document.uri
          );

        console.log(hi);

        // call the comment generation function withb the comment type
      } catch (err) {
        console.log(err);
      }
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
            if (!editor) return;
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
      // vscode.window.withProgress(
      //   {
      //     cancellable: true,
      //     title: "Generating Comment",
      //     location: vscode.ProgressLocation.Notification,
      //   },
      //   async (process, token) => {
      //     let p = new Promise<void>(async (resolve, reject) => {
      //       try {
      //         const editor = vscode.window.activeTextEditor;
      //         if (!editor) return;
      //         let userCode = getTextRange(range);
      //         let language = getLanguageId();
      //         if (userCode === "" || language === "") {
      //           reject("No language");
      //         }
      //         let generatedComment = await commentProvider.generateComment(
      //           userCode,
      //           language,
      //           kind
      //         );
      //         await insertComment(
      //           new vscode.Position(range.start.line, range.start.character),
      //           generatedComment,
      //           editor
      //         );
      //         resolve();
      //       } catch (err) {
      //         reject("Error Generating comment");
      //       }
      //     });
      //     return p;
      //   }
      // );
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
