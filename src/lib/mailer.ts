import nodemailer from 'nodemailer';

const mailer = nodemailer.createTransport({
  host: process.env.MAILER_SMTP_HOST,
  port: process.env.MAILER_SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.MAILER_SMTP_USERNAME,
    pass: process.env.MAILER_SMTP_PASSWORD,
  },
});

export {mailer};
