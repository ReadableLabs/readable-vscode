export default interface IPorcelainLine {
  commit: string;
  originalLine: number;
  finalLine: number;
  commitLine?: number;
}
