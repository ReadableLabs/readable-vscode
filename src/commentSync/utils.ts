import * as fs from "fs";
import * as vscode from "vscode";
import { IChange, IParsedChange } from "./interfaces";

const highlightDecoratorType = vscode.window.createTextEditorDecorationType(
  // set decoration range behavior
  {
    // backgroundColor: "#cea7002D", // don't write file on change, just append to array to commit
    overviewRulerColor: "facc15",
    gutterIconPath: vscode.Uri.file(
      "/home/nevin/Desktop/Readable/src/commentSync/pixil.png"
    ),
    gutterIconSize: "contain",
    // outlineColor: "yellow",
    // outlineWidth: "1px",
    // borderStyle: "solid",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
  }
);

const exponentialDecay = () => {};

const isInComment = (lineNumber: number, changes: IChange[]) => {};

const updateDecorations = async (ranges: vscode.Range[]) => {
  // for (let change of changes) {
  // on did change active text editor update decorations
  // allRanges.push(change.range);
  // allRanges.push(
  //   new vscode.Range(
  //     new vscode.Position(change.range[0].line, change.range[0].character),
  //     new vscode.Position(change.range[1].line, change.range[1].character)
  //   )
  // );
  // }

  if (!vscode.window.activeTextEditor) {
    return;
  }
  vscode.window.activeTextEditor.setDecorations(highlightDecoratorType, ranges);
};

const getFileChanges = (syncFile: string, fileName: string) => {
  const changes = getCurrentChanges(syncFile);
  if (!changes) {
    return [];
  }
  let filteredChanges = changes.filter((change) => {
    if (change.file !== fileName) {
      return false;
    }
    return true;
  });
  return filteredChanges;
};

const getCurrentChanges = (file: string) => {
  console.log("here");
  const data = fs.readFileSync(file, "utf-8");
  if (!data) {
    return;
  }
  const parsed: IParsedChange[] = JSON.parse(data);
  const changes = toChange(parsed);
  return changes;
};

const toChange = (parsedChanges: IParsedChange[]) => {
  let changes: IChange[] = [];
  for (let change of parsedChanges) {
    if (!change.range[0] || !change.range[1]) {
      continue;
    }
    let [range, params] = getRangeFromParsedChange(change);
    changes.push({
      file: change.file,
      function: change.function,
      range: range,
      changesCount: change.changesCount,
      isArgsChanged: change.isArgsChanged,
      isReturnChanged: change.isReturnChanged,
      params: params,
      symbol: change.symbol,
    });
  }
  return changes;
};

const getRangeFromParsedChange = (change: IParsedChange) => {
  const commentRange = new vscode.Range(
    new vscode.Position(change.range[0].line, change.range[0].character),
    new vscode.Position(change.range[1].line, change.range[1].character)
  );
  const params = new vscode.Range(
    new vscode.Position(change.params[0].line, change.params[0].character),
    new vscode.Position(change.params[0].line, change.params[0].character)
  ); // just try casting, "as" vscode.Range
  return [commentRange, params];
};

const getDocumentTextFromEditor = (e: vscode.TextDocument) => {
  return e.getText(
    new vscode.Range(
      // gets all the lines in the document
      new vscode.Position(0, 0),
      new vscode.Position(e.lineCount, e.lineAt(e.lineCount - 1).lineNumber)
    )
  );
};

const getAllSymbolsFromDocument = async (
  e: vscode.TextDocument
): Promise<vscode.DocumentSymbol[]> => {
  const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
    "vscode.executeDocumentSymbolProvider",
    e.uri
  );
  if (!symbols) {
    return [];
  }
  return symbols;
};

const getCommentFromRange = (range: vscode.Range, document: string[]) => {
  let fullText = "";
  for (let i = range.start.line; i <= range.end.line; i++) {
    for (let b = range.start.character; b < document[i].length; b++) {
      // maybe the file has new lines in it? I have no idea
      fullText += document[i][b];
    }
  }
  return fullText;
};

const getDocumentText = () => {
  if (!vscode.window.activeTextEditor) {
    return null;
  }
  // fix bug in constructor
  return vscode.window.activeTextEditor.document.getText(
    new vscode.Range(
      // gets all the lines in the document
      new vscode.Position(0, 0),
      new vscode.Position(
        vscode.window.activeTextEditor.document.lineCount,
        vscode.window.activeTextEditor.document.lineAt(
          vscode.window.activeTextEditor.document.lineCount - 1
        ).lineNumber
      )
    )
  );
};

const getSymbolFromName = (symbols: vscode.DocumentSymbol[], name: string) => {
  for (let symbol of symbols) {
    if (symbol.name === name) {
      return symbol;
    }
    if (symbol.children) {
      for (let child of symbol.children) {
        if (child.name === name) {
          return child;
        }
      }
    }
  }
  return null;
};

/**
 * gets parameters for text
 * @param text the text of the file
 */
const getParametersRange = (symbol: vscode.DocumentSymbol, text: string[]) => {
  let open = 0,
    close = 0,
    initialLine = 0,
    initialCharacter = 0;
  for (let i = symbol.range.start.line; i < symbol.range.end.line; i++) {
    for (let b = 0; b < text[i].length; b++) {
      if (text[i][b] === "(") {
        if (open === 0) {
          initialLine = i;
          initialCharacter = b;
        }
        open++;
      } else if (text[i][b] === ")") {
        close++;
      }
      if (close >= open && close !== 0 && open !== 0) {
        return new vscode.Range(
          new vscode.Position(initialLine, initialCharacter),
          new vscode.Position(i, b + 1)
        ); // ok
      }
    }
  }
  return;
};

export {
  getCurrentChanges,
  getDocumentTextFromEditor,
  getRangeFromParsedChange,
  getAllSymbolsFromDocument,
  getSymbolFromName,
  updateDecorations,
  getDocumentText,
  getCommentFromRange,
  getFileChanges,
  getParametersRange,
  isInComment,
};
