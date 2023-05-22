import { AppBar, Toolbar, IconButton, Typography, Menu, MenuItem } from '@mui/material'
import AccountCircle from '@mui/icons-material/AccountCircle'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import axios from 'axios'
import { message } from 'antd'
const IP_ADDRESS = process.env.NEXT_PUBLIC_SERVER_URL

interface UserInfo {
  username: string | undefined
  name: string | undefined
  homeAccountId: string | undefined
}

interface props {
  isLogin: boolean
  userInfo: UserInfo
  logout: (isLogin: boolean) => void
  isSpinning: (flag: boolean) => void
}

export default function TopBar({ isLogin, userInfo, logout, isSpinning }: props) {
  const router = useRouter()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMoveHome = () => {
    if (router.pathname !== '/') {
      isSpinning(true)
    }
  }

  const logoutHandler = () => {
    if (userInfo) {
      for (const key in localStorage) {
        if (userInfo.homeAccountId) {
          if (key.includes(userInfo.homeAccountId)) {
            localStorage.removeItem(key)
            sessionStorage.removeItem('auth')
            setAnchorEl(null)
            logout(false)
          }
        }
      }
    }
  }

  const setServiceWorker = () => {
    if (!('serviceWorker' in navigator)) {
      // Service Worker isn't supported on this browser, disable or hide UI.
      return
    }

    if (!('PushManager' in window)) {
      // Push isn't supported on this browser, disable or hide UI.
      return
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          askPermission()
        })
        .catch((err) => {
          message.error('Service worker error!')
          console.log('Service worker error!', err)
          setAnchorEl(null)
        })
    }
  }

  const askPermission = async () => {
    if (!('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.')
    } else {
      console.log('이 브라우저는 알림을 지원합니다.')
      createSubscription()
    }
  }

  const createSubscription = () => {
    if (!('serviceWorker' in navigator)) return
    let reg: any
    navigator.serviceWorker.ready
      .then((swreg) => {
        reg = swreg
        return swreg.pushManager.getSubscription()
      })
      .then((sub) => {
        if (sub === null) {
          return checkPermissionFunc(reg)
        } else {
          insertUserSubscribe(sub, false)
        }
      })
      .then((newSub) => {
        if (!newSub) return
        insertUserSubscribe(newSub, true)
      })
      .catch((err) => {
        message.error('앱 알림 허용을 확인해 주세요.')
        console.error('check service worker subscribe error', err)
        setAnchorEl(null)
      })
  }

  const checkPermissionFunc = async (reg: any) => {
    await Notification.requestPermission()
    const vapidPublicKey = 'BE6Yd8TdwXLeFQNTv8QK0_1d35uxleERCDqSHZbTOvzLMVSmd4BtHCTLQr5mPN4NVrig6MWtU18sh_-X9W6676k'
    const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey)
    return reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidPublicKey,
    })
  }

  const insertUserSubscribe = async (subscribe: any, flag: boolean) => {
    const permission = await Notification.requestPermission()
    if (!flag && permission === 'denied') {
      message.error('앱 알림 허용을 확인해 주세요.')
      setAnchorEl(null)
      return
    }
    axios.get(IP_ADDRESS + '/user').then((res) => {
      let flag = true
      res.data.map((user: any) => {
        if (user.email === userInfo.username) {
          axios.delete(IP_ADDRESS + '/user/' + user.id).then((res) => {
            if (res.status !== 200) flag = false
          })
        }
      })
      if (flag) {
        axios.post(IP_ADDRESS + '/user/', { email: userInfo.username, subscribe: subscribe }).then((res) => {
          if (res.status === 201) {
            message.info('구독 완료!!')
            console.log('insert user subscribe complete!!')
            setAnchorEl(null)
          }
        })
      } else {
        console.log('delete user subscribe error!!')
        setAnchorEl(null)
      }
    })
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
  
  return (
    <AppBar position="fixed" style={{ maxHeight: '56px' }}>
      <Toolbar>
        <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }} onClick={handleMoveHome}>
          <Link key={'home'} href={'/'} prefetch={false} legacyBehavior>
            <Image priority src="/title.png" alt="title" width={60} height={30}></Image>
          </Link>
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}></Typography>
        {isLogin && (
          <div>
            {userInfo.username?.split('@')[0]}
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted={false}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={logoutHandler}>로그아웃</MenuItem>
              <MenuItem onClick={setServiceWorker}>구독</MenuItem>
            </Menu>
          </div>
        )}
      </Toolbar>
    </AppBar>
  )
}
