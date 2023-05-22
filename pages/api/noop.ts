import { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Set desired value here
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).end('noop')
}
