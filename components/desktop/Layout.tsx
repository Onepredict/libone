import Image from 'next/image'
import { useState, useEffect, cloneElement, useRef } from 'react'
import * as msal from '@azure/msal-browser'
import TopBar from '@/components/mobile/TopBar'
import FooterComp from '@/components/mobile/Footer'
import axios from 'axios'
import { useRouter } from 'next/router'
import { Spin } from 'antd'
import { Button, Box, Typography, Backdrop, Tooltip } from '@mui/material'
import { Layout } from 'antd'
const IP_ADDRESS = process.env.NEXT_PUBLIC_SERVER_URL

const { Content, Footer } = Layout

type AppLayoutProps = {
  children: React.ReactElement
}

type UserInfo = {
  username: string | undefined
  name: string | undefined
  homeAccountId: string | undefined
}

export default function DesktopLayout({ children }: AppLayoutProps) {
  const clientId: string = '957c4123-a854-4e33-979d-cfb6f5bf4f77'
  const config = {
    auth: {
      clientId: clientId,
      redirectUri: 'https://book.onepredict.com/',
      postLogoutRedirectUri: 'https://book.onepredict.com/',
      navigateToLoginRequestUrl: true,
      authority: 'https://login.microsoftonline.com/common',
    },
    cache: {
      cacheLocation: 'localStorage',
    },
  }
  const [msalInstance, onMsalInstanceChange] = useState(new msal.PublicClientApplication(config))
  const [isLogin, setIsLogin] = useState<boolean | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo>({
    username: '',
    name: '',
    homeAccountId: '',
  })
  const [isSpin, setIsSpin] = useState<boolean>(false)

  const router = useRouter()
  useEffect(() => {
    if (router.query.user === 'anonymous') {
      setIsLogin(true)
    }
  }, [userInfo, JSON.stringify(router.query)])

  const handleSpinEvent = (flag: boolean) => {
    setIsSpin(flag)
  }

  const [child, setChild] = useState(cloneElement(children, { isLogin: isLogin, userInfo: userInfo, isSpinning: handleSpinEvent }))

  useEffect(() => {
    if (isLogin) {
      setChild(cloneElement(children, { isLogin: isLogin, userInfo: userInfo, isSpinning: handleSpinEvent }))
    }
  }, [isLogin, children])

  const findMsalAccount = (myAccounts: msal.AccountInfo[]) => {
    for (let i = 0; i < myAccounts.length; i++) {
      if (myAccounts[i].username?.includes('onepredict')) {
        return myAccounts[i]
      }
    }
  }

  const checkAdminUser = (text: string) => {
    axios.get(IP_ADDRESS + '/auths').then((response) => {
      const authUsers = response.data
      let checkedAuth: boolean = false
      for (let i = 0; i < authUsers.length; i++) {
        if (text === 'undefined' || text === '' || authUsers[i].email.includes(text)) {
          sessionStorage.setItem('auth', JSON.stringify({ admin: authUsers[i].email }))
          checkedAuth = true
          break
        }
      }
      checkedAuth ? '' : sessionStorage.removeItem('auth')
    })
  }

  const handleMsalUserInfo = (msal: msal.PublicClientApplication) => {
    const myAccounts = msal.getAllAccounts()
    if (myAccounts.length > 0) {
      const account = findMsalAccount(myAccounts)
      if (account) {
        const userInfo: UserInfo = {
          username: account.username,
          homeAccountId: account.homeAccountId,
          name: account.name,
        }
        setUserInfo(userInfo)
        checkAdminUser(userInfo.username ? userInfo.username : '')
        setIsLogin(true)
      } else {
        setIsLogin(false)
      }
    } else {
      setIsLogin(false)
    }
  }

  const handleLoginEvent = (isLogin: boolean) => {
    setIsLogin(isLogin)
  }

  const loginRequest = {
    scopes: ['User.Read'],
  }

  const loginAction = () => {
    setIsSpin(true)
    msalInstance.handleRedirectPromise().then(handleResponse)
  }

  useEffect(() => {
    if (!isLogin) {
      msalInstance.handleRedirectPromise().then((res) => {
        if (res?.account && res?.account.homeAccountId !== '') {
          onMsalInstanceChange(msalInstance)
          handleMsalUserInfo(msalInstance)
        } else {
          handleMsalUserInfo(msalInstance)
        }
      })
    }
  }, [msalInstance])

  function handleResponse(response: any) {
    if (response !== null) {
      onMsalInstanceChange(msalInstance)
      handleMsalUserInfo(msalInstance)
    } else {
      const currentAccounts = msalInstance.getAllAccounts()
      if (currentAccounts.length === 0) {
        msalInstance.loginRedirect(loginRequest)
      } else if (currentAccounts.length > 1) {
        logoutHandler()
        msalInstance.loginRedirect(loginRequest)
      } else if (currentAccounts.length === 1) {
        onMsalInstanceChange(msalInstance)
        handleMsalUserInfo(msalInstance)
      }
    }
  }

  const logoutHandler = () => {
    onMsalInstanceChange(new msal.PublicClientApplication(config))
    handleLoginEvent(false)
  }

  const MircosolfLoginComp: JSX.Element = (
    <>
      <Button variant="outlined" style={{ border: '1px solid white', borderRadius: '15px', background: 'white' }} onClick={loginAction}>
        <Image src="/microsoft-logo.png" alt="logo" width={15} height={15}></Image>
        <span style={{ marginLeft: '10px', color: 'darkslategray', fontWeight: '600' }}>Sign in with Microsoft</span>
      </Button>
    </>
  )

  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      if (document.querySelector('footer')) {
        const footerHeight = document.querySelector('footer')!.offsetHeight
        contentRef.current!.style.minHeight = `calc(100vh - ${footerHeight}px - 56px)`
      }
    }

    handleResize()

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <Box sx={{ flexGrow: 1 }} className="pc">
      {isLogin === null ? (
        ''
      ) : isLogin ? (
        <>
          <Content style={{ minHeight: 'calc(100vh - 106px)' }} ref={contentRef}>
            <TopBar isLogin={isLogin} userInfo={userInfo} logout={logoutHandler} isSpinning={handleSpinEvent} />
            <Spin spinning={isSpin}>{child}</Spin>
          </Content>
          <Footer style={{ padding: 0 }}>
            <FooterComp />
          </Footer>
        </>
      ) : (
        <>
          {typeof isLogin === 'boolean' ? (
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
              className="login-box"
            >
              <Spin spinning={isSpin}>
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
                    <div style={{ marginBottom: '30%' }}>{MircosolfLoginComp}</div>
                  </div>
                </Box>
              </Spin>
            </div>
          ) : (
            ''
          )}
        </>
      )}
    </Box>
  )
}
