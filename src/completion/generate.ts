import * as vscode from "vscode";
import axios from "axios";
import { BASE_URL } from "../globals";

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
    vscode.window.showErrorMessage(
      "Error: Network error in autocomplete http request"
    );
    console.log(err);
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
    vscode.window.showErrorMessage(
      "Error: Network error in docstring http request"
    );
    if (err.request.data) {
      vscode.window.showErrorMessage(err.request.data);
    }
    return undefined;
  }
};
