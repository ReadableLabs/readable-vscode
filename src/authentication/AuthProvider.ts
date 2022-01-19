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
import axios from "axios";
const https = require("https");
import * as vscode from "vscode";
import { IProfile } from "./types";
import TrialHelper from "../trial/TrialHelper";
import { loginOptions } from "./Prompts";
https.globalAgent.options.rejectUnauthorized = false; // once bug gets fixed remove

class CodeCommentPatSession implements AuthenticationSession {
  readonly account = {
    id: CodeCommentAuthenticationProvider.id,
    label: "Readable",
  };

  readonly id = CodeCommentAuthenticationProvider.id;

  readonly scopes = ["user:email"];

  constructor(public readonly accessToken: string) {}
}

export class CodeCommentAuthenticationProvider
  implements AuthenticationProvider, Disposable
{
  static id = "CodeCommentPAT";

  private static secretKey = "c7b5ff27-8b06-4d7b-a6d7-a509355a6115";

  private quickPickItems: QuickPickItem[] = [
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
    // {
    //   label: "$(person-add)  Register",
    //   detail:
    //     "Create an account. Note: if you sign in with GitHub, an account is created automatically",
    //   picked: false,
    // },
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
      CodeCommentAuthenticationProvider.id,
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
        "No account detected. Make an account or login to use Readable.",
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
    } else {
      // let profile = await this.getProfile();
      // if (!profile) {
      //   return;
      // }
      // if (profile.plan === "Premium") {
      //   return;
      // }
      // await TrialHelper.showTrialNotification(profile.trial_end);
    }
  }

  private ensureInitialized(): void {
    try {
      if (this.initializedDisposable === undefined) {
        void this.cacheTokenFromStorage();

        this.initializedDisposable = Disposable.from(
          this.secretStorage.onDidChange((e) => {
            if (e.key === CodeCommentAuthenticationProvider.secretKey) {
              void this.checkForUpdates();
            }
          }),
          authentication.onDidChangeSessions((e) => {
            if (e.provider.id === CodeCommentAuthenticationProvider.id) {
              void this.checkForUpdates();
            }
          })
        );
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(err);
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
      CodeCommentAuthenticationProvider.secretKey
    ) as Promise<string | undefined>;
    return this.currentToken;
  }

  async getSessions(
    _scopes?: string[]
  ): Promise<readonly AuthenticationSession[]> {
    try {
      this.ensureInitialized();
      const token = await this.cacheTokenFromStorage();
      return token ? [new CodeCommentPatSession(token)] : []; // return a session
    } catch (err: any) {
      console.log(err);
      vscode.window.showErrorMessage(err.message);
      vscode.window.showInformationMessage(
        "Error: can't get sessions. Please try logging out and back in."
      );
      throw new Error("Error: can't get sessions");
    }
  }

  async createSession(_scopes: string[]): Promise<AuthenticationSession> {
    this.ensureInitialized();

    if (!_scopes[0]) {
      throw new Error("Error: no key");
    }

    const session = _scopes[0];

    await this.secretStorage.store(
      CodeCommentAuthenticationProvider.secretKey,
      session
    );

    return new CodeCommentPatSession(session);
  }

  async removeSession(_sessionId: string): Promise<void> {
    await this.secretStorage.delete(
      CodeCommentAuthenticationProvider.secretKey
    );
  }
}
