import { IAuthenticatedRequest } from "../middleware/auth"
import Joi from "@hapi/joi"
import {
  IRequestSchema,
  joi400Resp,
  joi401Resp,
} from "../middleware/validate/joi.middleware"
import UserModel from "../../../db/models/user"
import { objectIdRegex } from "../../../constants"

export interface IRegistrationRequest extends IAuthenticatedRequest {
  body: {
    firstName: string
    lastName: string
    email: string
    number: number
    password: string
  }
}

export const IRegistrationSchema: IRequestSchema = {
  body: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    number: Joi.number().min(1111111111).max(9999999999).required(),
    password: Joi.string().min(8).max(16).required(),
  }),
}

export const registerUserResponseSchema = Joi.object({
  "200": Joi.object({
    status: Joi.number().valid(1).required(),
    response: Joi.object().meta({
      className: UserModel.modelName,
      classTarget: "definitions",
    }),
  }),
  "400": joi400Resp,
  "401": joi401Resp,
})

export interface IUpdateUserRequest extends IAuthenticatedRequest {
  params: {
    userId: string
  }
  body: {
    firstName: string
    lastName: string
  }
}

export const IUpdateUserSchema: IRequestSchema = {
  params: Joi.object({
    userId: Joi.string().regex(objectIdRegex).required(),
  }),
  body: Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
  }),
}

export const updateUserResp = Joi.object({
  "200": Joi.object({
    status: Joi.number().valid(1).required(),
    message: Joi.string(),
    response: Joi.object({}),
  }),
  "400": joi400Resp,
  "401": joi401Resp,
})

export interface IVerifyProviderSignUpRequest extends IAuthenticatedRequest {
  body: {
    tokenId: string
  }
}

export const IVerifyProviderSignUpSchema: IRequestSchema = {
  body: Joi.object({
    tokenId: Joi.string().required(),
  }),
}

export const verifyProviderSignUpResp = Joi.object({
  "200": Joi.object({
    status: Joi.number().valid(1).required(),
    message: Joi.string(),
    response: Joi.object({}),
  }),
  "400": joi400Resp,
  "401": joi401Resp,
})

export interface IListUsersRequest extends IAuthenticatedRequest {
  params: {
    userId: string
  }
  body: {
    filter: Object
  }
}

export const IListUsersSchema: IRequestSchema = {
  params: Joi.object({
    userId: Joi.string().regex(objectIdRegex).required(),
  }),
  body: Joi.object({
    filter: Joi.object().optional(),
  }),
}

export const listUsersResp = Joi.object({
  "200": Joi.object({
    status: Joi.number().valid(1).required(),
    message: Joi.string(),
    response: Joi.object({}),
  }),
  "400": joi400Resp,
  "401": joi401Resp,
})
