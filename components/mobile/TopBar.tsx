import { AppBar, Toolbar, IconButton, Typography, Menu, MenuItem } from '@mui/material'
import AccountCircle from '@mui/icons-material/AccountCircle'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import { SemanticClassificationFormat } from 'typescript'

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
              <MenuItem onClick={logoutHandler}>Logout</MenuItem>
            </Menu>
          </div>
        )}
      </Toolbar>
    </AppBar>
  )
}
