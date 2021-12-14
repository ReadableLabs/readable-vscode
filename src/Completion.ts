import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import CodeEditor from "./CodeEditor";
import axios from "axios";

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

export const ProvideComments = async (
  position: vscode.Position,
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
  console.log(full_codeSymbol);
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
  const full_code = await codeEditor.getTextInRange(
    new vscode.Range(
      new vscode.Position(startLine, 0),
      new vscode.Position(endLine, 0)
    ) // TODO: implement something which gets the starting character, not 0
  );
  const lineNumber = position.line - full_codeSymbol.range.start.line;
  console.log(lineNumber);
  console.log(nthIndex(full_code, "\n", lineNumber));
  console.log(full_code[260]);
  // console.log(full_code.split("\n")[lineNumber].replace(/\/\//, ""));
  // const selectedRange = codeEditor.getTextInRange();
  const autoCode = codeEditor // comment on bottom of IDE like the GitHub Copilot logo, but with Readable
    .getTextInRange(new vscode.Range(full_codeSymbol.range.start, position))
    .trimRight();
  console.log(autoCode);
  // console.log(full_code);
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
