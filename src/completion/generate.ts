import * as vscode from "vscode";
import axios from "axios";

export const generateAutoComplete = async (
  code: string,
  fullCode: string,
  language: string,
  accessToken: string
) => {
  try {
    const { data } = await axios.post(
      "https://api.readable.so/complete/autocomplete/",
      {
        full_code: fullCode,
        code: code,
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
    vscode.window.showErrorMessage(
      "Error: network error in autocomplete http request"
    );
    if (err.request.data) {
      vscode.window.showErrorMessage(err.request.data);
    }
  }
};

export const generateDocstring = async (
  code: string,
  language: string,
  python_functionName: string = "",
  accessToken: string
) => {
  try {
    const { data } = await axios.post(
      "https://api.readable.so/complete/right-click/",
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
    vscode.window.showErrorMessage(
      "Error: network error in docstring http request"
    );
    if (err.request.data) {
      vscode.window.showErrorMessage(err.request.data);
    }
    return undefined;
  }
};
