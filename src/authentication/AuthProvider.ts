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
https.globalAgent.options.rejectUnauthorized = false; // once bug gets fixed remove

class CodeCommentPatSession implements AuthenticationSession {
  readonly account = {
    id: CodeCommentAuthenticationProvider.id,
    label: "CodeComment",
  };

  readonly id = CodeCommentAuthenticationProvider.id;

  readonly scopes = ["user:email"];

  constructor(public readonly accessToken: string) {}
}

export class CodeCommentAuthenticationProvider
  implements AuthenticationProvider, Disposable
{
  static id = "CodeCommentPAT";

  private static secretKey = "CodeCommentPAT";

  private quickPickItems: QuickPickItem[] = [
    {
      label: "GitHub",
      detail: "Log in with GitHub",
      picked: true,
    },
    {
      label: "Account",
      detail: "Log in with Email",
      picked: false,
    },
    {
      label: "Register",
      detail:
        "Create an account. Note: if you sign in with GitHub, an account is created automatically",
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

  private ensureInitialized(): void {
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
      CodeCommentAuthenticationProvider.secretKey
    ) as Promise<string | undefined>;
    return this.currentToken;
  }

  async getSessions(
    _scopes?: string[]
  ): Promise<readonly AuthenticationSession[]> {
    this.ensureInitialized();
    const token = await this.cacheTokenFromStorage();
    return token ? [new CodeCommentPatSession(token)] : [];
  }

  async createSession(_scopes: string[]): Promise<AuthenticationSession> {
    this.ensureInitialized();

    const loginChoice = await window.showQuickPick(this.quickPickItems);

    if (loginChoice === undefined) {
      throw new Error("Please select a choice");
    }

    const session = await this.loginWithProvider(loginChoice.label);

    await this.secretStorage.store(
      CodeCommentAuthenticationProvider.secretKey,
      session
    );

    console.log("successfully logged into Code Comment");

    return new CodeCommentPatSession(session);

    // const token = await window.showInputBox({
    //   ignoreFocusOut: true,
    //   placeHolder: "Personal Access Token",
    //   prompt:
    //     "Enter the CodeComment Access Token which you were shown in your web browser",
    //   password: true,
    // });

    // if (!token) {
    //   throw new Error("PAT is required");
    // }

    // await this.secretStorage.store(
    //   CodeCommentAuthenticationProvider.secretKey,
    //   token
    // );

    // console.log("Successfully logged into CodeComment");

    // return new CodeCommentPatSession(token);
  }

  async loginWithProvider(providerName: string): Promise<string> {
    if (providerName === "GitHub") {
      return this.githubLogin();
    }
    if (providerName === "Account") {
      return this.accountLogin();
    } else {
      throw new Error("Invalid provider name");
    }
  }

  async githubLogin(): Promise<string> {
    const session = await authentication.getSession("github", ["user:email"], {
      createIfNone: true,
    });
    if (session) {
      console.log("got here");
      const { data, status } = await axios.post(
        "https://api.codecomment.ai/api/v1/users/login/github/",
        {
          access_token: session.accessToken,
        },
        {
          headers: {
            "content-type": "application/json",
          },
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
          }),
        }
      );
      if (status !== 200 && status !== 201) {
        throw new Error("Unable to create an account with GitHub");
      }
      if (data === null || data === undefined) {
        throw new Error("Unable to create an account with GitHub");
      }

      const updatedAccount = await axios.post(
        "https://api.codecomment.ai/api/v1/users/finish/",
        {
          access_token: session.accessToken,
        },
        {
          headers: {
            Authorization: `Token ${data.key}`,
            "content-type": "application/json",
          },
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
          }),
        }
      );
      if (!updatedAccount) {
        window.showWarningMessage(
          "Unable to get email from GitHub account. You will still be able to use the extension like this."
        );
      }
      // this.secretStorage.store(
      //   CodeCommentAuthenticationProvider.secretKey,
      //   data
      // );
      console.log(data);
      return data.key;
    } else {
      throw new Error("Unable to authenticate with GitHub");
    }
  }

  async accountLogin(): Promise<string> {
    const email = await window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Email",
      prompt: "Enter your email",
    });

    if (!email) {
      throw new Error("Please enter in an email");
    }

    const password = await window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Password",
      prompt: "Please enter in your password",
      password: true,
    });

    if (!password) {
      throw new Error("Enter in a password");
    }
    throw new Error("Invalid authentication session");
  }

  async removeSession(_sessionId: string): Promise<void> {
    await this.secretStorage.delete(
      CodeCommentAuthenticationProvider.secretKey
    );
  }
}
