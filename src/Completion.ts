import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import CodeEditor from "./CodeEditor";
import axios from "axios";
import { posix } from "path";

const codeEditor = new CodeEditor();

const nthIndex = (str: string, pat: string, n: number) => {
  // so glad I didn't have to write this
  let L = str.length,
    i = -1;
  while (n-- && i++ < L) {
    i = str.indexOf(pat, i);
    if (i < 0) break;
  }
  return i;
};

export const provideCommentsPython = async (position: vscode.Position) => {
  const session = await vscode.authentication.getSession(
    CodeCommentAuthenticationProvider.id,
    [],
    { createIfNone: false }
  );
  if (!session) {
    return;
  }
  console.log("something python");
};

export const provideComments = async (
  position: vscode.Position,
  document: vscode.TextDocument,
  _language?: string
) => {
  try {
    // get session
    const session = await vscode.authentication.getSession(
      CodeCommentAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );

    // if no session, show error message
    if (!session) {
      vscode.window.showErrorMessage("Error: no session");
      return;
    }

    console.log("something");

    let allSymbols = await codeEditor.getAllSymbols(); // get all symbols

    console.log(allSymbols);

    const full_codeSymbol = await codeEditor.getSymbolUnderCusor();

    let startLine: number, endLine: number;

    startLine = // the start line
      full_codeSymbol.range.start.line < position.line - 8
        ? position.line - 8
        : full_codeSymbol.range.start.line;

    endLine = // the end line
      full_codeSymbol.range.end.line > position.line + 16
        ? position.line + 16
        : full_codeSymbol.range.end.line;

    console.log(startLine);
    console.log(endLine);

    let full_code = await codeEditor.getTextInRange(
      // get the full code
      new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, 0)
      )
    );

    let fullCodeSplit = full_code.split("\n");

    let currentLine = document.lineAt(position.line).text;

    const lineNumber = fullCodeSplit.findIndex((value) => {
      // find the line number of the current line
      if (value === currentLine) {
        return true;
      }
    });

    if (lineNumber < 0) {
      vscode.window.showErrorMessage("Error: could not find line number");
      return;
    }

    console.log(lineNumber);

    fullCodeSplit[lineNumber] = fullCodeSplit[lineNumber]
      .slice(0, -2)
      .trimRight(); // remove the last two characters
    full_code = "";

    fullCodeSplit.map((item) => {
      full_code += item + "\n"; // add the line to the full code
    });

    const autoCode = codeEditor // get the code from the editor
      .getTextInRange(
        new vscode.Range(new vscode.Position(startLine, 0), position)
      )
      .trimRight();
    console.log(autoCode);
    console.log("ok----");
    console.log(full_code);
    const language = _language ? _language : "normal";
    const { data } = await axios.post(
      "https://api.readable.so/complete/autocomplete/",
      {
        full_code: full_code,
        code: autoCode,
        language: language,
      },
      {
        headers: {
          Authorization: `Token ${session.accessToken}`,
        },
      }
    );
    if (
      // if no comment was able to be generated
      data.includes("comment describing what the code below does") ||
      data.includes(
        "comment describing what the code above does" || data === ""
      )
    ) {
      // show an error message
      let result = vscode.window.showWarningMessage(
        "No comment was able to be generated."
      );
      return [new vscode.CompletionItem("")];
    }
    console.log(data);
    let completion = new vscode.CompletionItem( // create a completion item
      data,
      vscode.CompletionItemKind.Text
    );
    return [completion];
  } catch (err: any) {
    // show an error message
    vscode.window.showErrorMessage(err);
  }
};
