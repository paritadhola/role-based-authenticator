"use strict"

// Reference https://github.com/chuyik/joi-to-swagger

const joi = require("@hapi/joi")
const { find, get, set, merge } = require("lodash")

export interface ISwaggerObj {
  type?:
    | "integer"
    | "number"
    | "float"
    | "double"
    | "string"
    | "array"
    | "object"
    | "file"
  format?: "float" | "double" | "email" | "date-time" | "byte" | "binary"
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  oneOf?: ISwaggerObj[]
  in?: string
  description?: string
  pattern?: string
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  items?: ISwaggerObj
  allOf?: any[] | undefined
  $ref?: string | undefined
  additionalProperties?: boolean
  properties?: ISwaggerObj
  swagger?: ISwaggerObj
  required?: any[]
  enum?: any
  __required?: boolean | undefined
  _baseType?: any
  _tests?: any
  [k: string]: any
}

const patterns = {
  alphanum: "^[a-zA-Z0-9]*$",
  alphanumLower: "^[a-z0-9]*$",
  alphanumUpper: "^[A-Z0-9]*$",
}

const isJoi = function (joiObj: any) {
  return !!(joiObj && joiObj.isJoi)
}

const hasJoiMeta = function (joiObj: any) {
  return !!(isJoi(joiObj) && Array.isArray(joiObj._meta))
}

const getJoiMetaProperty = function (joiObj: any, propertyName: string) {
  // get headers added using meta function
  if (isJoi(joiObj) && hasJoiMeta(joiObj)) {
    const joiMeta = joiObj._meta
    let i = joiMeta.length
    while (i--) {
      if (joiMeta[i][propertyName]) {
        return joiMeta[i][propertyName]
      }
    }
  }
  return undefined
}

// module.exports.parseToSwagger =

