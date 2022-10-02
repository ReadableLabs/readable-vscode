import * as winston from "winston";
import VscodeOutputTransport from "./VscodeOutputTransport";

export function createLogger(): winston.Logger {
  let logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.json(),
      winston.format.timestamp()
    ),
    defaultMeta: { service: "user_service" },
    transports: [new VscodeOutputTransport({ name: "Readable" })],
  });

  process.on("uncaughtException", (err) => {
    console.log("uncaught exception got here");
    // console.log(err);
    logger.error(err);
  });

  process.on("unhandledRejection", (err) => {
    console.log("unhandled rejection got here");
    console.log(err);
    logger.error(err);
  });

  return logger;
}
