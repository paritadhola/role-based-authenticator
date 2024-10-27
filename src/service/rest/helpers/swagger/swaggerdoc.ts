import * as path from "path"
import * as fs from "fs"
import * as Joi from "@hapi/joi"
import m2s from "mongoose-to-swagger"
import { ISwaggerObj, parseToSwagger } from "./joitoswagger"
import { IRequestSchema } from "../../middleware/validate/joi.middleware"
import { logger } from "../../../../logger"

export interface IResponseSchema extends Joi.AnySchema {
  "200"?: Joi.AnySchema
  "201"?: Joi.AnySchema
  "202"?: Joi.AnySchema
  "400"?: Joi.AnySchema
  "401"?: Joi.AnySchema
  "402"?: Joi.AnySchema
  "404"?: Joi.AnySchema
}

export interface IRouteInfo {
  apiPath: string
  tags: string[]
  method?: string
  description?: string
  summary?: string
  responses?: IResponseSchema
  noAuth?: boolean
}
const mongoModelPath = path.join(__dirname, "../../../../db/models")

const swaggerObj: { [n: string]: any } = {
  basePath: "/",
  info: {
    title: "myapp API Documentation",
    version: "1.0.0",
    description: "",
  },
  schemes: ["http", "https"],
  produces: ["application/json"],
  consumes: ["application/json", "multipart/form-data"],
  definitions: {},
  swagger: "2.0",
  externalDocs: {
    url: "http://localhost:3030/",
  },
  securityDefinitions: {
    Bearer: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description:
        "Authorization Tokens to be sent to the server in the format 'Bearer ${token}'",
    },
  },
  security: [
    {
      Bearer: [],
    },
  ],
  paths: {},
}
export function convertToSwagger(
  schemas: IRequestSchema,
  routeInfo: IRouteInfo
) {
  if (process.env.NODE_ENV === "production") {
    return
  }
  const parameters: {
    name?: string
    in?: string
    schema?: any
    type?: string
    required?: boolean
    [k: string]: any
  }[] = []
  const reqMehtod = routeInfo.method || "get"
  if (!routeInfo.noAuth) {
    parameters.push({
      type: "string",
      description: "JWT token",
      name: "Authorization",
      in: "header",
      // required: true,
    })
  }

  if (schemas.params) {
    const sResp1 = parseToSwagger(schemas.params)
    // logger.log("sresp1 in params", sResp1)
    if (sResp1 && sResp1.swagger && sResp1.swagger.properties) {
      // logger.log("params properties: ", sResp1.swagger.properties)
      const requiredParams: string[] = sResp1.swagger.required || []
      const prop = sResp1.swagger.properties
      for (const [name, schema] of Object.entries<ISwaggerObj>(prop)) {
        parameters.push({
          name,
          in: "path",
          type: "string",
          schema,
          description: schema.description,
          required: requiredParams.includes(name),
        })
      }
    }
  }

  if (schemas.query) {
    const sResp1 = parseToSwagger(schemas.query)
    // logger.log("query: ", sResp1)

    if (sResp1 && sResp1.swagger && sResp1.swagger.properties) {
      // logger.log("params properties: ", sResp1.swagger.properties)
      const requiredParams: string[] = sResp1.swagger.required || []
      const prop = sResp1.swagger.properties
      for (const [name, schema] of Object.entries<ISwaggerObj>(prop)) {
        parameters.push({
          name,
          in: "query",
          type: "string",
          schema,
          required: requiredParams.includes(name),
          description: schema.description,
        })
      }
    }
  }

  if (schemas.body) {
    const sResp1 = parseToSwagger(schemas.body)
    parameters.push({
      name: "body",
      in: "body",
      schema: sResp1 && sResp1.swagger,
    })
  }

  if (schemas.files) {
    const sRespFile = parseToSwagger(schemas.files)
    if (sRespFile && sRespFile.swagger && sRespFile.swagger.properties) {
      for (const [fldname] of Object.entries(sRespFile.swagger.properties)) {
        parameters.push({
          name: fldname,
          in: "formData",
          description: "File to upload",
          required:
            sRespFile.swagger.required &&
            sRespFile.swagger.required.indexOf(fldname) > -1,
          type: "file",
          format: "binary",
        })
      }
    }
  }

  const apiPath = routeInfo.apiPath
  if (typeof swaggerObj.paths[apiPath] === "undefined") {
    swaggerObj.paths[apiPath] = {}
  }

  swaggerObj.paths[apiPath][reqMehtod] = {
    tags: routeInfo.tags,
    parameters,
    description: routeInfo.description,
    summary: routeInfo.summary,
  }
  if (typeof routeInfo.responses !== "undefined") {
    const j2sResp: any = parseToSwagger(routeInfo.responses)
    if (j2sResp !== false) {
      const responses: { [k: string]: any } = {}

      for (const [name, jschema] of Object.entries(
        j2sResp.swagger.properties
      )) {
        responses[name] = {
          description: "Response structure",
          schema: jschema,
        }
      }

      swaggerObj.paths[apiPath][reqMehtod].responses = responses
    }
  }
}

export function getSwaggerObj() {
  if (Object.keys(swaggerObj.definitions).length > 0) {
    return swaggerObj
  }
  const files = fs.readdirSync(mongoModelPath)
  files.map((file) => {
    const fPath = path.join(mongoModelPath, file)
    if (
      ["index.js", ".", ".."].includes(file) ||
      path.extname(file) === ".map" ||
      fs.lstatSync(fPath).isDirectory()
    ) {
      return
    }
    try {
      const model = require(fPath)
      if (!model || !model.default) {
        logger.log("No default export found on this model:", fPath)
        return
      }

      const modelSchemaSwagger = m2s(model.default)

      swaggerObj.definitions[modelSchemaSwagger.title] = {
        ...modelSchemaSwagger,
      }
    } catch (err) {
      logger.log(
        "=========error importing model to swagger doc:---",
        file,
        err.message
      )
    }
  })

  return swaggerObj
}
