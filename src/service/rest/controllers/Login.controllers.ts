import { controller, httpPost } from "inversify-express-utils"
import { validateReq } from "../middleware/validate/joi.middleware"
import { Types } from "../../../types"
import {
  ILoginReq,
  loginSchema,
  loginResp,
  IForgotPasswordReq,
  forgotPasswordSchema,
  forgotPasswordResp,
  IVerifyOTPReq,
  verifyOTPSchema,
  verifyOTPResp,
  ISetPasswordReq,
  setPasswordSchema,
  setPasswordResp,
  IChangePasswordReq,
  changePasswordSchema,
  changePasswordResp,
  loginWithProviderSchema,
  loginWithProviderResp,
  ILoginWithProvider,
} from "../req.schema/login.schema"
import { Response } from "express"
import { inject } from "inversify"
import { LoginRepository } from "../repository/Login.repository"
import { authenticate } from "../middleware/auth"
import { PROVIDER } from "../../../constants"

@controller("/api")
export class LoginController {
  constructor(
    @inject(Types.LoginRepository)
    private LoginRepo: LoginRepository
  ) {}

  @httpPost(
    "/login",
    validateReq(loginSchema, {
      apiPath: "/api/login",
      tags: ["Login"],
      method: "post",
      responses: loginResp,
    })
  )
  async login(req: ILoginReq, res: Response) {
    const { response, accessToken, username, role } =
      await this.LoginRepo.login(req.body)

    res.json({
      status: 1,
      response,
      accessToken,
      username,
      role,
    })
  }

  @httpPost(
    "/generate/otp",
    validateReq(forgotPasswordSchema, {
      apiPath: "/api/generate/otp",
      tags: ["Login"],
      method: "post",
      responses: forgotPasswordResp,
    })
  )
  async forgotPassword(req: IForgotPasswordReq, res: Response) {
    const response = await this.LoginRepo.forgotPassword(req.body.number)
    res.json({
      status: 1,
      message: "Forget Password Successful.",
      sms: response,
    })
  }

  @httpPost(
    "/verify/otp",
    validateReq(verifyOTPSchema, {
      apiPath: "/api/verify/otp",
      tags: ["Login"],
      method: "post",
      responses: verifyOTPResp,
    })
  )
  async verifyOTP(req: IVerifyOTPReq, res: Response) {
    const ip = (
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      ""
    )
      .toString()
      .split(",")[0]
    const userAgent = req.headers["user-agent"] || ""
    const deviceId = await this.LoginRepo.verifyOTP(req.body, ip, userAgent)
    res.json({
      status: 1,
      response: { deviceId },
      message: "OTP verified successfully.",
    })
  }

  @httpPost(
    "/set/password",
    validateReq(setPasswordSchema, {
      apiPath: "/api/set/password",
      tags: ["Login"],
      method: "post",
      responses: setPasswordResp,
    })
  )
  async setPassword(req: ISetPasswordReq, res: Response) {
    const response = await this.LoginRepo.setPassword(
      req.body.password,
      req.body.number,
      req.body.OTP
    )
    res.json({
      status: 1,
      response,
      message: "Password set successfully.",
    })
  }

  @httpPost(
    "/change/password/:userId",
    authenticate(undefined, true),
    validateReq(changePasswordSchema, {
      apiPath: "/api/change/password/{userId}",
      tags: ["Login"],
      method: "post",
      responses: changePasswordResp,
    })
  )
  async changePassword(req: IChangePasswordReq, res: Response) {
    const response = await this.LoginRepo.changePassword(
      req.params.userId,
      req.body.password,
      req.body.newPassword
    )
    res.json({
      status: 1,
      response,
      message: "New password has been set successfully!",
    })
  }

  @httpPost(
    "/provider/login",
    validateReq(loginWithProviderSchema, {
      apiPath: "/api/provider/login",
      tags: ["Login"],
      method: "post",
      responses: loginWithProviderResp,
    })
  )
  async loginWithProvider(req: ILoginWithProvider, res: Response) {
    const { response, role, accessToken } =
      await this.LoginRepo.loginWithProvider(req.body.tokenId, PROVIDER.GOOGLE)
    return res.json({
      status: 1,
      response,
      accessToken,
      role,
    })
  }
}
