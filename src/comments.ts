import * as vscode from "vscode";
import axios from "axios";
import { showFeedbackMessage } from "./notification/notificationProvider";
import { COMPLETION_URL } from "./globals/consts";

const generateCommentFromSymbol = async (
  range: vscode.Range,
  kind: vscode.SymbolKind
) => {
  let textEditor = vscode.window.activeTextEditor;
  if (!textEditor) return;
  let userText = textEditor.document.getText(range);
  let generatedComment = await generateComment(
    userText,
    textEditor.document.languageId,
    kind
  );
  return generatedComment;
};

const generateComment = async (
  text: string,
  language: string,
  kind: number
) => {
  const { data } = await axios.post(COMPLETION_URL, {
    code: text,
    language: language,
    kind: kind,
  });
  if (data.status !== 200) {
    vscode.window.showErrorMessage("Error: error generating comment");
    throw new Error("Error: error generating comment");
  } else {
    return data.code;
  }
};

export { generateComment };
