import * as vscode from "vscode";

export const createSelection = (range: vscode.Range) => {
  const selectionColor = new vscode.ThemeColor("editor.selectionBackground");
  const smallDecorator = vscode.window.createTextEditorDecorationType({
    // borderWidth: "1px",
    // borderStyle: "solid",
    overviewRulerColor: selectionColor,
    backgroundColor: selectionColor,
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    // light: {
    //   borderColor: "darkblue",
    // },
    // dark: {
    //   borderColor: "lightblue",
    // },
  });
};

export const removeSelections = async () => {};
