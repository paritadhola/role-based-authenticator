export const objectIdRegex = /^[0-9a-f]{24}$/
export const mysqlIdRegex = /^[1-9]{1}[0-9]{0,8}$/
export const pincodeRegex = /^[1-9]{1}[0-9]{5}$/
export const contactRegex = /^[1-9]{1}[0-9]{9}$/
export const passwordRegex = /^[a-zA-Z0-9]{3,16}$/

export const timezone = "Asia/Kolkata"
export enum PROVIDER {
    GOOGLE="google",
    FACEBOOK="facebook"
}
