import * as vscode from "vscode";

const getLine = (line: number) => {
  if (line - 1 > 0) return line;
  else return 0;
};

const getTextRange = (range: vscode.Range) => {
  let window = vscode.window.activeTextEditor;
  if (!window) return "";
  else return window.document.getText(range);
};

const getLanguageId = () => {
  let window = vscode.window.activeTextEditor;
  if (!window) return "";
  else return window.document.languageId;
};

const formatComment = (comment: string, indent: number) => {
  let newComment = comment;
  if (!comment.startsWith("\n")) newComment = "\n" + comment;
  // let tabs = "\n" + " ".repeat(indent);
  // let formattedText = newComment.replace(/\n/g, tabs);
  // return formattedText;
  return newComment;
};

const insertComment = (
  start: vscode.Position,
  comment: string,
  language?: any
) => {
  // todo: refactor to use a position rather than start number so you can get the indentation
  let currentLine = getLine(start.line);
  let textEditor = vscode.window.activeTextEditor;
  if (textEditor === null || textEditor === undefined) return;
  let formattedText = formatComment(comment, start.character);
  textEditor.insertSnippet(
    new vscode.SnippetString(`${formattedText}\n`),
    new vscode.Position(currentLine, 0) // 8 % 2 for tabs to put before each line
  );
};

export { getLine, getTextRange, getLanguageId, formatComment, insertComment };
