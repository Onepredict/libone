import { Backdrop, Tooltip, Box } from '@mui/material'
import { Button, Input, FloatButton, Popconfirm, Form, Table, Modal, message } from 'antd'
import { CameraOutlined, UnorderedListOutlined, FileAddOutlined, UserAddOutlined, CloseOutlined } from '@ant-design/icons'
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove'
import type { ColumnsType } from 'antd/es/table'
import { useState, useEffect, useRef } from 'react'
import Router, { useRouter } from 'next/router'
import Scanner from 'components/mobile/QrScanner'
import axios from 'axios'

type props = {
  isSpinning: (flag: boolean) => void
}

export default function FloatButtonComp({ isSpinning }: props) {
  const router = useRouter()
  const IP_ADDRESS = process.env.NEXT_PUBLIC_SERVER_URL
  const [openBackDrop, setOpenBackDrop] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    getListOfAllAdminUser()
  }, [])

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

  const handleBackDropToggle = () => {
    setOpenBackDrop((prev) => !prev)
  }

  const handleCloseBackdrop = () => {
    if (openBackDrop) setOpenBackDrop(false)
  }

  const handleFloatEvent = () => {}

  const handleMoveBookList = () => {
    if (router.pathname !== '/libone/list') {
      Router.push('/libone/list')
      isSpinning(true)
    }
  }

  const handleMoveEditBook = () => {
    if (router.pathname !== '/libone/edit') {
      Router.push('/libone/edit')
      isSpinning(true)
    }
  }

  interface AdminType {
    id: number
    email: string
  }

  const formCols = ['email', 'id']
  const [isModify, setIsModify] = useState(false)

  const handleEditAdminInformation = (record: AdminType) => {
    form.setFieldsValue({
      email: record.email + '@onepredict.com',
      id: record.id,
    })
    setIsModify(true)
  }

  const accountColumns: ColumnsType<AdminType> | undefined = [
    {
      title: '계정',
      key: 'email',
      width: '70%',
      render: (record: AdminType) => (
        <>
          <span onClick={() => handleEditAdminInformation(record)}>{String(record.email)}</span>
        </>
      ),
    },
    {
      title: '삭제',
      key: 'action',
      render: (record: AdminType) => (
        <Popconfirm
          placement="bottomRight"
          title={'삭제 처리 하시겠습니까?'}
          onConfirm={() => handleDeleteAdminInformation(record)}
          okText="Yes"
          cancelText="No"
        >
          <Button style={{ border: 'none' }}>
            <PlaylistRemoveIcon />
          </Button>
        </Popconfirm>
      ),
      width: '20%',
      align: 'center',
    },
  ]

  const [accountData, setAcountData] = useState<AdminType[] | undefined>()

  const handleDeleteAdminInformation = (record: AdminType) => {
    const _id = record.id
    axios.delete(IP_ADDRESS + '/auths/' + _id).then((response) => {
      message.success('삭제가 완료되었습니다')
      getListOfAllAdminUser()
    })
  }

  const getListOfAllAdminUser = () => {
    axios.get(IP_ADDRESS + '/auths').then((response) => {
      const authUsers = response.data
      const tmpData: AdminType[] = [...authUsers]
      for (let i = 0; i < authUsers.length; i++) {
        const account: string = authUsers[i].email.split('@')[0]
        tmpData[i].email = account
      }
      setAcountData(tmpData)
    })
  }

  const [authSetModalOpen, setAuthSetModalOpen] = useState(false)
  const [form] = Form.useForm()

  const handleSetAuth = (flag: boolean) => {
    setAuthSetModalOpen(flag)
  }

  const AddAdminInformation = () => {
    const formData = form.getFieldsValue([...formCols])
    if (formData.email) {
      form.submit()
    } else {
      message.error('이메일을 확인해 주세요.')
    }
  }

  const onFinish = (formData: any) => {
    if (isModify) {
      const data = form.getFieldsValue([...formCols])
      data.email = data.email + '@onepredict.com'
      axios.put(IP_ADDRESS + '/auths/' + data.id, data).then((response) => {
        message.success('수정이 완료되었습니다.')
        getListOfAllAdminUser()
        form.resetFields()
        setIsModify(false)
      })
    } else {
      formData.email = formData.email + '@onepredict.com'
      axios.post(IP_ADDRESS + '/auths/', formData).then((response) => {
        message.success('추가가 완료되었습니다.')
        getListOfAllAdminUser()
        form.resetFields()
      })
    }
  }

  const onFinishFailed = (errorInfo: any) => {
    message.error('필수 항목을 입력해 주세요.')
  }

  const [qrReaderModalOpen, setQrReaderModalOpen] = useState(false)

  const handleQrReader = (flag: boolean) => {
    setQrReaderModalOpen(flag)
  }

  return (
    <>
      <Backdrop open={openBackDrop} style={{ zIndex: 98 }} onClick={handleCloseBackdrop}></Backdrop>
      <div onClick={handleBackDropToggle}>
        <FloatButton.Group
          className="floatButton"
          trigger="click"
          type="primary"
          style={{ right: 24 }}
          icon={<UnorderedListOutlined />}
          onOpenChange={handleFloatEvent}
          open={openBackDrop}
        >
          <>
            {isAdmin ? (
              <>
                <Tooltip open={openBackDrop} placement="left" title={<div>권한 설정</div>}>
                  <FloatButton icon={<UserAddOutlined />} onClick={() => handleSetAuth(true)} />
                </Tooltip>
                <Tooltip open={openBackDrop} placement="left" title={<div>도서 등록</div>}>
                  <FloatButton icon={<FileAddOutlined />} onClick={handleMoveEditBook} />
                </Tooltip>
              </>
            ) : (
              ''
            )}
          </>
          <Tooltip open={openBackDrop} placement="left" title={<div>도서 목록</div>}>
            <FloatButton icon={<UnorderedListOutlined />} onClick={handleMoveBookList} />
          </Tooltip>
          <Tooltip open={openBackDrop} placement="left" title={<div>도서 대여</div>}>
            <FloatButton icon={<CameraOutlined />} onClick={() => handleQrReader(true)} />
          </Tooltip>
        </FloatButton.Group>
      </div>
      <Modal
        title="도서 대여"
        open={qrReaderModalOpen}
        maskClosable={false}
        closable={true}
        footer={[]}
        closeIcon={<CloseOutlined onClick={() => handleQrReader(false)} />}
      >
        <Scanner />
      </Modal>
      {isAdmin ? (
        <>
          <Modal
            open={authSetModalOpen}
            onCancel={() => handleSetAuth(false)}
            onOk={AddAdminInformation}
            maskClosable={false}
            okText={isModify ? '수정' : '추가'}
            cancelText={'닫기'}
          >
            <div
              style={{
                height: '100%',
                background: 'white',
              }}
              className="form-box"
            >
              <>
                {accountData && accountData.length > 0 ? (
                  <>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>관리자 리스트</div>
                    <div style={{ padding: '20px 10px 0px 10px ', background: 'whitesmoke', borderRadius: '20px' }}>
                      <Table
                        columns={accountColumns}
                        dataSource={accountData}
                        size="small"
                        rowKey={(render) => render.email + '_' + render.id}
                        pagination={{ pageSize: 3 }}
                      />
                    </div>
                  </>
                ) : (
                  ''
                )}
              </>
              <Form
                className="form-inform"
                layout="vertical"
                form={form}
                initialValues={{ remember: false }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
                style={{ maxWidth: 600, marginTop: '20px' }}
              >
                <Form.Item
                  label="이메일"
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: '이메일 계정을 입력해 주세요.',
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Form>
            </div>
          </Modal>
        </>
      ) : (
        ''
      )}
    </>
  )
}
