import '@/styles/globals.css'
import '@/styles/main.scss'
import Image from 'next/image'
import type { AppProps } from 'next/app'
import MobileLayout from '../components/mobile/Layout'
import Layout from '../components/desktop/Layout'
import { isBrowser } from 'react-device-detect'
import { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'

export default function App({ Component, pageProps }: AppProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isBrowser) {
      setIsMobile(true)
    } else {
      setIsMobile(false)
    }
  }, [])

  return (
    <>
      {isMobile === null ? (
        <div
          style={{
            height: '100%',
            width: '100%',
            background: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'fixed',
            overflow: 'hidden',
          }}
        >
          <Box className="mobile" sx={{ flexGrow: 1, height: '100%', width: '100%' }}>
            <div
              style={{
                height: '100%',
                background: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexDirection: 'column',
                backgroundImage: 'url( "/bg.jpg" )',
                backgroundSize: 'cover',
              }}
            >
              <Typography gutterBottom variant="h4" component="div" align="center" style={{ marginTop: '30%', color: '#ff5000' }}>
                <Image priority src="/title.png" alt="title" width={120} height={60}></Image>
              </Typography>
            </div>
          </Box>
        </div>
      ) : isMobile ? (
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
