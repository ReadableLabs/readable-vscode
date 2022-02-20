import * as vscode from "vscode";
import { GitExtension } from "../@types/git";

const getAPI = () => {
  const gitExtension =
    vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (gitExtension) {
    const git = gitExtension.exports.getAPI(1);
  } else {
    throw new Error("Error: unable to get git api");
  }
};
