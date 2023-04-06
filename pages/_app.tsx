import '@/styles/globals.css'
import '@/styles/main.scss'
import type { AppProps } from 'next/app'
import MobileLayout from '../components/mobile/Layout'
import Layout from '../components/desktop/Layout'
import { isBrowser } from 'react-device-detect'
import { useEffect, useState } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!isBrowser) {
      setIsMobile(true)
    }
  }, [])

  return (
    <>
      {isMobile ? (
        <MobileLayout>
          <Component {...pageProps} />
        </MobileLayout>
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </>
  )
}
