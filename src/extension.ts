import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import CodeEditor from "./CodeEditor";
import TrialHelper from "./trial/TrialHelper";
import { loginOptions, registerOptions } from "./authentication/Prompts";
import { emailLogin } from "./authentication/EmailLogin";
import { githubLogin } from "./authentication/GitHubLogin";
import { checkAccount, register, resetPassword } from "./authentication/Misc";
import { StatusBarProvider } from "./statusBar/StatusBarProvider";
import { HelpOptionsProvider } from "./sideBar/HelpOptionsProvider";
import { Resync } from "./resync";
import { ResyncOptionsProvider } from "./sideBar/ResyncOptionsProvider";
import { inlineProvider } from "./completion/providers";
import {
  insertDocstringCommand,
  insertInlineCommentCommand,
} from "./completion/commands";

export async function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "Readable" is now active!');

  let authProvider = new CodeCommentAuthenticationProvider(context.secrets);

  context.subscriptions.push(
    inlineProvider,

    vscode.commands.registerCommand(
      "readable.insertInlineComment",
      insertInlineCommentCommand
    ),

    vscode.commands.registerCommand(
      "readable.rightClickComment",
      insertDocstringCommand
    )
  );

  vscode.commands.registerCommand(
    "readable.regenerateComment",
    async (args: any) => {
      // Open the file in VS Code
      await vscode.commands.executeCommand(
        "vscode.open",
        vscode.Uri.file(args.relativePath)
      );
      let editor = vscode.window.activeTextEditor;

      // If no editor is open, we can't navigate to the file.
      if (!editor) {
        vscode.window.showErrorMessage("Failed to navigate to file");
        return;
      }
      let range = new vscode.Range(
        new vscode.Position(args.commentBounds.end, 0),
        new vscode.Position(args.commentBounds.end, 0)
      );

      // Reveal the range in the editor, and select it.
      editor?.revealRange(range, vscode.TextEditorRevealType.InCenter);

      editor.selection = new vscode.Selection(range.start, range.end);

      let oldCommentRange = new vscode.Range(
        new vscode.Position(args.commentBounds.start - 1, 0),
        new vscode.Position(args.commentBounds.end, 0)
      );

      //Deletes old comment
      let edit = new vscode.WorkspaceEdit();
      edit.delete(editor.document.uri, oldCommentRange);
      vscode.workspace.applyEdit(edit);

      //Generates new docstring
      vscode.commands.executeCommand("readable.rightClickComment");
    }
  );

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

  vscode.commands.registerCommand("readable.version", async () => {
    // resyncOptionsProvider.resync?.checkProject();
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

  const helpTree = new HelpOptionsProvider();
  vscode.window.createTreeView("help", { treeDataProvider: helpTree });

  const resyncOptionsProvider = new ResyncOptionsProvider(context);
  vscode.window.createTreeView("resync", {
    treeDataProvider: resyncOptionsProvider,
  });

  checkAccount();
}

export function deactivate() {} // make sure to log out here, and send an api request to delete the key with the token
