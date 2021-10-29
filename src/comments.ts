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
    kind,
    true
  );
  return generatedComment;
};

const generateComment = async (
  text: string,
  language: string,
  kind: number,
  showFeedback: boolean = false
) => {
  const { data } = await axios.post(COMPLETION_URL, {
    code: text,
    language: language,
    kind: kind,
  });
  if (data.message) {
    vscode.window.showErrorMessage(data.message);
    return "err";
  } else {
    if (showFeedback) {
      console.log(data);
      showFeedbackMessage(data.comment_id);
    }
    return data.code;
  }
};

export { generateComment };
