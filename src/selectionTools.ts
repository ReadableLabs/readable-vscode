import * as vscode from "vscode";

const selectionColor = new vscode.ThemeColor("editor.selectionBackground");
const smallDecorator = vscode.window.createTextEditorDecorationType({
  overviewRulerColor: selectionColor,
  backgroundColor: selectionColor,
  overviewRulerLane: vscode.OverviewRulerLane.Left,
});

export const createSelection = async (range: vscode.Range) => {
  await vscode.window.activeTextEditor?.setDecorations(smallDecorator, [range]);
};

export const removeSelections = async () => {
  await vscode.window.activeTextEditor?.setDecorations(smallDecorator, []);
};
