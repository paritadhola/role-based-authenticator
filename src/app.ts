import "reflect-metadata"
import bodyParser from "body-parser"
import * as path from "path"
import { InversifyExpressServer } from "inversify-express-utils"
import { Response, Request, NextFunction, static as serveStatic } from "express"
import cookieParser from "cookie-parser"
import morgan from "morgan"
import fileUpload from "express-fileupload"

import cors from "cors"
import helmet from "helmet"

// import { expressApp } from "./service/rest/routes/index"

import { logger } from "./logger"

import { ErrorRequestHandler } from "express-serve-static-core"

import { JSONParseError } from "./utilities/customError"

import { container } from "./container"

import { reconnectDb } from "./utilities/db"
import { corsOptionsDelegate } from "./service/rest/helpers/corsOptionsDelegate"
import { getSwaggerObj } from "./service/rest/helpers/swagger/swaggerdoc"

const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction // don't remove this
) => {
  if ((err as JSONParseError) instanceof SyntaxError) {
    err.httpStatusCode = 400
    logger.info("JSON error:" + err.message)
    err.message = `Invalid JSON string in request.`
  }
  if (!err.httpStatusCode) {
    err.httpStatusCode = 500
  }
  if (!res.headersSent) {
    if (err.code === 11000) {
      logger.error(`MongoDB unique id error: ${err.message}`)
      return res
        .status(400)
        .json({ status: 0, message: "Record already exists with this entity." })
    }
    //res.status(err.httpStatusCode).json({ status: 0, message: err.message })
  }
  if (err.message === "Topology was destroyed") {
    logger.warn(`Mongodb Error: Topology was destroyed. Trying to Reconnect`)
    reconnectDb()
  }
  if (err.code === 4601) {
    logger.warn(`Mongodb reconnect Error: Trying to Reconnect`)
    reconnectDb()
  }
  const logObj: { [k: string]: any } = {
    errorMsg: err.message,
    uri: req.url,
    body: req.body,
    params: req.params,
    headers: req.headers,
  }
  if (err.httpStatusCode === 500) {
    logObj.stack = err.stack
    logger.error(logObj, `${err.httpStatusCode}Error`)
  } else {
    logger.info(logObj, `${err.httpStatusCode}Error`)
  }
  res.status(err.httpStatusCode).json({ status: 0, message: err.message })
}

const morganReqHandler = morgan((tokens, req, res) => {
  const userAgent = tokens["user-agent"](req, res)
  if (("" + userAgent).match(/HealthChecker/)) {
    return null
  }

  logger.info({
    status: tokens.status(req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    res: tokens.res(req, res, "content-length"),
    responseTime: tokens["response-time"](req, res),
    remoteAddress: tokens["remote-addr"](req, res),
    userAgent,
  })
  return null
})

// create server
const expServer = new InversifyExpressServer(container, null, null, null)

expServer.setConfig((app2) => {
  app2.use(
    fileUpload({
      // useTempFiles: true,
      parseNested: true,
      // debug: true,
      limits: { fileSize: 10 * 1024 * 1024 },
    })
  )
  app2.use(helmet())
  app2.use(cors(corsOptionsDelegate))
  app2.use(bodyParser.json({ limit: "6mb" }))
  app2.use(morganReqHandler)
  app2.use(cookieParser())

  if (process.env.NODE_ENV === "development") {
    app2.get("/api/docs/swagger.json", (req: Request, res: Response) => {
      res.json(getSwaggerObj())
    })
    app2.get("/api/docs", (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "swagger/index.html"))
    })
    app2.use(
      "/api/docs/swagger/assets",
      serveStatic("node_modules/swagger-ui-dist")
    )
  }
  app2.use("/api/healthcheck", async (req, res) => res.send({ status: 1 }))
  app2.use(async (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Expose-Headers", [
      "Content-disposition",
      "Cookie",
      "X-Requested-With",
      "Content-Type",
      "Origin",
      "Accept",
    ])
    next()
  })
})
expServer.setErrorConfig((eApp) => {
  eApp.use(errorHandler)
})

export const app = expServer.build()
