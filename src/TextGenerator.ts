import axios from "axios";
export default class TextGenerator {
  private _baseUrl = "http://127.0.0.1:8000";
  private _completionUrl = this._baseUrl + "/complete/";

  private _languages = ["docstring", "summary", "in_line"];
  constructor() {}

  private async makeApiRequest(
    route: string,
    code: string,
    language: string,
    commentType: string
  ): Promise<any> {
    const { data, status } = await axios.post(route, {
      code,
      language,
      keyword: "Function",
      commentType,
    });
    if (status !== 200) {
      throw new Error(
        "Error: API Request failed with status " +
          status +
          ". Additional info: " +
          data
      );
    }
    return data;
  }

  private formatText(language: string) {}

  public async generate(code: string, language: string, type: string) {
    if (this._languages.indexOf(type) === -1) {
      throw new Error("Error: invalid comment type"); // TODO: check language
    }
  }

  public async generateSummary(
    code: string,
    language: string,
    commentType: string
  ) {
    const data = await this.makeApiRequest(
      this._completionUrl,
      code,
      language,
      commentType
    );
    console.log(data);
    return data;
  }

  public generateDocstring(text: string) {}
}
