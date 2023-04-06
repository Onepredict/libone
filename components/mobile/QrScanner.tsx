import { useState, useEffect } from 'react'
import Router from 'next/router'
import dynamic from 'next/dynamic'
import { Button, notification, Space, message } from 'antd'
const QrReader = dynamic(() => import('react-qr-reader'), {
  ssr: false,
})

const Scanner = () => {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const jsonData = sessionStorage.getItem('auth')
    if (jsonData) {
      const adminData: string = JSON.parse(jsonData).admin
      if (adminData?.includes('onepredict')) {
        setIsAdmin(true)
      }
    } else {
      setIsAdmin(false)
    }
  }, [sessionStorage.getItem('auth')])

  const [isScan, setIsScan] = useState<boolean>(false)

  const handleScan = (data: string | null) => {
    if (data) {
      if (!isScan) {
        setIsScan(true)
        openNotification('/libone' + data.split('/libone')[1])
      }
    }
  }

  const handleError = (err: any) => {
    setIsScan(false)
  }

  const [api, contextHolder] = notification.useNotification()

  const closeNotification = () => {
    setIsScan(false)
  }

  const [scanData, setScanData] = useState<string>('')

  const handeMoveBookLendPage = (key: string, url: string) => {
    if (url) {
      Router.push(url)
    } else {
      setScanData(url)
      message.error('스캔 정보를 확인해 주세요.')
      api.destroy(key)
    }
  }

  const handleCancelNotification = (key: string) => {
    api.destroy(key)
    setIsScan(false)
  }

  const openNotification = (url: string) => {
    const key = `open${Date.now()}`
    const btn = (
      <Space>
        <Button type="link" size="small" onClick={() => handleCancelNotification(key)}>
          취소
        </Button>
        <Button type="primary" size="small" onClick={() => handeMoveBookLendPage(key, url)}>
          이동
        </Button>
      </Space>
    )
    api.open({
      message: '도서 대여 화면 이동',
      description: '[이동] 버튼을 누르면 도서 대여 화면으로 이동 됩니다.',
      btn,
      key,
      onClose: closeNotification,
      placement: 'bottom',
    })
  }

  return (
    <>
      {contextHolder}
      <QrReader delay={300} onError={handleError} onScan={handleScan} style={{ width: '100%' }} />
      <>{isAdmin ? scanData : null}</>
    </>
  )
}

export default Scanner
