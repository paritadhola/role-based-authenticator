import { OAuth2Client } from "google-auth-library"
import { InvalidInput } from "../../../utilities/customError"
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export const verifyGoogleUser = async (tokenId: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: tokenId,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  if (ticket.getPayload()) {
    const profile = ticket.getPayload()
    return {
      name: profile?.name,
      email: profile?.email,
    }
  }

  throw new InvalidInput("Invalid Google User")
}
