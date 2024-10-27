import { inject } from "inversify"
import { controller, httpPost, httpPut } from "inversify-express-utils"
import { Types } from "../../../types"
import { validateReq } from "../middleware/validate/joi.middleware"
import { UserRepository } from "../repository/Users.repository"
import {
  IRegistrationRequest,
  IRegistrationSchema,
  IUpdateUserRequest,
  IUpdateUserSchema,
  verifyProviderSignUpResp,
  IVerifyProviderSignUpSchema,
  registerUserResponseSchema,
  updateUserResp,
  IVerifyProviderSignUpRequest,
  IListUsersSchema,
  listUsersResp,
  IListUsersRequest,
} from "../req.schema/users.schema"
import { Response } from "express"
import { PROVIDER } from "../../../constants"
import { authenticate } from "../middleware/auth"
import { Roles } from "../../../db/models/user"

@controller("/api/user")
export class UserController {
  constructor(@inject(Types.UserRepository) private userRepo: UserRepository) {}

  @httpPost(
    "/register",
    validateReq(IRegistrationSchema, {
      apiPath: "/api/user/register",
      tags: ["User"],
      responses: registerUserResponseSchema,
      method: "post",
      description: "Register New User",
    })
  )
  async registerUser(req: IRegistrationRequest, res: Response) {
    const response = await this.userRepo.registerUser(req.body)
    res.json({ status: 1, response })
  }

  @httpPut(
    "/update/:userId",
    validateReq(IUpdateUserSchema, {
      apiPath: "/api/user/update/{userId}",
      tags: ["User"],
      method: "put",
      responses: updateUserResp,
      description: "Update User",
    })
  )
  async updateUser(req: IUpdateUserRequest, res: Response) {
    await this.userRepo.updateUser(req.params.userId, req.body)
    res.json({
      status: 1,
      message: "User Updated",
      response: {},
    })
  }

  @httpPost(
    "/verify",
    validateReq(IVerifyProviderSignUpSchema, {
      apiPath: "/api/user/verify",
      tags: ["User"],
      method: "post",
      responses: verifyProviderSignUpResp,
      description: "Verify User with Provider",
    })
  )
  async verifyUser(req: IVerifyProviderSignUpRequest, res: Response) {
    const profile = await this.userRepo.verifyUser(
      req.body.tokenId,
      PROVIDER.GOOGLE
    )
    res.json({
      status: 1,
      message: "User Verified",
      response: profile,
    })
  }

  @httpPost(
    "/list-users/:userId",
    authenticate([Roles.A]),
    validateReq(IListUsersSchema, {
      apiPath: "/api/user/list-users/{userId}",
      tags: ["User"],
      method: "post",
      responses: listUsersResp,
      description: "List users based on filters",
    })
  )
  async listUsers(req: IListUsersRequest, res: Response) {
    const userList = await this.userRepo.listUsers(req.body.filter)
    res.json({
      status: 1,
      message: "Users are fetched",
      reponse: userList,
    })
  }
}
