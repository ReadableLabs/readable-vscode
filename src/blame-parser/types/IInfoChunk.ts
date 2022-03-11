export default interface IInfoChunk {
  author?: string;
  authorMail?: string;
  authorTime?: string;
  authorTz?: string;
  commiter?: string;
  commiterMail?: string;
  commiterTime?: number;
  commiterTz?: string;
  summary?: string;
  boundary?: string;
  fileName?: string;
  line?: string;
}
