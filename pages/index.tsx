import Main from '@/components/mobile/Main'
import Head from 'next/head'

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
  return (
    <>
      <Head>
        <title>{"Libone - Onepredict's library"}</title>
      </Head>
      <Main isLogin={isLogin} userInfo={userInfo} isSpinning={isSpinning} />
    </>
  )
}
