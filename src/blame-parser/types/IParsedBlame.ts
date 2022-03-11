import IInfoChunk from "./IInfoChunk";
import IPorcelainLine from "./IPorcelainLine";

export default interface IParsedBlame {
  line: IPorcelainLine;
  info: IInfoChunk;
}
