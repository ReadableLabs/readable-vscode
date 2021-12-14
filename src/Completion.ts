import * as vscode from "vscode";
import { CodeCommentAuthenticationProvider } from "./authentication/AuthProvider";
import CodeEditor from "./CodeEditor";
import axios from "axios";

export const ProvideComments = async (position: vscode.Position) => {
  const codeEditor = new CodeEditor();
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
  const full_code = await codeEditor.getTextInRange(
    new vscode.Range(
      new vscode.Position(startLine, 0),
      new vscode.Position(endLine, 0)
    ) // TODO: implement something which gets the starting character, not 0
  );
  console.log(full_code);
  // const selectedRange = codeEditor.getTextInRange();
  const autoCode = codeEditor // comment on bottom of IDE like the GitHub Copilot logo, but with Readable
    .getTextInRange(new vscode.Range(full_codeSymbol.range.start, position))
    .trimRight();
  console.log(autoCode);
  // console.log(full_code);
  const { data } = await axios.post(
    "http://127.0.0.1:8000/complete/autocomplete/",
    {
      full_code: full_code,
      code: autoCode,
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
