export class ResyncFileInfo {
  public readonly fileName: string;
  public readonly relativePath: string;
  public readonly lastUpdate: string;
  public readonly commitDiff: number;
  public readonly commentStart: number;
  public readonly commentEnd: number;
  constructor(fileInfo: string[]) {
    this.lastUpdate = fileInfo[0];
    this.commitDiff = parseInt(fileInfo[1]);
    this.relativePath = fileInfo[2];
    this.fileName = fileInfo[3];
    this.commentStart = parseInt(fileInfo[4]);
    this.commentEnd = parseInt(fileInfo[5]);
  }
}
