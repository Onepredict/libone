self.addEventListener('install', (event) => {
  console.log('Service worker Installing!')
})

self.addEventListener('activate', (event) => {
  console.log('Service worker activate!')
  return self.clients.claim()
})

self.addEventListener('push', (event) => {
  const data = JSON.parse(event.data.text())
  try {
    const promiseChain = displayNoti(data.title, data.context)
    console.log('promiseChain', promiseChain)
    event.waitUntil(promiseChain)
  } catch (e) {
    console.log('error', e)
  }
})

function displayNoti(title, message) {
  const options = {
    body: message,
    icon: '/icons/apple-touch-icon-57x57.png',
    dir: 'ltr',
    lang: 'ko-KR',
    vibrate: [100, 50, 200],
    tag: 'confirm-notificaction',
    renotify: true,
  }
  return self.registration.showNotification(title, options)
}

self.addEventListener('notificationclick', function (event) {
  console.log('notification click')
  const url = 'https://book.onepredict.com/'
  event.notification.close()
  event.waitUntil(clients.openWindow(url))
})
