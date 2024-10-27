import { ValidationErrorItem } from "@hapi/joi"

export const formatMessage = (errors: ValidationErrorItem[]) => {
  return errors.map((err) => {
    const { context } = err
    if (typeof context === "undefined") {
      return err
    }
    switch (err.type) {
      case "any.required":
        err.message = `${context.label} is required`
        break
      case "any.empty":
        err.message = `${context.label} should not be empty`
        break
      case "string.email":
        err.message = `${context.label} must be a valid email`
        break
      case "string.regex.base":
        err.message = `${context.label} not in valid format`
        break
      case "string.min":
        err.message = `${context.label} length must be at least ${context.limit} characters long`
        break
      case "number.base":
        err.message = `${context.label} must be a Number`
        break
      case "number.integer":
        err.message = `${context.label} must be an integer`
        break
      case "number.less":
        err.message = `${context.label} must be less than ${context.limit}`
        break
      case "object.allowUnknown":
        err.message = `${context.key} is not allowed`
        break
      default:
        break
    }
    return err
  })
}
