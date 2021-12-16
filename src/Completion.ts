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
  const session = await vscode.authentication.getSession(
    CodeCommentAuthenticationProvider.id,
    [],
    { createIfNone: false }
  );
  if (!session) {
    return;
  }
  console.log("something");
  const full_codeSymbol = await codeEditor.getSymbolUnderCusor(); // show generating thing in bottom bar
  // const full_code = await codeEditor.getTextFromSymbol(full_codeSymbol); // make toggle to generate on and off from command
  let startLine: number, endLine: number;
  startLine =
    full_codeSymbol.range.start.line < position.line - 8
      ? position.line - 8
      : full_codeSymbol.range.start.line;
  endLine =
    full_codeSymbol.range.end.line > position.line + 16
      ? position.line + 16
      : full_codeSymbol.range.end.line;
  console.log(startLine);
  console.log(endLine);
  let full_code = await codeEditor.getTextInRange(
    new vscode.Range(
      new vscode.Position(startLine, 0),
      new vscode.Position(endLine, 0)
    ) // TODO: implement something which gets the starting character, not 0
  );
  // const lineNumber = position.line - full_codeSymbol.range.start.line;
  let fullCodeSplit = full_code.split("\n");
  // const lineNumber = fullCodeSplit.findIndex(
  //   document.lineAt(position.line).text
  // );
  // document.lineAt(position.line).text
  let currentLine = document.lineAt(position.line).text;
  const lineNumber = fullCodeSplit.findIndex((value) => {
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
    .trimRight();
  full_code = "";
  fullCodeSplit.map((item) => {
    full_code += item + "\n";
  });
  // console.log(full_code);
  // console.log(full_code);
  // console.log(full_code.split("\n")[lineNumber].replace(/\/\//, ""));
  // const selectedRange = codeEditor.getTextInRange();
  const autoCode = codeEditor // comment on bottom of IDE like the GitHub Copilot logo, but with Readable
    .getTextInRange(
      new vscode.Range(new vscode.Position(startLine, 0), position)
    )
    .trimRight();
  console.log(autoCode);
  console.log("ok----");
  // console.log(full_code);
  console.log(full_code);
  const language = _language ? _language : "normal";
  const { data } = await axios.post(
    "http://127.0.0.1:8000/complete/autocomplete/",
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
    data.includes("comment describing what the code below does") ||
    data.includes("comment describing what the code above does" || data === "")
  ) {
    let result = vscode.window.showWarningMessage(
      "No comment was able to be generated.",
      "Don't show again"
    );
    return [new vscode.CompletionItem("")];
  }
  console.log(data);
  let completion = new vscode.CompletionItem(
    data,
    vscode.CompletionItemKind.Text
  );
  return [completion];
};
