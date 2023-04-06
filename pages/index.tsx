import Main from '@/components/mobile/Main'

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

export default function Home({ isLogin, userInfo, isSpinning }: LayoutProps) {
  return <Main isLogin={isLogin} userInfo={userInfo} isSpinning={isSpinning} />
}
