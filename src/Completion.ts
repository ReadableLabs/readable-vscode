import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import CodeEditor from "./CodeEditor";
import axios from "axios";
import { posix } from "path";
import { TextDecoder } from "util";

const codeEditor = new CodeEditor();

export const provideDocstring = async (
  position: vscode.Position,
  document: vscode.TextDocument,
  _language?: string
) => {
  try {
    const session = await vscode.authentication.getSession(
      CodeCommentAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );

    if (!session) {
      vscode.window.showErrorMessage("Error: Please log in");
      return;
    }

    let full_codeSymbol = await codeEditor.getSymbolUnderCusor(
      new vscode.Position(
        position.line + 1 < document.lineCount
          ? position.line + 1
          : position.line,
        position.character
      )
    );

    if (!full_codeSymbol) {
      vscode.window.showErrorMessage("Error: unable to find symbol");
      return undefined;
    }

    const language = _language ? _language : "normal";

    let functionName = "";
    if (language === "python") {
      functionName = document.lineAt(full_codeSymbol.range.start.line).text; // hacky solution for checking if there is a function or an attribute
      if (!functionName.includes("def")) {
        functionName = document.lineAt(
          full_codeSymbol.range.start.line + 1
        ).text;
      }
      console.log(functionName);
    }

    let endLine = // get the end line
      full_codeSymbol.range.end.line > position.line + 16 &&
      position.line + 16 < document.lineCount
        ? position.line + 16
        : full_codeSymbol.range.end.line;

    let fullCode = document.getText(
      new vscode.Range(
        full_codeSymbol.range.start,
        new vscode.Position(endLine, 0)
      )
    );

    let { data } = await axios.post(
      "https://api.readable.so/complete/right-click/",
      {
        full_code: fullCode,
        language: language,
        python_functionName: functionName,
      },
      {
        headers: {
          Authorization: `Token ${session.accessToken}`,
        },
      }
    );

    console.log(data);

    if (!data) {
      vscode.window.showWarningMessage("No docstring was able to be generated");
      return undefined;
    }

    if (language === "python") {
      data = "\n" + data;
    }

    if (language === "python" && !data.endsWith('"""')) {
      data += '"""';
    }

    let completionItem = new vscode.CompletionItem(
      data,
      vscode.CompletionItemKind.Text
    );
    completionItem.preselect = true;

    return [completionItem];
  } catch (err: any) {
    console.log(err.response);
    vscode.window.showErrorMessage(err);
  }
};

export const provideComments = async (
  position: vscode.Position,
  document: vscode.TextDocument,
  _language?: string
) => {
  try {
    const session = await vscode.authentication.getSession(
      CodeCommentAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );

    if (!session) {
      vscode.window.showErrorMessage("Error: Please log in");
      return;
    }

    console.log("something");

    let allSymbols = await codeEditor.getAllSymbols(); // get all symbols

    console.log(allSymbols);

    let full_codeSymbol = await codeEditor.getSymbolUnderCusor(position);

    if (!full_codeSymbol) {
      full_codeSymbol = new vscode.DocumentSymbol(
        "CurrentLineSymbol",
        "The Symbol on the Current Line",
        vscode.SymbolKind.String,
        new vscode.Range(
          new vscode.Position(position.line - 1 > 0 ? position.line - 1 : 1, 0),
          new vscode.Position(
            position.line + 1 < document.lineCount
              ? position.line + 1
              : position.line,
            position.character
          )
        ),
        new vscode.Range(new vscode.Position(position.line, 0), position)
      );
      // create new symbol
      // throw new Error("Error: no symbol");
    }

    console.log(full_codeSymbol);

    let startLine: number, endLine: number;

    startLine = // get the start line
      full_codeSymbol.range.start.line < position.line - 8 &&
      position.line - 8 > 0
        ? position.line - 8
        : full_codeSymbol.range.start.line;

    endLine = // get the end line
      full_codeSymbol.range.end.line > position.line + 16 &&
      position.line + 16 < document.lineCount
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

    let currentLine = document.lineAt(position.line).text; // get the current line

    const lineNumber = fullCodeSplit.findIndex((value) => {
      // find the line number of the current line
      if (value === currentLine) {
        return true;
      }
    });

    if (lineNumber < 0) {
      // if the line number is not found
      vscode.window.showErrorMessage("Error: could not find line number");
      return;
    }

    console.log(lineNumber);

    fullCodeSplit[lineNumber] = fullCodeSplit[lineNumber]
      .slice(0, -2)
      .trimRight(); // remove the last two characters
    full_code = "";

    fullCodeSplit.map((item) => {
      // create a new string with the new line
      full_code += item + "\n";
    });

    const autoCode = codeEditor
      .getTextInRange(
        new vscode.Range(new vscode.Position(startLine, 0), position)
      )
      .trimRight(); // get the code from the editor
    console.log(autoCode);
    console.log("ok----");
    console.log(full_code);
    const language = _language ? _language : "normal";
    const { data } = await axios.post(
      // send the code to the server
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
      // if the comment is empty, return an empty completion item
      data === "" ||
      data.includes("comment") ||
      data.includes("<--") ||
      data.includes("TODO")
    ) {
      let result = vscode.window.showWarningMessage(
        "No comment was able to be generated."
      );
      return [new vscode.CompletionItem("")];
    }
    console.log(data);
    let completion = new vscode.CompletionItem(
      data,
      vscode.CompletionItemKind.Text
    );
    completion.detail = "Readable";
    return [completion]; // return the completion list
  } catch (err: any) {
    // if there is an error, show the error message
    vscode.window.showErrorMessage(err);
    console.log(err);
  }
};