const parseAsType: ISwaggerObj = {
  number: (schema: any) => {
    const swagger: ISwaggerObj = {}

    if (find(schema._tests, { name: "integer" })) {
      swagger.type = "integer"
    } else {
      swagger.type = "number"
      if (find(schema._tests, { name: "precision" })) {
        swagger.format = "double"
      } else {
        swagger.format = "float"
      }
    }

    if (find(schema._tests, { name: "positive" })) {
      swagger.minimum = 1
    }

    if (find(schema._tests, { name: "negative" })) {
      swagger.maximum = -1
    }

    const min = find(schema._tests, { name: "min" })
    if (min) {
      swagger.minimum = min.arg
    }

    const max = find(schema._tests, { name: "max" })
    if (max) {
      swagger.maximum = max.arg
    }

    const valids = schema._valids
      .values()
      .filter((s: any) => typeof s === "number")
    if (get(schema, "_flags.allowOnly") && valids.length) {
      swagger.enum = valids
    }

    return swagger
  },
  string: (schema: any) => {
    const swagger: ISwaggerObj = { type: "string" }
    const strict = get(schema, "_settings.convert") === false

    if (find(schema._tests, { name: "alphanum" })) {
      if (strict && find(schema._tests, { name: "lowercase" })) {
        swagger.pattern = patterns.alphanumLower
      } else if (strict && find(schema._tests, { name: "uppercase" })) {
        swagger.pattern = patterns.alphanumUpper
      } else {
        swagger.pattern = patterns.alphanum
      }
    }

    if (find(schema._tests, { name: "token" })) {
      if (find(schema._tests, { name: "lowercase" })) {
        swagger.pattern = patterns.alphanumLower
      } else if (find(schema._tests, { name: "uppercase" })) {
        swagger.pattern = patterns.alphanumUpper
      } else {
        swagger.pattern = patterns.alphanum
      }
    }

    if (find(schema._tests, { name: "email" })) {
      swagger.format = "email"
      if (swagger.pattern) delete swagger.pattern
    }

    if (find(schema._tests, { name: "isoDate" })) {
      swagger.format = "date-time"
      if (swagger.pattern) delete swagger.pattern
    }

    const pattern = find(schema._tests, { name: "regex" })
    if (pattern) {
      swagger.pattern = pattern.arg.pattern.toString().slice(1, -1)
    }

    for (let i = 0; i < schema._tests.length; i++) {
      const test = schema._tests[i]
      if (test.name === "min") {
        swagger.minLength = test.arg
      }

      if (test.name === "max") {
        swagger.maxLength = test.arg
      }

      if (test.name === "length") {
        swagger.minLength = test.arg
        swagger.maxLength = test.arg
      }
    }

    const valids = schema._valids
      .values()
      .filter((s: any) => typeof s === "string")
    if (get(schema, "_flags.allowOnly") && valids.length) {
      swagger.enum = valids
    }

    return swagger
  },
  binary: (schema: any) => {
    const swagger: ISwaggerObj = { type: "string", format: "binary" }

    if (get(schema, "_flags.encoding") === "base64") {
      swagger.format = "byte"
    }

    for (let i = 0; i < schema._tests.length; i++) {
      const test = schema._tests[i]
      if (test.name === "min") {
        swagger.minLength = test.arg
      }

      if (test.name === "max") {
        swagger.maxLength = test.arg
      }

      if (test.name === "length") {
        swagger.minLength = test.arg
        swagger.maxLength = test.arg
      }
    }

    return swagger
  },
  date: (/* schema */) => ({ type: "string", format: "date-time" }),
  boolean: (/* schema */) => ({ type: "boolean" }),
  alternatives: (
    schema: ISwaggerObj,
    existingComponents: any,
    newComponentsByRef: any
  ) => {
    const index = meta(schema, "swaggerIndex") || 0

    const matches = get(schema, ["_inner", "matches"])
    const firstItem = get(matches, [0])

    let itemsSchema
    if (firstItem.ref) {
      if (schema._baseType && !firstItem.otherwise) {
        itemsSchema = index ? firstItem.then : schema._baseType
      } else {
        itemsSchema = index ? firstItem.otherwise : firstItem.then
      }
    } else if (index) {
      itemsSchema = get(matches, [index, "schema"])
    } else {
      itemsSchema = firstItem.schema
    }

    if (!itemsSchema) {
      return
    }

    const items = parseToSwagger(
      itemsSchema,
      Object.assign({}, existingComponents || {}, newComponentsByRef || {})
    )

    if (get(itemsSchema, "_flags.presence") === "required") {
      items.swagger.__required = true
    }

    merge(newComponentsByRef, items.components || {})

    return items.swagger
  },
  array: (
    schema: ISwaggerObj,
    existingComponents: any,
    newComponentsByRef: any
  ) => {
    const index = meta(schema, "swaggerIndex") || 0
    const itemsSchema = get(schema, ["_inner", "items", index])

    if (!itemsSchema) {
      return { type: "array" }
    }

    const items = parseToSwagger(
      itemsSchema,
      merge({}, existingComponents || {}, newComponentsByRef || {})
    )

    merge(newComponentsByRef, items.components || {})

    const swagger: ISwaggerObj = { type: "array" }

    for (let i = 0; i < schema._tests.length; i++) {
      const test = schema._tests[i]
      if (test.name === "min") {
        swagger.minItems = test.arg
      }

      if (test.name === "max") {
        swagger.maxItems = test.arg
      }

      if (test.name === "length") {
        swagger.minItems = test.arg
        swagger.maxItems = test.arg
      }
    }

    if (find(schema._tests, { name: "unique" })) {
      swagger.uniqueItems = true
    }

    swagger.items = items.swagger
    return swagger
  },
  object: (schema: any, existingComponents: any, newComponentsByRef: any) => {
    const requireds: any[] = []
    const properties: ISwaggerObj = {}

    const combinedComponents = merge(
      {},
      existingComponents || {},
      newComponentsByRef || {}
    )

    const children = get(schema, "_inner.children") || []
    children.forEach((child: any) => {
      const key = child.key
      if (!child.schema) return
      const prop = parseToSwagger(child.schema, combinedComponents)
      if (!prop.swagger) {
        // swagger is falsy if joi.forbidden()
        return
      }

      merge(newComponentsByRef, prop.components || {})
      merge(combinedComponents, prop.components || {})

      properties[key] = prop.swagger

      if (
        get(child, "schema._flags.presence") === "required" ||
        prop.swagger.__required
      ) {
        requireds.push(key)
        delete prop.swagger.__required
      }
    })

    const swagger: ISwaggerObj = { type: "object" }
    if (requireds.length) {
      swagger.required = requireds
    }
    swagger.properties = properties

    if (get(schema, "_flags.allowUnknown") === false) {
      swagger.additionalProperties = false
    }

    return swagger
  },
  any: (schema: any, existingDefinitions: any, newDefinitionsByRef: any) => {
    const swagger: ISwaggerObj = {}
    for (let i = 0; i < schema._tests.length; i++) {
      const test = schema._tests[i]
      if (test.name === "min") {
        swagger.minLength = test.arg
      }

      if (test.name === "max") {
        swagger.maxLength = test.arg
      }

      if (test.name === "length") {
        swagger.minLength = test.arg
        swagger.maxLength = test.arg
      }
    }
    const valids = schema._valids.values()
    if (valids.length) {
      swagger.oneOf = valids.map(
        (itemsSchema: any) =>
          parseToSwagger(
            itemsSchema,
            Object.assign(
              {},
              existingDefinitions || {},
              newDefinitionsByRef || {}
            )
          ).swagger
      )
    }
    // convert property to file upload, if indicated by meta property
    if (getJoiMetaProperty(schema, "swaggerType") === "file") {
      swagger.type = "file"
      swagger.in = "formData"
    }
    if (schema._description) {
      swagger.description = schema._description
    }
    return swagger
  },
  lazy: (
    schema: any,
    existingDefinitions: any,
    newDefinitionsByRef: any
  ): any => {
    const fn = get(schema, "_flags.lazy")
    if (fn && !schema.lazied) {
      schema.lazied = true
      const newSchema = fn()
      const parsed = parseAsType[newSchema._type](
        newSchema,
        existingDefinitions,
        newDefinitionsByRef
      )
      return parsed
    }
    return {}
  },
}

