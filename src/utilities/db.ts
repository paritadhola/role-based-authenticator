import mongoose from "mongoose"
import { logger } from "../logger"
const dbURL = process.env.DATABASE_URL
const dbName = process.env.DATABASE_NAME
mongoose.set("useCreateIndex", true)
mongoose.set("useFindAndModify", false)
mongoose.set("useCreateIndex", true)
mongoose.set("useUnifiedTopology", true)

export function reconnectDb() {
  logger.debug(`Connecting mongodb...`)
  mongoose.connect(dbURL as string, { useNewUrlParser: true, dbName })
}

reconnectDb()
