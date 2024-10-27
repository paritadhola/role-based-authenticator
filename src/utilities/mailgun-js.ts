import Mailgun from "mailgun-js"

const apiKey = process.env.MAIL_API_KEY
const domain = process.env.MAIL_DOMAIN

var mailgun = new Mailgun({
  apiKey: apiKey as string,
  domain: domain as string,
})

const data = {
  from: "Excited User <me@samples.mailgun.org>",
  to: "ndhola2580@gmail.com",
  subject: "OTP Verification",
  text: "Enter the OTP",
}

export function sendOTP(OTP: string, to: string) {
  const mailData = {
    ...data,
    text: `Your Verification OTP is ${OTP}`,
    to: to,
  }
  mailgun.messages().send(mailData, (error, body) => {
    console.log(body)
  })
}
