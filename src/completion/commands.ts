import * as vscode from "vscode";
import { ReadableAuthenticationProvider } from "../authentication/AuthProvider";
import CodeEditor from "../CodeEditor";
import { IInsertArgs } from "./interfaces";
import { generateInlineComment, generateDocstring } from "./generate";
import {
  hasSelection,
  getSafeRange,
  getCommentFromLine,
  formatComment,
  getFirstAndLastText,
} from "./utils";

export const insertInlineCommentCommand = (args: IInsertArgs) => {
  vscode.window.withProgress(
    {
      title: "Readable: Generating inline comment...",
      location: vscode.ProgressLocation.Notification,
      cancellable: true,
    },
    (progress, token) => {
      const p = new Promise<void>(async (resolve, reject) => {
        try {
          if (!vscode.window.activeTextEditor) {
            return;
          }

          const position = args.cursor as vscode.Position;
          const document = args.document as vscode.TextDocument;
          const session = await vscode.authentication.getSession(
            ReadableAuthenticationProvider.id,
            [],
            { createIfNone: false }
          );

          if (!session) {
            vscode.window.showErrorMessage(
              "Readable: Please log in to use inline comments"
            );
            resolve();
            return;
          }

          let codeSymbol = await CodeEditor.getOrCreateSymbolUnderCursor(
            args.cursor,
            document.lineCount
          );

          if (!codeSymbol) {
            resolve();
            return;
          }

          let { startLine, endLine } = getSafeRange(
            args.cursor.line,
            codeSymbol.range.start.line,
            codeSymbol.range.end.line,
            document.lineCount
          );

          let code = await vscode.window.activeTextEditor.document.getText(
            new vscode.Range(
              new vscode.Position(startLine, 0),
              new vscode.Position(
                endLine,
                document.lineAt(endLine).range.end.character
              )
            )
          );

          const line = document.lineAt(position).text;
          const comment = getCommentFromLine(line, document.languageId);

          if (token.isCancellationRequested) {
            resolve();
            return;
          }

          let fullCode = code;
          if (args.language === "python") {
            let fullCodeSplit = fullCode.split("\n");
            fullCodeSplit.map((line: any) => {
              if (line.includes("#")) {
                fullCode += line.substring(0, line.indexOf("#") + 1) + "\n";
              } else {
                fullCode += line + "\n";
              }
            });
          }
          let data = await generateInlineComment(
            fullCode,
            // args.fullCode,
            comment,
            document.languageId,
            session.accessToken
          );

          if (token.isCancellationRequested) {
            resolve();
            return;
          }
          if (
            data.trim() === "" ||
            data.includes("<--") ||
            data.includes("TODO")
          ) {
            // No comment was generated.
            let result = vscode.window.showWarningMessage(
              "No comment was able to be generated."
            );
            resolve();
            return;
          }

          if (token.isCancellationRequested) {
            resolve();
            return;
          }
          await vscode.window.activeTextEditor.edit((editBuilder) => {
            // insert the snippet
            editBuilder.insert(position, data.trim());
          });

          //   await CodeEditor.insertTextAtPosition(data.trim(), args.cursor);
          resolve();
        } catch (err: any) {
          if (err.message) {
            vscode.window.showErrorMessage("An error has occurred");
            vscode.window.showErrorMessage(err.message);
          }
          resolve();
        }
      });
      return p;
    }
  );
};

export const insertDocstringCommand = async () => {
  const session = await vscode.authentication.getSession(
    ReadableAuthenticationProvider.id,
    [],
    { createIfNone: false }
  );
  if (!session) {
    vscode.window.showErrorMessage(
      "Readable: Please log in to use docstring comments"
    );
    return;
  }
  vscode.window.withProgress(
    {
      title: "Readable: Generating docstring...",
      location: vscode.ProgressLocation.Notification,
      cancellable: false,
    },
    (progress, token) => {
      let p = new Promise<void>(async (resolve, reject) => {
        if (!vscode.window.activeTextEditor) {
          vscode.window.showErrorMessage(
            "Error: failed to get active text editor"
          );
          resolve();
          return;
        }
        try {
          let _position = 0;
          let codeSpaces = 0;
          let fullCode;
          let language = vscode.window.activeTextEditor.document.languageId;
          if (hasSelection()) {
            fullCode = vscode.window.activeTextEditor.document.getText(
              vscode.window.activeTextEditor.selection
            ); // split by \n and then check for out of range, and make codeSpaces the first line of the selection
            const selection = vscode.window.activeTextEditor.selection;
            _position = selection.start.line - 1;
            codeSpaces = CodeEditor.getSpacesFromLine(selection.start.line);
          } else {
            const position = vscode.window.activeTextEditor.selection.active;
            let symbol = await CodeEditor.getSymbolUnderCusor(position);
            if (!symbol) {
              vscode.window.showErrorMessage(
                "Error: Failed to find function. Highlight function instead."
              );
              resolve();
              return;
            }
            const startCharacter =
              vscode.window.activeTextEditor.document.lineAt(
                symbol.range.start.line
              ).firstNonWhitespaceCharacterIndex;

            const selectionRange = new vscode.Range(
              new vscode.Position(symbol.range.start.line, startCharacter),
              new vscode.Position(
                symbol.range.end.line,
                symbol.range.end.character
              )
            );

            await createSelection(selectionRange);
            setTimeout(async () => {
              await removeSelections();
            }, 200);
            fullCode = await getFirstAndLastText(symbol);
            codeSpaces = CodeEditor.getSpacesFromLine(symbol.range.start.line);
            _position = symbol.range.start.line - 1; // TODO: check for line count
          }

          let docstring = await generateDocstring(
            fullCode,
            language,
            "",
            session.accessToken
          );
          let formattedComment = formatComment(docstring, codeSpaces, language);
          await vscode.window.activeTextEditor.edit((editBuilder) => {
            // insert the snippet
            editBuilder.insert(
              new vscode.Position(
                language === "python" ? _position + 2 : _position + 1,
                0
              ),
              formattedComment
            );
          });

          resolve();
        } catch (err: any) {
          if (err.message) {
            vscode.window.showErrorMessage(err.message);
          }
          resolve();
        }
      });
      return p;
    }
  );
};

export const regenerateCommentCommand = async (args: any) => {
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
  vscode.commands.executeCommand("readable.insertDocstringComment");
};

const selectionColor = new vscode.ThemeColor("editor.selectionBackground");
const smallDecorator = vscode.window.createTextEditorDecorationType({
  overviewRulerColor: selectionColor,
  backgroundColor: selectionColor,
  overviewRulerLane: vscode.OverviewRulerLane.Left,
});

const createSelection = async (range: vscode.Range) => {
  await vscode.window.activeTextEditor?.setDecorations(smallDecorator, [range]);
};

const removeSelections = async () => {
  await vscode.window.activeTextEditor?.setDecorations(smallDecorator, []);
};
