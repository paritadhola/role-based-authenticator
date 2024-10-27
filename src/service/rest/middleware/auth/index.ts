import { Request, Response, NextFunction } from "express"
import * as jwt from "jsonwebtoken"
import * as path from "path"
import * as fs from "fs"
import { InvalidInput } from "../../../../utilities/customError"
import { UploadedFile } from "express-fileupload"
import { Roles } from "../../../../db/models/user"

export interface IUnauthenticatedRequests
  extends Omit<Request, "query" | "params" | "files"> {
  params: {
    [k: string]: number | string
  }
  query: {
    [k: string]: number | string | undefined | Date | boolean
  }
  files?: {
    [k: string]: UploadedFile | UploadedFile[] | undefined
  }
}
export interface IAuthenticatedRequest extends IUnauthenticatedRequests {
  user: string
}

const privateKey = fs
  .readFileSync(path.join(__dirname, "../../../../secrets/jwtRS512.key"))
  .toString()

const publicKey = fs
  .readFileSync(path.join(__dirname, "../../../../secrets/jwtRS512.pub.key"))
  .toString()

const OPTIONS = {
  issuer: "myapp",
  expiresIn: "4h",
  algorithm: "RS256",
}

//@ts-ignore
export const sign = (payload: object) => jwt.sign(payload, privateKey, OPTIONS)

export const verify = (token: string) => {
  try {
    return jwt.verify(token, publicKey, OPTIONS)
  } catch (err) {
    return false
  }
}

export const authenticate =
  (roles?: Roles[], isUserId?: boolean) =>
  async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = (req.get("authorization") || "").replace(/Bearer /, "")
      console.log(token)
      if (!token) {
        throw new InvalidInput("Unauthorized access", 401)
      }
      console.log("after", token)
      let decoded: any = await jwt.verify(token, publicKey, OPTIONS)

      if (roles && roles.indexOf(decoded.role) === -1) {
        console.log("inside role", token)
        throw new InvalidInput(
          "Unauthorized access: This User does not have sufficient Permission",
          401
        )
      }

      if (isUserId && decoded.userId !== req.params.userId) {
        console.log("inside user", decoded.userId, req.params)
        throw new InvalidInput("Invalid User access", 401)
      }
      next()
    } catch (err) {
      res.status(401).send({
        status: 0,
        message: err ? err.toString() : "UnAuthorized Access",
      })
    }
  }
