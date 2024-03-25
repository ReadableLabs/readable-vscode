import * as vscode from "vscode";
import axios from "axios";
import axiosRetry from "axios-retry";
import { BASE_URL } from "../globals";
import { getSpan } from "../metrics";

export const generateInlineComment = async (
  fullCode: string,
  comment: string,
  language: string,
  accessToken: string
) => {
  try {
    const { data } = await axios.post(
      BASE_URL + "/complete/autocomplete/",
      {
        full_code: fullCode,
        comment: comment,
        language: language,
      },
      {
        headers: {
          Authorization: `Token ${accessToken}`,
        },
      }
    );

    return data;
  } catch (err: any) {
    // Figure out what went wrong
    axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay, retries: 5 });
    vscode.window.showErrorMessage(
      "Error: Something went wrong. Try again shortly."
    );
    console.log(err);
    if (err.request.data) {
      vscode.window.showErrorMessage(err.request.data);
    }
  }
};

/**
 * Takes in a string of code and returns a docstring for that code.
 * @param {string} code - the code to generate a docstring for
 * @param {string} language - the language of the code
 * @param {string} [python_functionName=""] - the name of the function in the code
 * @param {string} accessToken - the access token for the user
 * @returns A docstring for the code
 */
export const generateDocstring = async (
  code: string,
  language: string,
  python_functionName: string = "",
  accessToken: string
) => {
  let span = getSpan("generateDocstring");
  span.report({ status: "generated" });
  try {
    axiosRetry(axios, {
      retries: 5, // number of retries
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error: any) => {
        // if retry condition is not specified, by default idempotent requests are retried
        return error.response?.status === 500;
      },
    });
    const { data } = await axios.post(
      BASE_URL + "/complete/right-click/",
      {
        full_code: code,
        language: language,
        python_functionName: python_functionName,
      },
      {
        headers: {
          Authorization: `Token ${accessToken}`,
        },
      }
    );

    return data;
  } catch (err: any) {
    span.report({ status: "error", error: err });
    console.log(err);
    // Figure out what went wrong
    if (err.response.status !== 200) {
      throw new Error(
        `API call failed with status code: ${err.response.status} after 5 retry attempts`
      );
    }
    vscode.window.showErrorMessage(
      "Error: Something went wrong. Try again shortly."
    );
    if (err.request.data) {
      vscode.window.showErrorMessage(err.request.data);
    }
    return undefined;
  }
};
