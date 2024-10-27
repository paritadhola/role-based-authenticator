import { injectable } from "inversify"
import { PROVIDER } from "../../../constants"
import UserModel from "../../../db/models/user"
import { InvalidInput } from "../../../utilities/customError"
import { genHash } from "../helpers/hash"
import {
  IRegistrationRequest,
  IUpdateUserRequest,
} from "../req.schema/users.schema"
import { verifyGoogleUser } from "../utility/providers"

@injectable()
export class UserRepository {
  generateRandomPassword() {
    return `${Math.random()}`
  }

  async registerUser({
    firstName,
    lastName,
    email,
    number,
    password,
  }: IRegistrationRequest["body"]) {
    const userDoc: { [k: string]: any } = {
      firstName,
      lastName,
      email,
      number,
      password,
    }
    const hashPassword = await genHash(
      userDoc.password || this.generateRandomPassword(),
      10
    )
    const result = await UserModel.create({
      ...userDoc,
      password: hashPassword,
    })
    return result
  }

  async updateUser(userId: string, userDetails: IUpdateUserRequest["body"]) {
    const updateRes = await UserModel.updateOne(
      {
        _id: userId,
      },
      {
        $set: {
          ...userDetails,
        },
      }
    )
    if (updateRes.n !== 1) {
      throw new InvalidInput("No user found to update")
    }
    return Promise.resolve()
  }

  async verifyUser(tokenId: string, provider: PROVIDER) {
    if (provider === PROVIDER.GOOGLE) {
      const profile = await verifyGoogleUser(tokenId)
      const user = await UserModel.findOne({
        email: profile.email,
      })
      if (user) {
        throw new InvalidInput(
          "User is Already Registered with this email: " + user.email
        )
      }
      return profile
    }
  }

  async listUsers(filter: Object = {}) {
    const users = await UserModel.find(filter)
    return users
  }
}
