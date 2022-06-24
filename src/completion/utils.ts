import * as vscode from "vscode";

/**
 * Gets the line number of the given line of code.
 * @param {string[]} code - the code to search for the line number of
 * @param {string} currentLine - the line of code to search for
 * @returns {number} the line number of the given line of code
 */
export const getLineNumber = (code: string[], currentLine: string) => {
  const lineNumber = code.findIndex((value) => {
    if (value === currentLine) {
      return true;
    }
  });
  return lineNumber;
};

/**
 * Takes in a string of code and returns the line number that the cursor is on.
 * @param {string[]} code - the code to format
 * @param {string} currentLine - the current line that the cursor is on
 * @returns {number} the line number that the cursor is on
 */
export const getFormattedCode = (
  document: vscode.TextDocument,
  position: vscode.Position,
  code: string
) => {
  let fullCode = "";
  const codeSplit = code.split("\n");
  const currentLine = document.lineAt(position.line).text;

  const lineNumber = getLineNumber(codeSplit, currentLine);

  codeSplit[lineNumber] = codeSplit[lineNumber].trimRight();
  codeSplit.map((item) => {
    fullCode += item + "\n";
  });
  return fullCode;
};

export const getSafePromptPosition = (startLine: number) => {
  if (startLine - 2 < 0) {
    return 0;
  } else {
    return startLine - 2;
  }
};

export const getSafeStartPosition = (
  position: number,
  startLine: number,
  lineCount: number
) => {
  return position - 1 > 0 && position - 1 > startLine
    ? position - 1
    : startLine;
};

export const getSafeEndPosition = (
  position: number,
  endLine: number,
  lineCount: number
) => {
  return position + 3 < endLine && position + 3 < lineCount
    ? position + 3
    : endLine;
};

export const getSafeRange = (
  position: number,
  _startLine: number,
  _endLine: number,
  lineCount: number
) => {
  const startLine = getSafeStartPosition(position, _startLine, lineCount);
  const endLine = getSafeEndPosition(position, _endLine, lineCount);
  return { startLine, endLine };
};

/**
 * Return the function name from the document.
 * @param {vscode.TextDocument} document - The document to get the function name from.
 * @param {vscode.DocumentSymbol} symbol - The symbol to get the function name from.
 * @returns The function name.
 */
export const getFunctionName = (
  document: vscode.TextDocument,
  symbol: vscode.DocumentSymbol
) => {
  let functionName = "";
  let offset = 0;
  let currentLine = "";

  // Find the function name.
  for (let i = 0; i <= symbol.range.end.line - symbol.range.start.line; i++) {
    currentLine = document.lineAt(symbol.range.start.line + i).text;
    if (currentLine.includes("def")) {
      functionName = currentLine;
      break;
    }
  }
  return functionName;
};

export const getSafeLine = (line: number, lineCount: number): number => {
  return line + 1 < lineCount ? line + 1 : line;
};

/**
 * Takes in a string of code and adds the correct amount of spaces to the beginning of each line.
 * @note don't touch
 * @param {string} code - the code to format
 * @param {number} [spaces=0] - the number of spaces to indent the code
 * @param {string} [language="normal"] - the language of the code
 * @returns None
 */
export const formatComment = (
  code: string,
  _spaces: number = 0,
  language = "normal"
) => {
  let fullCode = "";
  let codeSplit = code.split("\n");
  let spaces = 0;
  const tabSize = vscode.workspace
    .getConfiguration("editor")
    .get<number>("tabSize"); // check if file is using tabs or spaces, and if it is using tabs, get tab width
  if (!tabSize) {
    throw new Error("Error: Unable to get tab size from editor");
  }
  if (language === "python") {
    spaces = tabSize + _spaces; // ok
  } else {
    spaces = _spaces;
  }

  codeSplit.map((code) => {
    if (code.trim() !== "") {
      fullCode += " ".repeat(spaces) + code + "\n";
    }
  });

  if (language === "python") {
    if (!codeSplit[0].includes('"""')) {
      fullCode = " ".repeat(spaces) + '"""\n' + fullCode;
    }
    if (!codeSplit[codeSplit.length - 1].includes('"""')) {
      fullCode += " ".repeat(spaces === tabSize ? spaces : spaces) + '"""\n';
    }
  } else if (language === "csharp") {
    if (!codeSplit[0].includes("///")) {
      fullCode = " ".repeat(spaces) + "/// " + fullCode.trimLeft();
    }
  } else {
    if (!codeSplit[0].includes("/**")) {
      fullCode = " ".repeat(spaces) + "/**\n" + fullCode;
    }
    if (!codeSplit[codeSplit.length - 1].includes("*/")) {
      fullCode += " ".repeat(spaces + 1) + "*/\n";
    }
  }
  return fullCode;
};

export const getCommentFromLine = (line: string, language: string): string => {
  let delimiter = language === "python" ? "#" : "//";
  let comments = [];
  let comment: string | null = "";
  comments = line.split(delimiter);
  comment = comments.length > 1 ? comments[comments.length - 1].trim() : "";
  return comment;
};

export const hasSelection = (): boolean => {
  if (!vscode.window.activeTextEditor) {
    throw new Error("Error: No active text editor");
  }
  if (
    vscode.window.activeTextEditor.selection.start.line ===
      vscode.window.activeTextEditor.selection.end.line &&
    vscode.window.activeTextEditor.selection.start.character ===
      vscode.window.activeTextEditor.selection.end.character
  ) {
    return false;
  } else {
    return true;
  }
};

export const getFirstAndLastText = (symbol: vscode.DocumentSymbol) => {
  if (!vscode.window.activeTextEditor) {
    throw new Error("Error: Unable to get active editor");
  }
  let startLine = 0,
    endLine = 0;
  if (symbol.range.start.line + 20 <= symbol.range.end.line) {
    // get the first 10 lines of the symbol's range.
    let startStart = symbol.range.start.line;
    let startEnd = symbol.range.start.line + 10;

    // get the end line of the symbol
    let endStart = symbol.range.end.line - 10;
    let endEnd = symbol.range.end.line;

    const first10Lines = vscode.window.activeTextEditor.document.getText(
      new vscode.Range(
        new vscode.Position(startStart, 0),
        new vscode.Position(startEnd, 0)
      )
    );
    const last10Lines = vscode.window.activeTextEditor.document.getText(
      new vscode.Range(
        new vscode.Position(endStart, 0),
        new vscode.Position(endEnd, 0)
      )
    );
    return first10Lines + "\n" + last10Lines;
  } else {
    return vscode.window.activeTextEditor.document.getText(symbol.range);
  }

  // if (symbol.range.end.line - 10 <= symbol.range.start.line) {
  //   endLine = symbol.range.start.line; // } else {
  //   endLine = symbol.range.end.line - 11;
  // }
};
