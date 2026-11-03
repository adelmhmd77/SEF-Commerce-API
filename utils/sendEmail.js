const nodemailer = require("nodemailer")

 const sendEmail = async({to,subject,html})=>{
  const transporter =  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth:{
      user:process.env.EMAIL_USER,
      pass:process.env.EMAIL_PASS
    }
  })

return await transporter.sendMail({
    from:process.env.EMAIL_USER,
    to:to,
    subject:subject,
    html:html
  }
  )
  }
  
  module.exports = sendEmail


