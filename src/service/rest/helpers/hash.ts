import bcrypt from "bcryptjs"
export const genHash = (pwd: string, sr: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(pwd, sr, function (err, hash) {
      if (err) {
        reject(0)
      } else {
        resolve(hash)
      }
    })
  })
}
