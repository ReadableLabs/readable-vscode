import * as vscode from "vscode";
import axios from "axios";
import { BASE_URL } from "../globals";

/**
 * Takes in a string of code and sends it to the server for autocomplete.
 * @param {string} fullCode - the code to autocomplete
 * @param {string} comment - the comment to autocomplete
 * @param {string} language - the language of the code
 * @param {string} accessToken - the access token of the user
 * @returns {Promise<any>} - the autocomplete data
 */
/**
 * Takes in a string of code and returns the autocomplete suggestions for that code.
 * @param {string} fullCode - the code to get autocomplete suggestions for.
 * @param {string} comment - the comment that the user is currently writing.
 * @param {string} language - the language that the user is currently writing in.
 * @param {string} accessToken - the access token for the user.
 * @returns {Promise<any>} - the autocomplete suggestion for the code.
 */
export const generateAutoComplete = async (
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
  try {
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
    // Figure out what went wrong
    vscode.window.showErrorMessage(
      "Error: Something went wrong. Try again shortly."
    );
    if (err.request.data) {
      vscode.window.showErrorMessage(err.request.data);
    }
    return undefined;
  }
};
