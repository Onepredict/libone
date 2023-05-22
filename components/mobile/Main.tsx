import Image from 'next/image'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Button, Box } from '@mui/material'
import { Table, Divider, Input, Tag, Popconfirm, message, Modal, Descriptions, Space, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/router'
import axios from 'axios'
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove'
import FloatButtonComp from '@/components/mobile/FloatButton'
import QRCode from 'qrcode.react'
import { isBrowser } from 'react-device-detect'
import { textAlign } from '@mui/system'

import type { PaginationProps } from 'antd'

const { Search } = Input
const IP_ADDRESS = process.env.NEXT_PUBLIC_SERVER_URL

interface UserInfo {
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
  const [isMobile, setIsMobile] = useState(false)

  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
  useEffect(() => {
    if (router.query.user === 'anonymous') {
      setIsAnonymous(true)
    }
  }, [JSON.stringify(router.query)])

  useEffect(() => {
    if (!isBrowser) {
      setIsMobile(true)
    }
  }, [])

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
    returnCheckYn: string
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

  interface MyBookType {
    key: number
    title: string
    period: string
    data: BookJsonDataType
  }

  const myBookColumns: ColumnsType<MyBookType> | undefined = [
    {
      title: '도서명',
      dataIndex: 'title',
      key: 'title',
      width: '60%',
    },
    {
      title: '대여일',
      dataIndex: 'period',
      key: 'period',
      width: '20%',
      align: 'center',
    },
    {
      title: '반납',
      key: 'action',
      render: (record: BookType) => (
        <Popconfirm
          placement="bottomRight"
          title={'반납처리 하시겠습니까?'}
          onConfirm={() => handleUpdateBookStatus(record)}
          okText="Yes"
          cancelText="No"
        >
          <Button>
            <PlaylistRemoveIcon />
          </Button>
        </Popconfirm>
      ),
      width: '20%',
      align: 'center',
    },
  ]

  const columns: ColumnsType<BookType> = [
    {
      title: '도서명',
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

  const handleUpdateBookStatus = (record: BookType) => {
    const formData = record.data
    formData.rentable = 'N'
    formData.lender = ''
    formData.startRentDate = ''
    formData.returnCheckYn = ''
    axios.put(IP_ADDRESS + '/books/' + formData.id, formData).then((response) => {
      message.success('반납이 완료됐습니다')
      getListOfAllBooks()
    })
  }

  const [myBookData, setMyBookData] = useState<MyBookType[] | undefined>()
  const [newBookDate, setNewBookData] = useState<BookType[] | undefined>()
  const [bestBookDate, setBestBookData] = useState<BookType[] | undefined>()
  const [bookListData, setBookListData] = useState<BookType[] | undefined>()

  const getListOfAllBooks = () => {
    axios.get(IP_ADDRESS + '/books?_sort=id&_order=desc').then((response) => {
      const data = response.data
      const myBooks = []
      const newBooks = []
      const bestBooks = []
      const bookList = []
      for (let i = 0; i < data.length; i++) {
        const today = new Date()
        const firstRegDate = new Date(data[i].firstRegDate)
        const diffMSec = today.getTime() - firstRegDate.getTime()
        const diffDate = Math.ceil(diffMSec / (24 * 60 * 60 * 1000))
        if (data[i].lender === userInfo?.username) {
          const startRentDate = new Date(data[i].startRentDate)
          const diffRentSec = today.getTime() - startRentDate.getTime()
          const diffRentDate = Math.ceil(diffRentSec / (24 * 60 * 60 * 1000))
          const myBook: MyBookType = {
            key: i,
            title: data[i].title,
            period: `${diffRentDate}일`,
            data: data[i],
          }
          myBooks.push(myBook)
        }

        if (diffDate <= 15) {
          const newBook: BookType = {
            key: i,
            title: data[i].title,
            rentable:
              data[i].rentable === 'Y' ? (
                <span style={{ textAlign: 'center' }}>
                  <Tag color="red">대여중</Tag>
                </span>
              ) : (
                <span style={{ textAlign: 'center' }}>
                  <Tag color="blue">대여가능</Tag>
                </span>
              ),
            data: data[i],
          }
          newBooks.push(newBook)
        }

        const book: BookType = {
          key: i,
          title: data[i].title,
          rentable: data[i].rentable === 'Y' ? <Tag color="red">대여중</Tag> : <Tag color="blue">대여가능</Tag>,
          data: data[i],
        }
        bookList.push(book)
      }

      const sortData = data.sort((a: BookJsonDataType, b: BookJsonDataType) => b.countRentals - a.countRentals)
      for (let i = 0; i < 5; i++) {
        const book: BookType = {
          key: i,
          title: sortData[i].title,
          rentable: sortData[i].rentable === 'Y' ? <Tag color="red">대여중</Tag> : <Tag color="blue">대여가능</Tag>,
          data: sortData[i],
        }
        bestBooks.push(book)
      }
      setMyBookData(myBooks)
      setNewBookData(newBooks)
      setBestBookData(bestBooks)
      setBookListData(bookList)
    })
  }

  useEffect(() => {
    if (!isAnonymous) {
      if (userInfo.homeAccountId !== '') {
        getListOfAllBooks()
      }
    } else {
      getListOfAllBooks()
    }
  }, [userInfo, isAnonymous])

  const blurDataUrl: string = '/empty.gif'
  const [bookInform, setBookInform] = useState<BookJsonDataType>()
  const [bookInformModalOpen, setBookInformModalOpen] = useState<boolean>(false)
  const [tags, setTags] = useState<string[]>([])
  const [bookTitleImg, setBookTitleImg] = useState<string>(blurDataUrl)

  const handleBookInformModal = (record: BookType) => {
    const url = location.origin + '/libone/lend?id=' + record.data.id
    record.data.url = url
    setBookInform(record.data)
    setBookTitleImg(`/api/public${record.data.path}`)
    setTags([...record.data.tags])
    setBookInformModalOpen(true)
  }

  const handleBookInformModalClose = () => {
    setBookTitleImg(blurDataUrl)
    setTimeout(() => {
      setBookInformModalOpen(false)
    }, 50)
  }

  const handleSpinEvent = (flag: boolean) => {
    isSpinning(flag)
  }

  useEffect(() => {
    isSpinning(false)
  }, [])

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
          getListOfAllBooks()
        } else {
          message.error('삭제에 실패했습니다.')
        }
      })
    }
  }

  const [pageSizeMyBook, setPageSizeMyBook] = useState(5)
  const [pageSizeNewBook, setPageSizeNewBook] = useState(5)

  const onShowSizeChangeMyBook: PaginationProps['onShowSizeChange'] = (current, pageSize) => {
    setPageSizeMyBook(pageSize)
  }

  const onShowSizeChangeNewBook: PaginationProps['onShowSizeChange'] = (current, pageSize) => {
    setPageSizeNewBook(pageSize)
  }

  const forMap = (tag: string) => {
    const tagElem = <Tag color="purple">{'@' + tag}</Tag>
    return (
      <span key={tag} style={{ display: 'inline-block' }}>
        {tagElem}
      </span>
    )
  }
  const tagChild = tags.map(forMap)

  const [pageSize, setPageSize] = useState(isBrowser ? 10 : 5)

  const onShowSizeChange: PaginationProps['onShowSizeChange'] = (current, pageSize) => {
    setPageSize(pageSize)
  }

  return (
    <>
      {typeof isLogin !== 'undefined' ? (
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
                <img
                  src={bookTitleImg}
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
                  enterButton
                />
              </Box>
              <Box sx={{ my: 3 }} style={{ marginBottom: '0px', width: '100%', padding: '0 5%', height: '100%', overflowY: 'auto' }}>
                {myBookData && myBookData.length > 0 ? (
                  <>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>MY 대여</div>
                    <div style={{ padding: '20px 10px 0px 10px', background: 'whitesmoke', borderRadius: '20px' }}>
                      <Table
                        columns={myBookColumns}
                        dataSource={myBookData}
                        size="small"
                        rowKey={(render) => render.title + '_' + render.key}
                        pagination={{
                          pageSize: pageSizeMyBook,
                          onShowSizeChange: onShowSizeChangeMyBook,
                          pageSizeOptions: [5, 10, 20, 50, 100],
                        }}
                      />
                    </div>
                    <Divider />
                  </>
                ) : (
                  ''
                )}
                {newBookDate && newBookDate.length > 0 ? (
                  <>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>신규 도서</div>
                    <div style={{ padding: '20px 10px 0px 10px', background: 'whitesmoke', borderRadius: '20px' }}>
                      <Table
                        columns={columns}
                        dataSource={newBookDate}
                        size="small"
                        rowKey={(render) => render.title + '_' + render.key}
                        pagination={{
                          pageSize: pageSizeNewBook,
                          onShowSizeChange: onShowSizeChangeNewBook,
                          pageSizeOptions: [5, 10, 20, 50, 100],
                        }}
                        onRow={(record, rowIndex) => {
                          return {
                            onClick: (event) => {
                              handleBookInformModal(record)
                            }, // click row
                          }
                        }}
                      />
                    </div>
                    <Divider />
                  </>
                ) : (
                  ''
                )}
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>BEST 5</div>
                <div style={{ padding: '20px 10px', background: 'whitesmoke', borderRadius: '20px' }}>
                  <Table
                    columns={columns}
                    dataSource={bestBookDate}
                    size="small"
                    rowKey={(render) => render.title + '_' + render.key}
                    pagination={false}
                    onRow={(record, rowIndex) => {
                      return {
                        onClick: (event) => {
                          handleBookInformModal(record)
                        }, // click row
                      }
                    }}
                  />
                </div>
                <Divider />
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>도서 목록</div>
                <div style={{ padding: '20px 10px 0px 10px', background: 'whitesmoke', borderRadius: '20px' }}>
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
      ) : (
        ''
      )}
    </>
  )
}
