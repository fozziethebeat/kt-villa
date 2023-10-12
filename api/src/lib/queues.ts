import Queue from 'bull'

export const genItemQueue = new Queue('GenItemQueue', process.env.REDIS_URL)
