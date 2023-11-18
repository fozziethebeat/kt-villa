import { Mailer } from '@redwoodjs/mailer-core'
import { NodemailerMailHandler } from '@redwoodjs/mailer-handler-nodemailer'
import { ReactEmailRenderer } from '@redwoodjs/mailer-renderer-react-email'

import { logger } from 'src/lib/logger'

export const mailer = new Mailer({
  handling: {
    handlers: {
      nodemailer: new NodemailerMailHandler({
        transport: {
          host: process.env.MAILER_SMTP_HOST,
          port: process.env.MAILER_SMTP_PORT,
          secure: true,
          auth: {
            user: process.env.MAILER_SMTP_USERNAME,
            pass: process.env.MAILER_SMTP_PASSWORD,
          },
        },
      }),
    },
    default: 'nodemailer',
  },

  rendering: {
    renderers: {
      reactEmail: new ReactEmailRenderer(),
    },
    default: 'reactEmail',
  },

  logger,

  defaults: {
    from: process.env.MAILER_FROM,
    replyTo: process.env.MAILER_REPLY_TO,
  },

  /**
   * Just always use nodemailer
   */
  development: {
    when: process.env.NODE_ENV !== 'production',
    handler: 'nodemailer',
  },
})
