import nodemailer from 'nodemailer';

const mailer = nodemailer.createTransport({
  host: process.env.MAILER_SMTP_HOST,
  port: parseInt(process.env.MAILER_SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.MAILER_SMTP_USERNAME,
    pass: process.env.MAILER_SMTP_PASSWORD,
  },
} as any);

export { mailer };
