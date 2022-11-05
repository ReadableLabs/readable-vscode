import * as winston from "winston";
import LogOutputTransport from "./LogOutputTransport";
import VscodeOutputTransport from "./VscodeOutputTransport";

let erlog: winston.Logger;

interface ErLogOptions extends winston.LoggerOptions {
  logUrl: string;
}

export function setLoggerMetadata(data: object) {
  erlog.defaultMeta = { ...erlog.defaultMeta, ...data };
}

export function createLogger(options: ErLogOptions): winston.Logger {
  if (erlog) {
    return erlog;
  }

  erlog = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.json(),
      winston.format.timestamp()
    ),
    defaultMeta: { service: "user_service" },
    transports: [new VscodeOutputTransport({ name: "Readable" })],

    // exceptionHandlers: [new LogOutputTransport(options)],
    // rejectionHandlers: [new LogOutputTransport(options)],

    handleExceptions: true,
    handleRejections: true,
    ...options,
  });

  // process.on("exit", (code) => {
  //   console.log("finishing sending logs");
  // });

  // process.on("warning", (warning) => {
  //   logger.warning(warning);
  // });

  // process.on("uncaughtException", (err) => {
  //   console.log("uncaught exception got here");
  //   console.log(err);
  //   logger.error(err);
  // });

  // process.on("unhandledRejection", (reason: Error, Promise: Promise<any>) => {
  //   throw reason;
  // });

  return erlog;
}
