import { Container } from "inversify"
import { Types } from "./types"

// declare metadata by @controller annotation

// import "./service/rest/controllers/User.controllers"
import "./service/rest/controllers/Login.controllers"
import "./service/rest/controllers/Users.controllers"

// import { UserRepository } from "./service/rest/repository/User.repository"
import { LoginRepository } from "./service/rest/repository/Login.repository"
import { UserRepository } from "./service/rest/repository/Users.repository"

// set up container
export const container = new Container()

container.bind<UserRepository>(Types.UserRepository).to(UserRepository)

container.bind<LoginRepository>(Types.LoginRepository).to(LoginRepository)

