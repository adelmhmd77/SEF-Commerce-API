const nodemailer = require('nodemailer');

const {
  orderConfirmationEmail,
  orderStatusEmail,
} = require('./emailTemplates');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Base email function used by all email helpers.
const sendEmail = async ({ to, subject, text, html }) => {
  return await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
};

// Send a confirmation email after successful payment.
const sendOrderConfirmationEmail = async (order, user) => {
  try {
    const recipient = user?.email;

    if (!recipient) {
      console.error(
        'Order confirmation email was not sent: user email is missing'
      );
      return;
    }

    const email = orderConfirmationEmail(order, user);

    await sendEmail({
      to: recipient,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
  } catch (error) {
    // Email failure must not break the successful payment request.
    console.error(
      `Order confirmation email error: ${error.message}`
    );
  }
};

// Send an email after the order status changes.
const sendOrderStatusEmail = async (order, user) => {
  try {
    const recipient = user?.email;

    if (!recipient) {
      console.error(
        'Order status email was not sent: user email is missing'
      );
      return;
    }

    const email = orderStatusEmail(order, user);

    await sendEmail({
      to: recipient,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
  } catch (error) {
    // Email failure must not break the order status update.
    console.error(
      `Order status email error: ${error.message}`
    );
  }
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
};