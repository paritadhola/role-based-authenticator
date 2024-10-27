import { Response } from "express"
import Joi from "@hapi/joi"
import { IAuthenticatedRequest } from "../auth"
import { convertToSwagger, IRouteInfo } from "../../helpers/swagger/swaggerdoc"
import { mysqlIdRegex } from "../../../../constants"
import { logger } from "../../../../logger"
import { formatMessage } from "./joi.messageFormat"

const extendedJoi = Joi.extend(
  {
    name: "object",
    base: Joi.object(),
    coerce: (value: string, state: any, options: any) => {
      if (
        typeof value !== "string" ||
        (value[0] !== "{" && !/^\s*\{/.test(value))
      ) {
        return { value }
      }
      try {
        return { value: JSON.parse(value) }
      } catch (ignoreErr) {
        logger.error("joi string to obj extension err:", ignoreErr)
        return { value }
      }
    },
  },
  {
    name: "array",
    base: Joi.array(),
    coerce: (value: string, state: any, options: any) => {
      if (
        typeof value !== "string" ||
        (value[0] !== "[" && !/^\s*\[/.test(value))
      ) {
        return { value }
      }
      try {
        return { value: JSON.parse(value) }
      } catch (ignoreErr) {
        logger.error("joi string to array extension err:", ignoreErr)
        return { value }
      }
    },
  }
)

export interface IRequestSchema {
  body?: Joi.ObjectSchema
  params?: Joi.ObjectSchema
  query?: Joi.ObjectSchema
  files?: Joi.ObjectSchema
}

export const joiSequelizeIdNumberSchema = Joi.number()
  .integer()
  .min(1)
  .max(999999999)
  .required()

export const joiSequelizeIdNumberOptionalSchema = Joi.number()
  .integer()
  .min(1)
  .max(999999999)
  .allow("")

export const joiSequelizeIdStringSchema = Joi.string()
  .regex(mysqlIdRegex)
  .required()

export const joi401Resp = Joi.object({
  status: Joi.number().required().valid(0),
  message: Joi.string().required().default("Unauthorized Request"),
})
export const joi400Resp = Joi.object({
  status: Joi.number().required().valid(0),
  message: Joi.string().required().default("Invalid Request"),
  details: Joi.array().items(
    Joi.object({
      path: Joi.string().required(),
      description: Joi.string().required(),
    })
  ),
})
export const defaultRespSchema = Joi.object({
  "200": Joi.object({
    status: Joi.number().valid(1).required(),
  }),
  "400": joi400Resp,
  "401": joi401Resp,
})

export interface IName {
  fName: string
  lName: string
}

export const JoiNameSchema = {
  fName: Joi.string().min(3).max(20).required(),
  lName: Joi.string().min(3).max(20).required(),
}

const validateWithPromise = async (
  object: any,
  schema: Joi.Schema,
  stripUnknown = true
) =>
  new Promise((resolve, reject) => {
    try {
      const jRes = extendedJoi.concat(schema).validate(object, {
        allowUnknown: true,
        stripUnknown,
        abortEarly: false,
      })
      if (jRes.error) {
        return reject(jRes.error)
      }
      if (jRes.errors) {
        return reject(jRes.errors)
      }
      resolve(jRes.value)
    } catch (err) {
      reject(err)
    }
  })

export const validateReq = (
  schemas: IRequestSchema,
  routeInfo?: IRouteInfo
) => {
  if (typeof routeInfo !== "undefined") {
    convertToSwagger(schemas, routeInfo)
  }
  return async (req: IAuthenticatedRequest, res: Response, next: any) => {
    const promises: Promise<any>[] = []
    const keysValidated: ("body" | "params" | "query" | "files")[] = []

    if (schemas.body) {
      keysValidated.push("body")
      promises.push(validateWithPromise(req.body, schemas.body))
    }

    if (schemas.params) {
      keysValidated.push("params")
      promises.push(validateWithPromise(req.params, schemas.params))
    }

    if (schemas.query) {
      keysValidated.push("query")
      promises.push(validateWithPromise(req.query, schemas.query))
    }

    if (schemas.files) {
      keysValidated.push("files")
      promises.push(validateWithPromise(req.files, schemas.files, false))
    }

    try {
      const data = await Promise.all(promises)
      keysValidated.forEach((key, index) => {
        req[key] = data[index]
      })
      next()
    } catch (error) {
      logger.log(
        "JoiError:",
        error.message,
        "Fields:",
        keysValidated.map((f) => ({ [f]: req[f] }))
      )
      const details = error.details ? formatMessage(error.details) : []
      res.status(400).json({
        status: 0,
        message: `Invalid input: ${details.map((d) => d.message).join(", ")}.`,
        details,
      })
    }
  }
}
