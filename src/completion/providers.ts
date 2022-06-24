import * as vscode from "vscode";
import CodeEditor from "../CodeEditor";
import TrialHelper from "../trial/TrialHelper";
import { provideComments } from "./Completion";

export const inlineProvider = vscode.languages.registerCompletionItemProvider(
  [
    { language: "javascript" },
    { language: "typescript" },
    { language: "cpp" },
    { language: "c" },
    { language: "csharp" },
    { language: "php" },
    { language: "java" },
    { language: "javascriptreact" },
    { language: "typescriptreact" },
    { language: "php" },
    { language: "python" },
  ],
  {
    async provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      context: vscode.CompletionContext
    ) {
      if (
        !vscode.workspace
          .getConfiguration("readable")
          .get<boolean>("enableAutoComplete")
      ) {
        return;
      }

      const linePrefix = document
        .lineAt(position)
        .text.substring(0, position.character);

      const line = document.lineAt(position).text;

      const commentChar = getCommentChar(document.languageId);

      try {
        if (
          linePrefix.includes(commentChar) &&
          position.character > line.trimLeft().indexOf(commentChar)
        ) {
          return new Promise<vscode.CompletionItem[] | undefined>(
            async (resolve, reject) => {
              let language = CodeEditor.getLanguageId();

              let updatedText =
                vscode.window.activeTextEditor?.document.lineAt(position).text;
              if (updatedText === line) {
                let comment = await provideComments(
                  position,
                  document,
                  language
                );
                resolve(comment);
              } else {
                resolve(undefined);
              }
            }
          );
        } else {
          return undefined;
        }
      } catch (err: any) {
        console.log(err);
        vscode.window.showErrorMessage(err.message);
      }
    },
  },
  " ",
  ","
);

const getCommentChar = (language: string) => {
  if (language === "python") {
    return "#";
  }

  return "//";
};
