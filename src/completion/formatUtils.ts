import * as vscode from "vscode";

export const getCommentFromLine = (line: string, language: string): string => {
  let delimiter = language === "python" ? "#" : "//";
  let comments = [];
  let comment: string | null = "";
  comments = line.split(delimiter);
  comment = comments.length > 1 ? comments[comments.length - 1].trim() : "";
  return comment;
};
