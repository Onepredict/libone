import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Box, Button } from '@mui/material'
import { Table, Input, Tag, Modal, Descriptions, message, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/router'
import axios from 'axios'
import FloatButtonComp from '@/components/mobile/FloatButton'
import QRCode from 'qrcode.react'
import { isBrowser } from 'react-device-detect'
import type { PaginationProps } from 'antd'

const { Search } = Input
const IP_ADDRESS = process.env.NEXT_PUBLIC_SERVER_URL

interface UserInfo {
  username: string | undefined
  name: string | undefined
  homeAccountId: string | undefined
}

interface props {
  isLogin: boolean | undefined
  userInfo: UserInfo
  isSpinning: (flag: boolean) => void
}

interface BookJsonDataType extends QrCodeType {
  id: number
  title: string
  firstRegDate: string
  rentable: string
  status: string
  lender: string
  startRentDate: string
  countRentals: number
  path: string
  tags: Array<string>
  location: string
}

interface QrCodeType {
  url: string
}

interface BookType {
  key: number
  title: string
  rentable: JSX.Element
  data: BookJsonDataType
}

const columns: ColumnsType<BookType> = [
  {
    title: 'Title',
    dataIndex: 'title',
    key: 'title',
    width: '70%',
  },
  {
    title: '상태',
    dataIndex: 'rentable',
    key: 'rentable',
    width: '30%',
  },
]

export default function Main({ isLogin, userInfo, isSpinning }: props) {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!isBrowser) {
      setIsMobile(true)
    }
  }, [])

  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
  useEffect(() => {
    if (router.query.user === 'anonymous') {
      setIsAnonymous(true)
    }
  }, [JSON.stringify(router.query)])

  const [bookListData, setBookListData] = useState<BookType[] | undefined>([])
  const [searchText, setSearchText] = useState<string | ReadonlyArray<string> | number | undefined>('')

  const getListOfAllBooks = (text: string) => {
    axios.get(IP_ADDRESS + '/books?_sort=id&_order=desc').then((response) => {
      const data = response.data
      const bookList = []
      for (let i = 0; i < data.length; i++) {
        if (text === 'undefined' || text === '' || data[i].title.includes(text)) {
          const book: BookType = {
            key: i,
            title: data[i].title,
            rentable: data[i].rentable === 'Y' ? <Tag color="red">대여중</Tag> : <Tag color="blue">대여가능</Tag>,
            data: data[i],
          }
          bookList.push(book)
        }
      }
      setBookListData(bookList)
      if (bookList.length > 0) {
        if (tableBoxRef.current) {
          tableBoxRef.current.style.padding = '20px 10px 0px'
        }
      } else {
        if (tableBoxRef.current) {
          tableBoxRef.current.style.padding = '20px 10px'
        }
      }
    })
  }

  useEffect(() => {
    if (!isAnonymous) {
      if (userInfo.homeAccountId !== '') {
        if (router.query.text) {
          getListOfAllBooks(String(router.query.text))
          setSearchText(String(router.query.text))
        } else {
          getListOfAllBooks('')
          setSearchText('')
        }
      }
    } else {
      getListOfAllBooks('')
      setSearchText('')
    }
  }, [userInfo, JSON.stringify(router.query), isAnonymous])

  const handleSearchText = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLTextAreaElement
    setSearchText(target.value)
  }

  const [bookInform, setBookInform] = useState<BookJsonDataType>()
  const [bookInformModalOpen, setBookInformModalOpen] = useState<boolean>(false)
  const [tags, setTags] = useState<string[]>([])

  const handleBookInformModal = (record: BookType) => {
    const url = location.origin + '/libone/lend?id=' + record.data.id
    record.data.url = url
    setBookInform(record.data)
    setTags([...record.data.tags])
    setBookInformModalOpen(true)
  }

  const handleBookInformModalClose = () => {
    setBookInformModalOpen(false)
  }

  const handleSpinEvent = (flag: boolean) => {
    isSpinning(flag)
  }

  const handleEditBookInform = () => {
    router.push(
      {
        pathname: '/libone/edit',
        query: { id: bookInform ? bookInform.id : '' },
      },
      '/libone/edit'
    )
  }

  const handleDeleteBookInform = () => {
    if (bookInform) {
      axios.delete(IP_ADDRESS + '/books/' + bookInform.id).then((res) => {
        if (res.status === 200) {
          setBookInformModalOpen(false)
          getListOfAllBooks('')
        } else {
          message.error('삭제에 실패했습니다.')
        }
      })
    }
  }

  const [pageSize, setPageSize] = useState(isBrowser ? 10 : 5)

  const onShowSizeChange: PaginationProps['onShowSizeChange'] = (current, pageSize) => {
    setPageSize(pageSize)
  }

  const blurDataUrl: string = '/empty.gif'

  const forMap = (tag: string) => {
    const tagElem = <Tag color="purple">{'@' + tag}</Tag>
    return (
      <span key={tag} style={{ display: 'inline-block' }}>
        {tagElem}
      </span>
    )
  }
  const tagChild = tags.map(forMap)

  const tableBoxRef = useRef<HTMLDivElement | null>(null)

  return (
    <>
      <Modal
        style={{
          top: '10%',
        }}
        open={bookInformModalOpen}
        onCancel={() => handleBookInformModalClose()}
        footer={[]}
        maskClosable={true}
        width={1000}
        title="도서 정보"
        className={isMobile ? 'mb-modal' : 'pc-modal'}
      >
        <div className="book-inform-box">
          <div className="custum-align-center book-thumb-img" style={{ padding: '20px' }}>
            <Image
              src={bookInform ? bookInform.path : blurDataUrl}
              alt="title"
              width={isMobile ? 220 : 440}
              height={isMobile ? 300 : 560}
              onError={() => {
                const tmpObj: BookJsonDataType | undefined = bookInform ? { ...bookInform } : undefined
                tmpObj ? (tmpObj.path = blurDataUrl) : ''
                setBookInform(tmpObj)
              }}
              style={{ borderRadius: '10px' }}
            />
          </div>
          <div className="book-inform-content">
            <Descriptions bordered size={'small'}>
              <Descriptions.Item label="도서명" span={isMobile ? 1 : 3} className="book-inform-data">
                {bookInform ? bookInform.title : ''}
              </Descriptions.Item>
              <Descriptions.Item label="위치" span={isMobile ? 1 : 3} className="book-inform-data">
                {bookInform ? bookInform.location : ''}
              </Descriptions.Item>
              <Descriptions.Item label="태그" span={isMobile ? 1 : 3} className="book-inform-data">
                {bookInform ? tagChild : ''}
              </Descriptions.Item>
              <Descriptions.Item label="상태" span={isMobile ? 1 : 3} className="book-inform-data">
                {bookInform && String(bookInform.rentable) === 'Y' ? (
                  <span style={{ textAlign: 'center' }}>
                    <Tag color="red">대여중</Tag>
                  </span>
                ) : (
                  <span style={{ textAlign: 'center' }}>
                    <Tag color="blue">대여가능</Tag>
                  </span>
                )}
              </Descriptions.Item>
              {bookInform && String(bookInform.rentable) === 'Y' ? (
                <Descriptions.Item label="대여자" span={isMobile ? 1 : 3} className="book-inform-data">
                  {bookInform ? bookInform.lender.split('@')[0] : ''}
                </Descriptions.Item>
              ) : (
                ''
              )}
              <Descriptions.Item label="대여횟수" span={isMobile ? 1 : 3} className="book-inform-data">
                {bookInform ? bookInform.countRentals : ''}
              </Descriptions.Item>
              <Descriptions.Item label="등록일" span={isMobile ? 1 : 3} className="book-inform-data">
                {bookInform ? bookInform.firstRegDate : ''}
              </Descriptions.Item>
              <Descriptions.Item label="QR코드">
                <QRCode value={bookInform ? bookInform.url : ''} renderAs="canvas" />
              </Descriptions.Item>
            </Descriptions>
            <div style={{ display: 'flex', justifyContent: 'end', gap: '10px', marginTop: '10px' }}>
              <Popconfirm
                placement="bottomRight"
                title={'정말 삭제 하시겠습니까?'}
                onConfirm={() => handleDeleteBookInform()}
                okText="Yes"
                cancelText="No"
              >
                <Button variant="contained" color="error">
                  삭제
                </Button>
              </Popconfirm>
              <Popconfirm
                placement="bottomRight"
                title={'수정 하시겠습니까? 화면이 이동됩니다.'}
                onConfirm={() => handleEditBookInform()}
                okText="Yes"
                cancelText="No"
              >
                <Button variant="contained">수정</Button>
              </Popconfirm>
            </div>
          </div>
        </div>
      </Modal>
      <div
        style={{
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '56px',
        }}
      >
        <Box className="mobile" sx={{ flexGrow: 1, height: '100%', width: '100%' }}>
          <Box sx={{ my: 3 }} style={{ width: '100%', padding: '0 5%' }}>
            <Search
              placeholder="도서 검색"
              onSearch={(e) => {
                router.push(
                  {
                    pathname: '/libone/list',
                    query: { text: e },
                  },
                  '/libone/list'
                )
              }}
              value={searchText}
              onChange={(e) => handleSearchText(e)}
              enterButton
            />
          </Box>
          <Box sx={{ my: 3 }} style={{ width: '100%', padding: '0 5%' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>도서 목록</div>
            <div ref={tableBoxRef} style={{ padding: '20px 10px 0px 10px', background: 'whitesmoke', borderRadius: '20px' }}>
              <Table
                columns={columns}
                dataSource={bookListData}
                size="small"
                rowKey={(render) => render.title + '_' + render.key}
                pagination={{ pageSize: pageSize, onShowSizeChange: onShowSizeChange, pageSizeOptions: [5, 10, 20, 50, 100] }}
                onRow={(record, rowIndex) => {
                  return {
                    onClick: (event) => {
                      handleBookInformModal(record)
                    }, // click row
                  }
                }}
              />
            </div>
            <br />
          </Box>
        </Box>
      </div>
      <FloatButtonComp isSpinning={handleSpinEvent} />
    </>
  )
}
