import { Response } from "express"
import { Stream } from "stream"
import { logger } from "../../../logger"

export const isObject = (value: any) => {
  return value !== null && typeof value === "object"
}
export const isArray = (value: any) => {
  return Array.isArray(value)
}

export function wirteObjectStream(res: Response, readStream: Stream) {
  res.writeHead(200, { "Content-Type": "application/json" })

  let first = true
  res.write(`{"status":1,"response":[`)
  readStream
    .on("data", function (doc: any) {
      if (!first) {
        res.write("," + JSON.stringify(doc))
      } else {
        logger.debug("got first chunk in viewBookingReport repo")
        first = false
        res.write(JSON.stringify(doc))
      }
    })
    .on("end", function () {
      logger.debug("got last chunk")
      res.end("]}")
    })
    .on("error", function (err: any) {
      logger.error(err, "Error in stream write")
      res.end("]}")
    })
}