export function parseToSwagger(
  schema: any,
  existingComponents?: any
): {
  swagger: ISwaggerObj
  components?: {}
} {
  // inspect(schema);

  if (!schema) throw new Error("No schema was passed.")

  if (typeof schema === "object" && !schema.isJoi) {
    console.log(
      "------------------------ not a joi schema to convert to swagger"
    )
    schema = joi.object().keys(schema)
  }

  if (!schema.isJoi) {
    console.log("Error on joi validation: typeof schema", typeof schema, schema)
    return { swagger: {}, components: {} }
    // throw new TypeError("Passed schema does not appear to be a joi schema.")
  }
  const override = meta(schema, "swagger")
  if (override && meta(schema, "swaggerOverride")) {
    return { swagger: override, components: {} }
  }

  const metaDefName = meta(schema, "className")
  const metaDefType = meta(schema, "classTarget") || "schemas"

  if (metaDefType && metaDefType === "definitions" && metaDefName) {
    const allOf = meta(schema, "allOf")
    const refSwagger = refDef(metaDefType, metaDefName)
    if (allOf) {
      const parsedSwagger = parseToSwagger(allOf)
      return {
        swagger: { allOf: [refSwagger, parsedSwagger.swagger] },
      }
    }
    return { swagger: refSwagger }
  }

  // if the schema has a definition class name, and that
  // definition is already defined, just use that definition
  // console.log("------metaDefName:", metaDefName)
  if (metaDefName && get(existingComponents, [metaDefType, metaDefName])) {
    const refSwagger = refDef(metaDefType, metaDefName)
    return { swagger: refSwagger }
  }

  const components = {}
  if (get(schema, "_flags.presence") === "forbidden") {
    return { swagger: {}, components }
  }

  if (typeof parseAsType[schema._type] === "undefined") {
    throw new TypeError(`${schema._type} is not a recognized Joi type.`)
  }
  const swagger = parseAsType[schema._type](
    schema,
    existingComponents,
    components
  )

  if (!swagger) {
    return { swagger, components }
  }

  if (schema._valids && schema._valids.has(null)) {
    swagger.nullable = true
  }

  if (schema._description) {
    swagger.description = schema._description
  }

  if (schema._examples.length) {
    if (schema._examples.length === 1) {
      swagger.example = extractExampleValue(schema._examples[0])
    } else {
      swagger.examples = schema._examples.map(extractExampleValue)
    }
  }

  const label = get(schema, "_flags.label")
  if (label) {
    swagger.title = label
  }

  const defaultValue = get(schema, "_flags.default")
  if (defaultValue && typeof defaultValue !== "function") {
    swagger.default = defaultValue
  }

  if (metaDefName) {
    set(components, [metaDefType, metaDefName], swagger)
    return { swagger: refDef(metaDefType, metaDefName), components }
  }

  if (override) {
    Object.assign(swagger, override)
  }

  return { swagger, components }
}

function meta(schema: any, key: string) {
  const flattened = Object.assign.apply(
    null,
    ([{}] as any).concat(schema._meta)
  )

  return get(flattened, key)
}

function refDef(type: string, name: string) {
  if (type === "definitions") {
    return {
      $ref: "#/definitions/" + name,
    }
  }
  return { $ref: "#/components/" + type + "/" + name }
}

function extractExampleValue(example: any) {
  return typeof example.value === "undefined" ? example : example.value
}
