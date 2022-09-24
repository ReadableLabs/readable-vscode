import * as winston from "winston";
import VscodeOutputTransport from "./VscodeOutputTransport";

export function createLogger(): winston.Logger {
  let logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    defaultMeta: { service: "user_service" },
    transports: [new VscodeOutputTransport({ name: "Readable" })],
  });

  return logger;
}
