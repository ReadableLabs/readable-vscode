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

/**
 * Gets the line number of the first line of the prompt.
 * @param {number} startLine - the line number of the first line of the prompt.
 * @returns {number} the line number of the first line of the prompt.
 */
/**
 * Gets the line number of the first line of the function that the user is currently in.
 * @returns {number} The line number of the first line of the function that the user is currently in.
 */
/**
 * Gets the line number of the first line of the function that is being called.
 * @param {number} startLine - the line number of the first line of the function that is being called.
 * @returns {number} the line number of the first line of the function that is being called.
 */

/**
 * A class that contains a function that returns the safe position to insert a prompt.
 * @returns None
 */

/**
 * Gets the line number of the first line of the prompt.
 * @param {number} startLine - the line number of the first line of the prompt.
 * @returns {number} the line number of the first line of the prompt.
 */
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

/**
 * Gets the safe start and end positions for a given position.
 * @param {number} position - the position to get the safe range for.
 * @param {number} _startLine - the start line of the range.
 * @param {number} _endLine - the end line of the range.
 * @param {number} lineCount - the number of lines in the file.
 * @returns {number} - the start and end positions of the safe range.
 */
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

export const newFormatText = (
  code: string,
  _spaces: number = 0,
  language = "normal"
) => {
  let fullCode = "";
  let codeSplit = code.split("\n");
  let spaces = 0;
  const tabSize = vscode.workspace
    .getConfiguration("editor")
    .get<number>("tabSize");
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

  // add """ to the beginning of the code if it is not already there
  if (language === "python") {
    if (!codeSplit[0].includes('"""')) {
      fullCode = " ".repeat(spaces) + '"""\n' + fullCode;
    }
    // do the same for the end
    if (!codeSplit[codeSplit.length - 1].includes('"""')) {
      fullCode += " ".repeat(spaces === tabSize ? spaces : spaces) + '"""\n';
    }
  } else if (language === "csharp") {
    if (!codeSplit[0].includes("///")) {
      fullCode = " ".repeat(spaces) + "/// " + fullCode.trimLeft();
    }
  } else {
    // format the code with the correct indentation and add the comment header if needed.
    if (!codeSplit[0].includes("/**")) {
      fullCode = " ".repeat(spaces) + "/**\n" + fullCode;
    }
    if (!codeSplit[codeSplit.length - 1].includes("*/")) {
      fullCode += " ".repeat(spaces + 1) + "*/\n";
    }
  }
  return fullCode;
};
