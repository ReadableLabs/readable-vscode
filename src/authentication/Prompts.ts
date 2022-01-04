import * as vscode from "vscode";

export const registerOptions: vscode.QuickPickItem[] = [
  {
    label: "$(mark-github)  GitHub",
    detail: "Register with GitHub",
    picked: true,
  },
  {
    label: "$(mail)  Email",
    detail: "Register with Email",
    picked: false,
  },
];

export const loginOptions: vscode.QuickPickItem[] = [
  {
    label: "$(mark-github)  GitHub",
    detail: "Log in with GitHub.",
    picked: true,
  },
  {
    label: "$(mail)  Email",
    detail: "Log in with Email",
    picked: false,
  },
];
