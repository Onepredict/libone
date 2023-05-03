import { useState, useEffect } from 'react'
import { Descriptions, Button, Tag, message, Popconfirm, Spin } from 'antd'
import FloatButtonComp from '@/components/mobile/FloatButton'
import axios from 'axios'
import Link from 'next/link'
import moment from 'moment'
import Router from 'next/router'

const IP_ADDRESS = process.env.NEXT_PUBLIC_SERVER_URL

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

interface BookJsonDataType {
  id: number
  title: string
  firstRegDate: string
  rentable: string
  status: string
  lender: string
  startRentDate: string
  countRentals: number
  imgUrl: string
  tags: Array<string>
  location: string
}

export default function Lend({ isLogin, userInfo, isSpinning }: LayoutProps) {
  const [bookInform, setBookInformation] = useState<BookJsonDataType>()
  const [isRent, setIsRent] = useState<boolean>(true)

  const getBookInformation = (text: string) => {
    axios.get(IP_ADDRESS + '/books').then((response) => {
      const data = response.data
      for (let i = 0; i < data.length; i++) {
        if (text === String(data[i].id)) {
          setBookInformation(data[i])
          if (data[i].rentable === 'N') {
            setIsRent(false)
          }
          break
        }
      }
    })
  }

  const [bookId, setBookId] = useState<string | undefined>()

  const handleUpdateBookStatus = () => {
    const formData = { ...bookInform }
    const nowTime = moment().format('YYYY/MM/DD')
    const count = formData.countRentals ? formData.countRentals : 0
    formData.rentable = 'Y'
    formData.lender = userInfo.username
    formData.startRentDate = nowTime
    formData.countRentals = count + 1
    axios.get(IP_ADDRESS + '/books/' + formData.id).then((res: any) => {
      if (res.data.rentable === 'N') {
        axios.put(IP_ADDRESS + '/books/' + formData.id, formData).then((response) => {
          message.success('성공적으로 대여됐습니다')
          isSpinning(true)
          Router.push('/')
        })
      } else {
        message.info('실패했습니다. 대여 여부를 다시 확인해 주세요.')
        if (bookId) getBookInformation(bookId)
      }
    })
  }

  const handleSpinEvent = () => {
    isSpinning(true)
  }

  useEffect(() => {
    const URLSearch = new URLSearchParams(location.search)
    const _id = URLSearch.get('id')
    getBookInformation(String(_id))
    setBookId(String(_id))
    isSpinning(false)
  }, [])

  return (
    <div
      style={{
        height: 'calc(100vh - 106px)',
        marginTop: '56px',
        padding: '20px',
      }}
    >
      <Descriptions bordered title="도서 대여" size={'middle'}>
        <Descriptions.Item label="도서명">{bookInform?.title}</Descriptions.Item>
        <Descriptions.Item label="상태">
          {bookInform?.rentable === 'N' ? <Tag color="blue">대여가능</Tag> : <Tag color="red">대여중</Tag>}
        </Descriptions.Item>
        {bookInform && String(bookInform.rentable) === 'Y' ? (
          <Descriptions.Item label="대여자" className="book-inform-data">
            {bookInform ? bookInform.lender.split('@')[0] : ''}
          </Descriptions.Item>
        ) : (
          ''
        )}
        <Descriptions.Item label="대여횟수">{bookInform?.countRentals}</Descriptions.Item>
        <Descriptions.Item label="등록일">{bookInform?.firstRegDate}</Descriptions.Item>
      </Descriptions>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'end', alignItems: 'center', marginTop: '15px', gap: '10px' }}>
        <Link key={'home'} href={'/'} prefetch={false} legacyBehavior>
          <Button>메인으로</Button>
        </Link>
        <Popconfirm
          placement="bottomRight"
          title={'대여 하시겠습니까?'}
          onConfirm={handleUpdateBookStatus}
          okText="Yes"
          cancelText="No"
          disabled={isRent}
        >
          <Button type="primary" disabled={isRent}>
            대여하기
          </Button>
        </Popconfirm>
      </div>
      <FloatButtonComp isSpinning={handleSpinEvent} />
    </div>
  )
}
