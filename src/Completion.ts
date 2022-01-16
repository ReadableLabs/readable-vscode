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
      // get session
      CodeCommentAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );
    if (!session) {
      return undefined;
    }

    let codeSymbol = await codeEditor.getSymbolUnderCusor(
      new vscode.Position(
        getSafeLine(position.line, document.lineCount),
        position.character
      )
    );

    if (!codeSymbol) {
      vscode.window.showErrorMessage(
        "Error: unable to find symbol under cursor"
      );
      return;
    }

    let functionName = "";

    if (language === "python") {
      functionName = getFunctionName(document, codeSymbol);
    }

    let endLine = getSafeEndPosition(
      position.line,
      codeSymbol.range.end.line,
      document.lineCount
    );

    let fullCode = document.getText(
      new vscode.Range(codeSymbol.range.start, new vscode.Position(endLine, 0)) // get the full code
    );

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
      generatedDocstring = "\n" + generatedDocstring;

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
    vscode.window.showErrorMessage(err);
  }
};

// provides comments for the editor
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
      // if there isn't a session, we can't do anything
      vscode.window.showErrorMessage("Error: Please log in");
      return;
    }

    // needed for range
    let codeSymbol = await codeEditor.getOrCreateSymbolUnderCursor(
      position,
      document.lineCount
    );

    console.log(codeSymbol);

    if (!codeSymbol) {
      return;
    }

    let { startLine, endLine } = getSafeRange(
      position.line,
      codeSymbol.range.start.line,
      codeSymbol.range.end.line,
      document.lineCount
    );

    // get the range from startLine to endLine
    let code = await codeEditor.getTextInRange(
      new vscode.Range( // create a range
        new vscode.Position(startLine, 0), // start at the beginning of the line
        new vscode.Position(endLine, position.character)
      )
    );

    console.log(code);

    // const fullCode = getFormattedCode(document, position, code);

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

    const autoCode = codeEditor
      .getTextInRange(
        new vscode.Range(
          new vscode.Position(getSafePromptPosition(position.line), 0),
          position
        )
      )
      .trimRight();

    let data = await generateAutoComplete(
      autoCode,
      fullCode,
      language,
      session.accessToken
    );
    // const { data } = await axios.post(
    //   // send the code to the server
    //   "https://api.readable.so/complete/autocomplete/",
    //   {
    //     full_code: full_code,
    //     code: autoCode,
    //     language: language,
    //   },
    //   {
    //     headers: {
    //       Authorization: `Token ${session.accessToken}`,
    //     },
    //   }
    // );
    if (
      // if the comment is empty, return an empty completion item
      data === "" ||
      data.includes("<--") ||
      data.includes("TODO")
    ) {
      let result = vscode.window.showWarningMessage(
        "No comment was able to be generated."
      );
      return [new vscode.CompletionItem("")];
    }
    let completion = new vscode.CompletionItem(
      data.trimLeft(),
      vscode.CompletionItemKind.Text
    );
    completion.detail = "Readable";
    return [completion]; // return the completion list
  } catch (err: any) {
    // if there is an error, show the error message
    vscode.window.showErrorMessage(err.response);
    console.log(err.response);
  }
};
