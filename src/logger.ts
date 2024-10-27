const levels: string[] = ["log", "debug", "info", "notice", "warn", "error"]

const util = require("util")
class Logger {
  private excludes: string[] = []
  private writeLog(arr: any) {
    const key = arr.splice(0, 1)[0]
    if (this.excludes.includes(key) === false) {
      // arr.unshift(`[${key.toUpperCase()}]`)
      console.log(
        `[${key.toUpperCase()}]`,
        arr
          .map((i: any) =>
            typeof i !== "string"
              ? util.inspect(i, { breakLength: Infinity })
              : i
          )
          .join(" ")
      )
      // console.log.apply(console, util.inspect(arr))
    }
  }
  log(...val: any[]) {
    this.writeLog(["log", ...val])
  }
  debug(...val: any[]) {
    this.writeLog(["debug", ...val])
  }
  info(...val: any[]) {
    this.writeLog(["info", ...val])
  }
  notice(...val: any[]) {
    this.writeLog(["notice", ...val])
  }
  warn(...val: any[]) {
    this.writeLog(["warn", ...val])
  }
  error(...val: any[]) {
    this.writeLog(["error", ...val])
  }
  /**
   *
   * @param level one of "log", "debug", "info", "notice", "warn", "error"
   */
  setLevel(level: string) {
    if (typeof level === "string") {
      for (let i = levels.indexOf(level) - 1; i >= 0; i--) {
        this.excludes.push(levels[i])
      }
    }
    return this
  }
}

export const logger = new Logger()

/** 'log', 'debug', 'info', 'notice', 'warn', 'error' */

logger.setLevel(process.env.LOG_LEVEL || "debug")

/** Available methods
 * - logger.fatal("fatel")
 * - logger.error("error")
 * - logger.warn("warn")
 * - logger.info("info")
 * - logger.debug("debug")
 * - logger.trace("trace")
 * - logger.debug([object],[string])
 */
// export const logger = pino({
//   level: process.env.LOG_LEVEL || "trace",
//   useLevelLabels: true,
// })
