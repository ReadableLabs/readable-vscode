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
    try {
      console.log("get sessions");
      this.ensureInitialized();
      const token = await this.cacheTokenFromStorage();
      return token ? [new CodeCommentPatSession(token)] : [];
    } catch (err) {
      console.log(err);
      throw new Error("hadsigoh");
    }
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

    window.showInformationMessage("Successfully logged into Readable!");

    console.log("successfully logged into Code Comment");

    return new CodeCommentPatSession(session);
  }

  async loginWithProvider(providerName: string): Promise<string> {
    if (providerName === "$(mark-github)  GitHub") {
      return this.githubLogin();
    }
    if (providerName === "$(mail)  Email") {
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
      let key = await vscode.window.withProgress(
        {
          title: "Logging in with GitHub",
          cancellable: false,
          location: vscode.ProgressLocation.Notification,
        },
        (progress, token) => {
          let p = new Promise<string>(async (resolve, reject) => {
            try {
              console.log("got here");
              const { data, status } = await axios.post(
                "http://127.0.0.1:8000/api/v1/users/login/github/",
                {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
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
                "http://127.0.0.1:8000/api/v1/users/finish/",
                {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  access_token: session.accessToken,
                },
                {
                  headers: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
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
                  "Unable to get email from GitHub account. NOTE: You will still be able to use the extension like this." // TODO: Have url to help page
                );
              }
              // this.secretStorage.store(
              //   CodeCommentAuthenticationProvider.secretKey,
              //   data
              // );
              console.log(data);
              resolve(data.key);
              // return data.key;
            } catch (err: any) {
              console.log(err);
              vscode.window.showErrorMessage(err);
              reject();
            }
          });
          return p;
        }
      );
      return key;
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

    let key = await vscode.window.withProgress(
      {
        title: "Logging in",
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
      },
      (progress, token) => {
        let p = new Promise<string>(async (resolve, reject) => {
          try {
            const { data } = await axios.post(
              "http://127.0.0.1:8000/api/v1/users/auth/login/",
              {
                email: email,
                password: password,
              }
            );

            if (!data.key) {
              throw new Error(
                "Error: unable to login. You can reset your password using the reset password command."
              );
            }
            resolve(data.key);
          } catch (err: any) {
            console.log(err);
            vscode.window.showErrorMessage("Error: failed to login");
            reject();
          }
        });
        return p;
      }
    );
    return key;
  }

  async resetPassword(): Promise<void> {
    const email = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Email",
      prompt: "Enter your email",
    });
    vscode.window.withProgress(
      {
        cancellable: true,
        location: vscode.ProgressLocation.Notification,
        title: "Sending Password Reset Email",
      },
      (progress, token) => {
        const p = new Promise<void>(async (resolve, reject) => {
          try {
            const { data } = await axios.post(
              "https://api.codecomment.ai/api/v1/users/password-reset/",
              {
                email: email,
              }
            );
            if (!data.detail) {
              vscode.window.showErrorMessage("Error: can't send email request");
            } else {
              vscode.window.showInformationMessage(data.detail);
              reject();
            }
          } catch (err) {
            reject();
          }
        });
        return p;
      }
    );
  }

  async registerAccount(): Promise<void> {
    try {
      const email = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Email",
        prompt: "Enter an email",
      });

      // add check if email, whatever are null to just abort

      const password1 = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Password",
        prompt: "Enter in a password",
        password: true,
      });

      const password2 = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Password",
        prompt: "Repeat the password",
        password: true,
      });

      let detail = await vscode.window.withProgress(
        {
          title: "Registering",
          cancellable: false,
          location: vscode.ProgressLocation.Notification,
        },
        (progress, token) => {
          let p = new Promise<string>(async (resolve, reject) => {
            const { data } = await axios.post(
              "http://127.0.0.1:8000/api/v1/users/auth/register/",
              {
                email: email,
                password1,
                password2,
              }
            );
            resolve(data.detail);
          });
          return p;
        }
      );
      vscode.window.showInformationMessage(
        detail + " Check your inbox and try logging in."
      );
    } catch (err: any) {
      console.log(err);
      vscode.window.showErrorMessage(err);
    }
  }

  async removeSession(_sessionId: string): Promise<void> {
    await this.secretStorage.delete(
      CodeCommentAuthenticationProvider.secretKey
    );
  }
}
