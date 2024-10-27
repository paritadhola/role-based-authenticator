import Joi from "@hapi/joi"
export const imageJoiSchema = Joi.object({
  name: Joi.string()
    .regex(/(\.png|\.jpg|\.jpeg)$/i)
    .required(),
  mimetype: Joi.string()
    .regex(/^image\//i)
    .required(),
  size: Joi.number().max(600000).required(),
})

export const imageNPdfJoiSchema = Joi.object({
  name: Joi.string()
    .regex(/(\.png|\.jpg|\.jpeg|\.pdf)$/i)
    .required(),
  mimetype: Joi.string()
    .regex(/^image\/|(application\/pdf)$/i)
    .required(),
  size: Joi.number().max(5000000).required(),
})
