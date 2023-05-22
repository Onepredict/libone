import type { NextApiRequest, NextApiResponse } from 'next'
import webpush from 'web-push'
import url from 'url'

export default async function test(req: NextApiRequest, res: NextApiResponse) {
  const obj = JSON.parse(String(req.query.subscribe))
  const pushConfig = {
    endpoint: obj.endpoint,
    keys: {
      auth: obj.keys.auth,
      p256dh: obj.keys.p256dh,
    },
  }
  const VAPID = {
    publicKey: 'BE6Yd8TdwXLeFQNTv8QK0_1d35uxleERCDqSHZbTOvzLMVSmd4BtHCTLQr5mPN4NVrig6MWtU18sh_-X9W6676k',
    privateKey: 'R9flGuu0fKC1wFkDZxVVBwfoJHl-zsftgJ0kIwaLLLM',
  }

  const parsedUrl = url.parse(obj.endpoint)
  const audience = parsedUrl.protocol + '//' + parsedUrl.hostname

  const vapidHeaders = webpush.getVapidHeaders(
    audience,
    'mailto: yoonyoung.choi@onepredict.com',
    VAPID.publicKey,
    VAPID.privateKey,
    'aes128gcm'
  )

  webpush
    .sendNotification(
      pushConfig,
      JSON.stringify({
        title: '푸쉬 메세지 테스트',
        context: '테스트~~~',
      }),
      {
        headers: vapidHeaders,
      }
    )
    .then(() => {
      console.log('Push notification sent successfully.')
    })
    .catch((error) => {
      console.error('Error sending push notification:', error)
    })
}
