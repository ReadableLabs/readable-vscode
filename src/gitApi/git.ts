import * as vscode from "vscode";
import * as fs from "fs";
import * as Git from "isomorphic-git";
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

export const getBranch = async () => {
  let log = await Git.log({
    fs,
    dir: "/Users/2023_nevin_puri/Desktop/testinit",
  });
  for (let element of log) {
    console.log(element.commit.message);
  }
};
