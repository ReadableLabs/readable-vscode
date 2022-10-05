import * as winston from "winston";
import LogOutputTransport from "./LogOutputTransport";
import VscodeOutputTransport from "./VscodeOutputTransport";

export function createLogger(): winston.Logger {
  let logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.json(),
      winston.format.timestamp()
    ),
    defaultMeta: { service: "user_service" },
    transports: [
      new VscodeOutputTransport({ name: "Readable" }),
      new LogOutputTransport({}),
    ],
  });

  process.on("uncaughtException", (err) => {
    console.log("uncaught exception got here");
    console.log(err);
    logger.error(err);
  });

  process.on("unhandledRejection", (reason: Error, Promise: Promise<any>) => {
    throw reason;
  });

  return logger;
}
