const https = require('https')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const jsonServer = require('json-server')

const rewriteRules = {
  '/api/*': '/$1',
  '/blog/:resource/:id/show': '/:resource/:id',
}

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()
server.use(middlewares)

// Add middleware to modify the db.json file before sending a response
server.use((req, res, next) => {
  // Call the original JSON server router to handle the request and response
  router(req, res, () => {
    // After the response is sent, modify the db.json file if necessary
    const fs = require('fs')
    const dbJsonStr = fs.readFileSync('db.json', 'utf8')
    const dbJson = JSON.parse(dbJsonStr)
    // Modify the db.json file here if necessary
    fs.writeFileSync('db.json', JSON.stringify(dbJson, null, 2))
  })
})

server.use(jsonServer.rewriter(rewriteRules))
server.use(router)

const options = {
  key: fs.readFileSync('./config/cert.key'),
  cert: fs.readFileSync('./config/cert.crt'),
}

const httpsServer = https.createServer(options, server)

httpsServer.listen(8000, '0.0.0.0', () => {
  console.log('Listening on port 8000')
})
