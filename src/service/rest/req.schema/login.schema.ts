import Joi from "@hapi/joi"
import { IAuthenticatedRequest } from "../middleware/auth"
import {
  IRequestSchema,
  joi401Resp,
  joi400Resp,
} from "../middleware/validate/joi.middleware"
import user, { Roles } from "../../../db/models/user"
import { objectIdRegex } from "../../../constants"

export interface ILoginReq extends IAuthenticatedRequest {
  body: {
    username: string
    password: string
    OTP?: string
    latitude?: number
    longitude?: number
    deviceId?: string
  }
}

export const loginSchema: IRequestSchema = {
  body: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(6).max(16).required(),
    OTP: Joi.string().allow(""),
    deviceId: Joi.string().allow(""),
    latitude: Joi.number().min(0).max(90),
    longitude: Joi.number().min(-180).max(180),
  }),
}

export const loginResp = Joi.object({
  "200": Joi.object({
    status: Joi.number().valid(1, 2).required(),
    response: Joi.object({
      otpRequired: Joi.boolean(),
      deviceId: Joi.string(),
      user: Joi.object().meta({
        className: user.modelName,
        classTarget: "definitions",
        allOf: Joi.object({
          userType: Joi.object({
            typeName: Joi.string(),
            allowAttendanceFromAnywhere: Joi.boolean(),
          }),
        }),
      }),
      bookingCount: Joi.number(),
      thisMonthAttendanceCount: Joi.number().required(),
    }),
    message: Joi.string().required(),
    accessToken: Joi.string().required(),
    username: Joi.number().required(),
    role: Joi.string().required(),
  }),
  "400": joi400Resp,
  "401": joi401Resp,
})

export interface IForgotPasswordReq extends IAuthenticatedRequest {
  body: {
    number: number
    retryCount?: number
  }
}

export const forgotPasswordSchema: IRequestSchema = {
  body: Joi.object({
    number: Joi.number().min(1000000000).max(9999999999).required(),
    retryCount: Joi.number().allow(""),
  }),
}

export const forgotPasswordResp = Joi.object({
  "200": Joi.object({
    status: Joi.number().valid(1).required(),
    response: Joi.object().valid(null).meta({
      className: user.modelName,
      classTarget: "definitions",
    }),
    message: Joi.string().required(),
  }),
  "400": joi400Resp,
  "401": joi401Resp,
})

export interface IVerifyOTPReq extends IAuthenticatedRequest {
  body: {
    number: number
    OTP: string
    latitude?: number
    longitude?: number
    deviceId?: string
  }
}

export const verifyOTPSchema: IRequestSchema = {
  body: Joi.object({
    number: Joi.number().min(1000000000).max(9999999999).required(),
    OTP: Joi.string().required(),
    latitude: Joi.number().min(0).max(90),
    longitude: Joi.number().min(-180).max(180),
    deviceId: Joi.string().allow(""),
  }),
}

export const verifyOTPResp = Joi.object({
  "200": Joi.object({
    status: Joi.number().valid(1).required(),
    message: Joi.string().required(),
    response: Joi.object({
      deviceId: Joi.string(),
    }),
  }),
  "400": joi400Resp,
  "401": joi401Resp,
})

export interface ISetPasswordReq extends IAuthenticatedRequest {
  body: {
    password: string
    number: number
    OTP: string
  }
}

export const setPasswordSchema: IRequestSchema = {
  body: Joi.object({
    password: Joi.string().min(6).max(16).required(),
    number: Joi.number().min(1000000000).max(9999999999).required(),
    OTP: Joi.string().required(),
  }),
}

export const setPasswordResp = Joi.object({
  "200": Joi.object({
    status: Joi.number().valid(1).required(),
    response: Joi.object().valid(null).meta({
      className: user.modelName,
      classTarget: "definitions",
    }),
    message: Joi.string().required(),
  }),
  "400": joi400Resp,
  "401": joi401Resp,
})

export interface IChangePasswordReq extends IAuthenticatedRequest {
  params: {
    userId: string
  }
  body: {
    password: string
    newPassword: string
  }
}

export const changePasswordSchema: IRequestSchema = {
  params: Joi.object({
    userId: Joi.string().regex(objectIdRegex).required(),
  }),
  body: Joi.object({
    password: Joi.string().min(6).max(16).required(),
    newPassword: Joi.string().min(6).max(16).required(),
  }),
}

export const changePasswordResp = Joi.object({
  "200": Joi.object({
    status: Joi.number().valid(1).required(),
    response: Joi.object().valid(null).meta({
      className: user.modelName,
      classTarget: "definitions",
    }),
    message: Joi.string().required(),
  }),
  "400": joi400Resp,
  "401": joi401Resp,
})

export interface ILoginWithProvider extends IAuthenticatedRequest {
  body: {
    tokenId: string
  }
}

export const loginWithProviderSchema: IRequestSchema = {
  body: Joi.object({
    tokenId: Joi.string().required(),
  }),
}

export const loginWithProviderResp = Joi.object({
  "200": Joi.object({
    status: Joi.number().valid(1).required(),
    message: Joi.string().required(),
    response: Joi.object({}),
    role: Roles,
    accessToken: Joi.string().required(),
  }),
  "400": joi400Resp,
  "401": joi401Resp,
})
