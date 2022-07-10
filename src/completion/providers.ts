import * as vscode from "vscode";
import CodeEditor from "../CodeEditor";
import TrialHelper from "../trial/TrialHelper";

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
    { language: "rust" },
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
              let language =
                vscode.window.activeTextEditor?.document.languageId;

              let updatedText =
                vscode.window.activeTextEditor?.document.lineAt(position).text;
              if (updatedText === line) {
                let comment = await displayInlineComment(
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

/**
 * Displays the inline comment completion item.
 * @param {vscode.Position} position - the position of the cursor.
 * @param {vscode.TextDocument} document - the document that the completion is being displayed in.
 * @param {string} language - the language of the document.
 * @returns {vscode.CompletionItem[]} - the completion items to display.
 */
export const displayInlineComment = async (
  position: vscode.Position,
  document: vscode.TextDocument,
  language: string = "normal"
) => {
  try {
    let completion = new vscode.CompletionItem(
      "...",
      vscode.CompletionItemKind.Text
    );
    completion.detail = "Readable";
    completion.insertText = "";
    completion.command = {
      command: "readable.insertInlineComment",
      title: "Insert Inline Comment",
      arguments: [
        {
          document: document,
          cursor: position,
          language: language,
        },
      ],
      tooltip: "Insert Inline Comment",
    };
    return [completion];
  } catch (err: any) {
    vscode.window.showErrorMessage(err.response);
    console.log(err.response);
  }
};
