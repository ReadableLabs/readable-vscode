import axios from "axios";
import { ILoginCredentials } from "../types";
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
}
