import * as vscode from "vscode";
import * as fs from "fs";
import * as Git from "isomorphic-git";
import * as child from "child_process";
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

export const getBlame = async (dir: string, branch: string, file: string) => {
  return new Promise<string>((resolve, reject) => {
    child.exec(
      `git -C ${dir} blame --line-porcelain ${branch} -- ${file}`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else if (stderr) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      }
    );
  });
};
