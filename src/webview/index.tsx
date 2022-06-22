import * as vscode from "vscode";
import { vsCodeBadge } from "@vscode/webview-ui-toolkit";
import { Uri } from "vscode";
import { Resync } from "../resync";
import { ResyncFileInfo } from "./ResyncItem";
import * as ReactDOMServer from "react-dom/server";
import Hello from "./components/Hello";
import React = require("react");

export class ResyncViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];
  public resync?: Resync;
  public root?: string;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    if (this._view !== undefined) {
      console.log("new ewbvoejfwoiejgoiasdj");
      this._view.webview.html = this._getHtmlForWebview(
        this._view.webview,
        this._extensionUri
      );
    }
    if (!vscode.workspace.workspaceFolders) {
      return;
    }
    this.root = vscode.workspace.workspaceFolders[0].uri.fsPath;
    this.resync = new Resync(context);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(
      webviewView.webview,
      this._extensionUri
    );

    this._setWebviewMessageListener(this._view.webview);
  }
  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    console.log("set webiew lsitener");
    webview.onDidReceiveMessage(
      (message: any) => {
        console.log("got messangdsiu hguasdhguasdhuigha");
        const command = message.command;
        const text = message.text;
        switch (command) {
          case "select":
            vscode.window.showInformationMessage(text);
            return;
        }
      },
      undefined,
      this._disposables
    );
  }

  private _getHtmlForWebview(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.

    const toolkitUri = getUri(webview, extensionUri, [
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist",
      "toolkit.js",
    ]);

    // const mainUri = getUri(webview, extensionUri, ["media", "main.js"]);

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );
    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
          webview.cspSource
        }; script-src 'nonce-${nonce}';">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
                <script nonce="${nonce}" type="module" src="${toolkitUri}"></script>
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Resync</title>
			</head>
			<body>
      ${ReactDOMServer.renderToString(<Hello />)}
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getUri(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  pathList: string[]
) {
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}
