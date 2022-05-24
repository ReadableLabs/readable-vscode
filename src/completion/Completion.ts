import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "../authentication/AuthProvider";
import CodeEditor from "../CodeEditor";
import { generateDocstring } from "./generate";
import { getFunctionName, getSafeEndPosition, getSafeLine } from "./utils";

export const provideDocstring = async (
  position: vscode.Position,
  document: vscode.TextDocument,
  language: string = "normal"
) => {
  try {
    const session = await vscode.authentication.getSession(
      CodeCommentAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );
    if (!session) {
      return undefined;
    }

    // Get the line number of the cursor position, and make sure it's not out of range.
    let codeSymbol = await CodeEditor.getSymbolUnderCusor(
      new vscode.Position(
        getSafeLine(position.line, document.lineCount),
        position.character
      )
    );

    // No symbol under cursor, try to find the first symbol in the document.
    if (!codeSymbol) {
      vscode.window.showErrorMessage(
        "Error: Unable to find symbol under cursor"
      );
      return;
    }

    let functionName = "";

    // Get the function name for the language.
    if (language === "python") {
      functionName = getFunctionName(document, codeSymbol);
    }

    // Get the end line of the code block
    let endLine = getSafeEndPosition(
      position.line,
      codeSymbol.range.end.line,
      document.lineCount
    );

    let fullCode = document.getText(
      new vscode.Range(codeSymbol.range.start, new vscode.Position(endLine, 0))
    );

    // Generate the docstring for the code
    let generatedDocstring = await generateDocstring(
      fullCode,
      language,
      functionName,
      session.accessToken
    );

    console.log(generatedDocstring);

    if (!generatedDocstring) {
      vscode.window.showWarningMessage("No docstring was able to be generated");
      return undefined;
    }

    if (language === "python") {
      // If it is not properly formatted, then we will not add the comment to the code.
      generatedDocstring = "\n" + generatedDocstring;

      // check if comment is formatted properly
      if (!generatedDocstring.endsWith('"""')) {
        generatedDocstring += '"""';
      }
    }

    let completionItem = new vscode.CompletionItem(
      generatedDocstring,
      vscode.CompletionItemKind.Text
    );
    completionItem.preselect = true;

    return [completionItem];
  } catch (err: any) {
    console.log(err.response);
    vscode.window.showErrorMessage(err.message);
  }
};

/**
 * Provides comments for the given position in the given document.
 * @param {vscode.Position} position - the position to provide comments for.
 * @param {vscode.TextDocument} document - the document to provide comments for.
 * @param {string} language - the language of the document.
 * @returns {vscode.CompletionItem[]} - the array of completion items.
 */
export const provideComments = async (
  position: vscode.Position,
  document: vscode.TextDocument,
  language: string = "normal"
) => {
  try {
    // create a completion item for the completion
    let completion = new vscode.CompletionItem(
      "...",
      vscode.CompletionItemKind.Text
    );
    completion.detail = "Readable";
    completion.insertText = "";
    completion.command = {
      command: "readable.insertComment",
      title: "Insert Comment",
      arguments: [
        {
          document: document,
          cursor: position,
          language: language,
        },
      ],
      tooltip: "Insert Comment",
    };
    return [completion];
  } catch (err: any) {
    vscode.window.showErrorMessage(err.response);
    console.log(err.response);
  }
};
