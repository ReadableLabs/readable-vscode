import {
  authentication,
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationSession,
  Disposable,
  Event,
  EventEmitter,
  SecretStorage,
  window,
  QuickPickItem,
} from "vscode";
const https = require("https");
import * as vscode from "vscode";
https.globalAgent.options.rejectUnauthorized = false; // once bug gets fixed remove

class ReadablePatSession implements AuthenticationSession {
  readonly account = {
    id: ReadableAuthenticationProvider.id,
    label: "Readable Access Token",
  };

  readonly id = ReadableAuthenticationProvider.id;

  readonly scopes = ["user:email"];

  constructor(public readonly accessToken: string) {}
}

export class ReadableAuthenticationProvider
  implements AuthenticationProvider, Disposable
{
  static id = "CodeCommentPAT";

  private static secretKey = "c7b5ff27-8b06-4d7b-a6d7-a509355a6115";

  private quickPickItems: QuickPickItem[] = [
    {
      label: "$(mark-github)  GitHub",
      detail: "Log in with GitHub",
      picked: true,
    },
    {
      label: "$(mail)  Email",
      detail: "Log in with Email",
      picked: false,
    },
  ];

  private currentToken: Promise<string | undefined> | undefined;
  private initializedDisposable: Disposable | undefined;

  private _onDidChangeSessions =
    new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();

  get onDidChangeSessions(): Event<AuthenticationProviderAuthenticationSessionsChangeEvent> {
    return this._onDidChangeSessions.event;
  }

  constructor(private readonly secretStorage: SecretStorage) {}

  dispose(): void {
    this.initializedDisposable?.dispose();
  }

  public async getSession(): Promise<AuthenticationSession | undefined> {
    return await vscode.authentication.getSession(
      ReadableAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );
  }

  /**
   * Checks if the user has a session
   * @returns true if there is a session
   */
  public async checkAccount(): Promise<void> {
    const session = await this.getSession();
    if (!session) {
      const result = await vscode.window.showInformationMessage(
        "No account detected. Make an account or log in to use Readable.",
        "Log in",
        "Sign up"
      );
      if (!result) {
        return;
      }
      if (result === "Log In") {
        await vscode.commands.executeCommand("readable.login");
      } else if (result === "Sign up") {
        await vscode.commands.executeCommand("readable.register");
      }
    }
  }

  private ensureInitialized(): void {
    try {
      if (this.initializedDisposable === undefined) {
        void this.cacheTokenFromStorage();

        this.initializedDisposable = Disposable.from(
          this.secretStorage.onDidChange((e) => {
            if (e.key === ReadableAuthenticationProvider.secretKey) {
              void this.checkForUpdates();
            }
          }),
          authentication.onDidChangeSessions((e) => {
            if (e.provider.id === ReadableAuthenticationProvider.id) {
              void this.checkForUpdates();
            }
          })
        );
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(err.message);
    }
  }

  private async checkForUpdates(): Promise<void> {
    const added: AuthenticationSession[] = [];

    const removed: AuthenticationSession[] = [];

    const changed: AuthenticationSession[] = [];

    const previousToken = await this.currentToken;

    const session = (await this.getSessions())[0];

    if (session?.accessToken && !previousToken) {
      added.push(session);
    } else if (!session?.accessToken && previousToken) {
      removed.push(session);
    } else if (session?.accessToken !== previousToken) {
      changed.push(session);
    } else {
      return;
    }

    void this.cacheTokenFromStorage();
    this._onDidChangeSessions.fire({
      added: added,
      removed: removed,
      changed: changed,
    });
  }

  private cacheTokenFromStorage() {
    this.currentToken = this.secretStorage.get(
      // get the current token
      ReadableAuthenticationProvider.secretKey
    ) as Promise<string | undefined>;
    return this.currentToken;
  }

  async getSessions(
    _scopes?: string[]
  ): Promise<readonly AuthenticationSession[]> {
    try {
      this.ensureInitialized();
      const token = await this.cacheTokenFromStorage();
      return token ? [new ReadablePatSession(token)] : []; // return a session
    } catch (err: any) {
      console.log(err);
      await this.removeSession(ReadableAuthenticationProvider.id);
      vscode.window.showErrorMessage(err.message);
      vscode.window.showInformationMessage(
        "Readable: Error getting account info. Please try logging in again."
      );
      throw new Error("Error: Can't get sessions");
    }
  }

  async createSession(_scopes: string[]): Promise<AuthenticationSession> {
    this.ensureInitialized();

    if (!_scopes[0]) {
      throw new Error("Error: No key");
    }

    const session = _scopes[0];

    await this.secretStorage.store(
      ReadableAuthenticationProvider.secretKey,
      session
    );

    return new ReadablePatSession(session);
  }

  async removeSession(_sessionId: string): Promise<void> {
    await this.secretStorage.delete(ReadableAuthenticationProvider.secretKey);
  }
}
