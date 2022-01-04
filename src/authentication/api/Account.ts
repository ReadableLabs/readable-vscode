import axios from "axios";
import { ILoginCredentials, IProfile } from "../types";
const https = require("https");
https.globalAgent.options.rejectUnauthorized = false; // once bug gets fixed remove

export default class Account {
  /**
   * Logs the user in with email
   * @param email
   * @param password
   * @returns {string} key - access token
   */
  public static async EmailLogin(
    credentials: ILoginCredentials
  ): Promise<string | undefined> {
    const { data } = await axios.post(
      "https://api.readable.so/api/v1/users/auth/login/",
      {
        email: credentials.email,
        password: credentials.password,
      }
    );

    if (!data.key) {
      return;
    }

    return data.key;
  }

  public static async GitHubLogin(accessToken: string) {
    const { data } = await axios.post(
      "https://api.readable.so/api/v1/users/login/github/",
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
      "https://api.readable.so/api/v1/users/finish/",
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
  }

  public async GetProfile(accessToken: string): Promise<IProfile | undefined> {
    const { data } = await axios.post(
      "https://api.readable.so/api/v1/users/accountinfo/",
      {},
      {
        headers: {
          Token: `Token ${accessToken}`,
        },
      }
    );

    if (!data.username) {
      return;
    }

    return data;
  }

  public static async ResetPassword(
    email: string
  ): Promise<string | undefined> {
    const { data } = await axios.post(
      "https://api.readable.so/api/v1/users/password-reset/",
      {
        email: email,
      }
    );

    if (!data.detail) {
      return;
    }

    return data.detail;
  }

  public static async Register(
    email: string,
    password1: string,
    password2: string
  ) {
    const { data } = await axios.post(
      "https://api.readable.so/api/v1/users/register/",
      {
        email,
        password1,
        password2,
      }
    );

    if (!data.detail) {
      return;
    }
    return data.detail;
  }
}
