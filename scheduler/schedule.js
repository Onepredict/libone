const schedule = require('node-schedule')
const axios = require('axios')
const url = require('url')
const webpush = require('web-push')
const nodemailer = require('nodemailer')

require('dotenv').config()
const IP_ADDRESS = 'http://10.10.30.72:8000'

console.log('[' + new Date() + '] ', 'Start Scheduler.....')
const cronExpression = '0 12 * * 1-5'
//const cronExpression = '*/10 * * * * *'
const job1 = schedule.scheduleJob(cronExpression, function () {
  axios
    .get(IP_ADDRESS + '/books')
    .then((res) => {
      res.data.map((v) => {
        if (v.rentable === 'Y') {
          checkedExpiration(v.startRentDate, v)
        }
      })
      console.log('[' + new Date() + '] ', 'Checking out old books.....')
    })
    .catch((error) => {
      console.log('[' + new Date() + '] ', 'AxiosError: Connection failed.... ')
    })
})

const checkedExpiration = (date, v) => {
  const nowDate = new Date()
  const rentDate = new Date(date)
  const diffTime = Math.floor(Math.abs(nowDate - rentDate) / (1000 * 60 * 60 * 24))
  if (diffTime > 14 && v.returnCheckYn === 'N') {
    console.log('[' + new Date() + '] ', 'Find old book.... ')
    axios.get(IP_ADDRESS + '/user').then((res) => {
      res.data.map((user) => {
        if (user.email === v.lender) {
          const obj = user.subscribe
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

          webpush.setVapidDetails('mailto:yoonyoung.choi@onepredict.com', VAPID.publicKey, VAPID.privateKey)

          sendCheckMail(v.lender, `Onepredict Libone`, `[${v.title}] 대여 2주 경과\n반납 여부를 확인해 주세요 :)`)

          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: `Onepredict Libone`,
                context: `[${v.title}] 대여 2주 경과\n반납 여부를 확인해 주세요 :)`,
              })
            )
            .then((res) => {
              v.returnCheckYn = 'Y'
              axios.put(IP_ADDRESS + '/books/' + v.id, v).then((response) => {
                console.log('[' + new Date() + '] ', 'subscribe update success')
              })
            })
            .catch((error) => {
              console.error('[' + new Date() + '] ', 'Error sending push notification:', error)
            })
        }
      })
    })
  }
}

const transporter = nodemailer.createTransport({
  host: '10.10.30.72',
  secure: false, // Set it to true if you are using a secure connection (e.g., SSL/TLS)
  port: 25,
  debug: true,
  tls: {
    rejectUnauthorized: false,
  },
})

const sendCheckMail = (lcpter, title, contents) => {
  const mailOptions = {
    from: 'guardionepdx@gmail.com',
    to: lcpter,
    subject: title + ' 장기 대여 확인 메일',
    text: contents + `\nhttps://book.onepredict.com`,
  }
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error occurred while sending email:', error.message)
    } else {
      console.log('Email sent successfully!')
      console.log('Message ID:', info)
    }
  })
}
