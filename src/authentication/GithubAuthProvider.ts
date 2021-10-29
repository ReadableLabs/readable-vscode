import * as vscode from "vscode";

export class GithubProvider {
  private _isAuthenticated: boolean = false;
  async lib() {
    const session = await vscode.authentication.getSession("github", [], {
      createIfNone: true,
    });
    if (session) {
      this._isAuthenticated = true;
      console.log(session);
    } else {
      this._isAuthenticated = false;
      throw new Error("Error: Unable to authenticate with GitHub.");
    }
    return session;
  }

  public isAuthenticated() {
    return this._isAuthenticated;
  }
}
