import axios from "axios";
export default class TextGenerator {
  private _baseUrl = "http://127.0.0.1:8000";
  private _completionUrl = this._baseUrl + "/complete/";
  constructor() {}

  private async makeApiRequest(route: string): Promise<any> {
    const { data, status } = await axios.post(route);
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

  public async generateSummary(text: string) {
    const data = await this.makeApiRequest(this._completionUrl);
    return data;
  }

  public generateDocstring(text: string) {}
}
