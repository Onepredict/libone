import { useRouter } from 'next/router'
import { useState, useEffect, FunctionComponent } from 'react'
import List from '@/components/mobile/List'
import { Spin } from 'antd'

type UserInfo = {
  username: string | undefined
  name: string | undefined
  homeAccountId: string | undefined
}

type LayoutProps = {
  isLogin: boolean
  userInfo: UserInfo
  isSpinning: (flag: boolean) => void
}

export default function Main({ isLogin, userInfo, isSpinning }: LayoutProps) {
  const router = useRouter()

  const handleSpinEvent = () => {
    isSpinning(true)
  }

  useEffect(() => {
    isSpinning(false)
  }, [])

  return <List isLogin={isLogin} userInfo={userInfo} isSpinning={handleSpinEvent} />
}
