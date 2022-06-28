import * as vscode from "vscode";
import axios from "axios";
import { getVSCodeDownloadUrl } from "vscode-test/out/util";
import { ILoginCredentials, IProfile } from "../types";
import { BASE_URL } from "../../globals";
const https = require("https");
https.globalAgent.options.rejectUnauthorized = false; // once bug gets fixed remove

export default class Account {
  /**
   * Logs the user in with email
   * @param email
   * @param password
   * @returns {string} key - access token
   */
  public static async EmailLogin(credentials: ILoginCredentials) {
    try {
      const { data } = await axios.post(
        BASE_URL + "/api/v1/users/auth/login/",
        {
          email: credentials.email,
          password: credentials.password,
        }
      );
      return data.key;
    } catch (err: any) {
      if (err.response) {
        let errors = "";
        console.log(err.response);
        if (err.response.data.email) {
          for (let emailError of err.response.data.email) {
            errors += emailError + " ";
          }
        }
        if (err.response.data.non_field_errors) {
          for (let error of err.response.data.non_field_errors) {
            errors += error + " ";
          }
        }
        vscode.window.showErrorMessage(errors);
      }
      return;
      vscode.window.showErrorMessage(err.response);
    }
  }

  public static async GitHubLogin(accessToken: string) {
    try {
      const { data } = await axios.post(
        BASE_URL + "/api/v1/users/login/github/",
        {
          access_token: accessToken,
        },
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );

      if (!data.key) {
        return;
      }

      await axios.post(
        // update email for account
        BASE_URL + "/api/v1/users/finish/",
        {
          access_token: accessToken,
        },
        {
          headers: {
            Authorization: `Token ${data.key}`,
          },
        }
      );

      return data.key;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.response);
    }
  }

  public static async GetProfile(
    accessToken: string
  ): Promise<IProfile | undefined> {
    try {
      const { data } = await axios.post(
        BASE_URL + "/api/v1/users/accountinfo/",
        {},
        {
          headers: {
            Authorization: `Token ${accessToken}`,
          },
        }
      );
      return data;
    } catch (err: any) {
      console.log(err);
      await vscode.window.showErrorMessage(
        "Error: Could not get account info. Try logging out and back in."
      );
      if (err.response) {
        await vscode.window.showErrorMessage(err.response);
      }
    }
  }

  public static async ResetPassword(
    email: string
  ): Promise<string | undefined> {
    try {
      const { data } = await axios.post(
        BASE_URL + "/api/v1/users/password-reset/",
        {
          email: email,
        }
      );

      if (!data.detail) {
        return;
      }

      return data.detail;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.response);
    }
  }

  public static async Register(
    email: string,
    password1: string,
    password2: string
  ) {
    try {
      const { data } = await axios.post(
        BASE_URL + "/api/v1/users/auth/register/",
        {
          email,
          password1,
          password2,
        }
      );
      return;
    } catch (err: any) {
      if (err.response) {
        let errors = "There were the following errors: ";
        console.log(err.response);
        if (err.response.data.email) {
          for (let emailError of err.response.data.email) {
            errors += emailError + " ";
          }
        }
        if (err.response.data.password1) {
          for (let error of err.response.data.password1) {
            errors += error + " ";
          }
        }
        vscode.window.showErrorMessage(errors);
      }
      return;
    }
  }

  // public static async emailLogout(
  //   accessToken: string
  // ): Promise<string | undefined> {
  //   try {
  //     const { data } = await axios.post(
  //       BASE_URL + "/api/v1/users/auth/logout/",
  //       {},
  //       {
  //         headers: {
  //           Authorization: `Token ${accessToken}`,
  //         },
  //       }
  //     );
  //     if (!data) {
  //     }
  //   } catch (err: any) {
  //     vscode.window.showErrorMessage(err.response);
  //   }
  // }
}
