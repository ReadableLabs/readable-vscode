import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import CodeEditor from "./CodeEditor";
import axios from "axios";
import { checkSession } from "./authentication/Misc";
import {
  getFormattedCode,
  getFunctionName,
  getSafeEndPosition,
  getSafeLine,
  getSafePromptPosition,
  getSafeRange,
} from "./completion/utils";
import { generateAutoComplete, generateDocstring } from "./completion/generate";

const codeEditor = new CodeEditor();

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
    let codeSymbol = await codeEditor.getSymbolUnderCusor(
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
    const session = await vscode.authentication.getSession(
      CodeCommentAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );

    if (!session) {
      vscode.window.showErrorMessage("Readable: Please log in");
      return;
    }

    let codeSymbol = await codeEditor.getOrCreateSymbolUnderCursor(
      position,
      document.lineCount
    );

    if (!codeSymbol) {
      return;
    }

    let { startLine, endLine } = getSafeRange(
      position.line,
      codeSymbol.range.start.line,
      codeSymbol.range.end.line,
      document.lineCount
    );

    let code = await codeEditor.getTextInRange(
      new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(
          endLine,
          document.lineAt(endLine).range.end.character
        )
      )
    );

    console.log(code);

    const fullCode = code;

    if (!fullCode) {
      return;
    }

    // let fullCodeSplit = code.split("\n");

    // let currentLine = document.lineAt(position.line).text; // get the current line

    // const lineNumber = fullCodeSplit.findIndex((value) => {
    //   // find the line number of the current line
    //   if (value === currentLine) {
    //     return true;
    //   }
    // });

    // if (lineNumber < 0) {
    //   // if the line number is not found
    //   vscode.window.showErrorMessage("Error: could not find line number");
    //   return;
    // }

    // console.log(lineNumber);

    // fullCodeSplit[lineNumber] = fullCodeSplit[lineNumber]
    //   .slice(0, -2)
    //   .trimRight(); // remove the last two characters
    // full_code = "";

    // fullCodeSplit.map((item) => {
    //   // create a new string with the new line
    //   full_code += item + "\n";
    // });

    console.log(fullCode);
    let comments = [];
    let comment: string | null = "";
    if (language === "python") {
      comments = document.lineAt(position).text.split("#");
      comment =
        comments.length > 1 ? comments[comments.length - 1].trim() : null;
    } else {
      comments = document.lineAt(position).text.split("//");
      comment =
        comments.length > 1 ? comments[comments.length - 1].trim() : null;
    }
    if (!comment) {
      comment = "";
    }
    console.log(comment);

    // get the range of the code editor
    const autoCode = codeEditor
      .getTextInRange(
        new vscode.Range(
          new vscode.Position(getSafePromptPosition(position.line), 0),
          position
        )
      )
      .trimRight();

    // let data = await generateAutoComplete(
    //   fullCode,
    //   comment,
    //   language,
    //   session.accessToken
    // );
    // // const { data } = await axios.post(
    // //   // send the code to the server
    // //   "https://api.readable.so/complete/autocomplete/",
    // //   {
    // //     full_code: full_code,
    // //     code: autoCode,
    // //     language: language,
    // //   },
    // //   {
    // //     headers: {
    // //       Authorization: `Token ${session.accessToken}`,
    // //     },
    // //   }
    // // );
    // if (data === "" || data.includes("<--") || data.includes("TODO")) {
    //   // No comment was generated.
    //   let result = vscode.window.showWarningMessage(
    //     "No comment was able to be generated."
    //   );
    //   return [new vscode.CompletionItem("")];
    // }

    // create a completion item for the completion
    let completion = new vscode.CompletionItem(
      // data.trim(), // without spaces
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
          cursor: position,
          fullCode: fullCode,
          comment: comment,
          language: language,
          accessToken: session.accessToken,
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
