import { Request } from "express"
import { CorsOptions } from "cors"
const whitelist = ["http://localhost:3001", "http://localhost:3000"]
export const corsOptionsDelegate = function (
  req: Request,
  callback: (err: Error | null, data: CorsOptions) => void
) {
  const corsOptions: CorsOptions = { origin: false }
  const iIndex = whitelist.indexOf(req.header("Origin") || "")
  if (iIndex !== -1) {
    corsOptions.origin = whitelist[iIndex] // reflect (enable) the requested origin in the CORS response
    // corsOptions.allowedHeaders = ["authorization","content-type","Cookie"]
    // corsOptions.credentials = true
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}
