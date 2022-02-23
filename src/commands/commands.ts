import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "../authentication/AuthProvider";
import CodeEditor from "../CodeEditor";
import { getCommentFromLine } from "../completion/formatUtils";
import {
  generateAutoComplete,
  generateDocstring,
} from "../completion/generate";
import { getSafeRange, newFormatText } from "../completion/utils";
import { createSelection, removeSelections } from "../selectionTools";
import { IInsertArgs } from "./interfaces";

export const insertDocstringCommand = async () => {
  const session = await vscode.authentication.getSession(
    CodeCommentAuthenticationProvider.id,
    [],
    { createIfNone: false }
  );
  if (!session) {
    vscode.window.showErrorMessage("Readable: Please log in");
    return;
  }
  vscode.window.withProgress(
    {
      title: "Readable: Generating Docstring...",
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
          let language = CodeEditor.getLanguageId();
          if (CodeEditor.hasSelection()) {
            fullCode = CodeEditor.getSelectedText(); // split by \n and then check for out of range, and make codeSpaces the first line of the selection
            const selection = CodeEditor.getSelection();
            _position = selection.start.line - 1;
            codeSpaces = CodeEditor.getSpacesFromLine(selection.start.line);
          } else {
            const position = CodeEditor.getCursor();
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
            fullCode = await CodeEditor.getFirstAndLastText(symbol);
            codeSpaces = CodeEditor.getSpacesFromLine(symbol.range.start.line);
            console.log(codeSpaces);
            _position = symbol.range.start.line - 1; // TODO: check for line count
            console.log(codeSpaces);
            // fullCode = await CodeEditor.getTextFromSymbol(symbol);
            // console.log(fullCode);
          }
          let docstring = await generateDocstring(
            fullCode,
            language,
            "",
            session.accessToken
          );
          let newFormattedText = newFormatText(docstring, codeSpaces, language);
          CodeEditor.insertTextAtPosition(
            newFormattedText,
            new vscode.Position(
              language === "python" ? _position + 2 : _position + 1,
              0
            )
          );
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

export const insertCommentCommand = (args: IInsertArgs) => {
  vscode.window.withProgress(
    {
      title: "Readable: Generating an Inline Comment",
      location: vscode.ProgressLocation.Notification,
      cancellable: true,
    },
    (progress, token) => {
      const p = new Promise<void>(async (resolve, reject) => {
        try {
          const position = args.cursor as vscode.Position;
          const document = args.document as vscode.TextDocument;
          const session = await vscode.authentication.getSession(
            CodeCommentAuthenticationProvider.id,
            [],
            { createIfNone: false }
          );

          if (!session) {
            vscode.window.showErrorMessage("Readable: Please log in");
            resolve();
            return;
          }

          let codeSymbol = await CodeEditor.getOrCreateSymbolUnderCursor(
            args.cursor,
            document.lineCount
          );

          if (!codeSymbol) {
            // show an error
            resolve();
            return;
          }

          let { startLine, endLine } = getSafeRange(
            args.cursor.line,
            codeSymbol.range.start.line,
            codeSymbol.range.end.line,
            document.lineCount
          );

          let code = await CodeEditor.getTextInRange(
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

          console.log(args);
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
          let data = await generateAutoComplete(
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
          await CodeEditor.insertTextAtPosition(data.trim(), args.cursor);
          console.log("inserted comment");
          resolve();
        } catch (err: any) {
          if (err.message) {
            vscode.window.showErrorMessage("An error has occurred");
            vscode.window.showErrorMessage(err.message);
          }
          resolve();
          console.log(err);
        }
      });
      return p;
    }
  );
};
