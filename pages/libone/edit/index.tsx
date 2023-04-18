import { useState, useEffect } from 'react'
import { Button, Input, message, Popconfirm, Form, Space, Tag, Upload } from 'antd'
import { UploadOutlined, SettingOutlined, InboxOutlined } from '@ant-design/icons'
import { Box } from '@mui/material'
import FloatButtonComp from '@/components/mobile/FloatButton'
import axios from 'axios'
import Link from 'next/link'
import moment from 'moment'
import Router, { useRouter } from 'next/router'
import type { UploadFile, UploadChangeParam } from 'antd/es/upload/interface'
import type { UploadProps } from 'antd'
const { Dragger } = Upload
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

const formCols = [
  'title',
  'location',
  'firstRegDate',
  'rentable',
  'status',
  'lender',
  'startRentDate',
  'countRentals',
  'tags',
  'path',
  'originFileName',
  'id',
]

export default function Insert({ isLogin, userInfo, isSpinning }: LayoutProps) {
  const router = useRouter()
  const [form] = Form.useForm()
  const [isModify, setIsmodify] = useState<boolean>(false)

  useEffect(() => {
    if (router.query.id) {
      getListOfAllBooks(String(router.query.id))
      setIsmodify(true)
    }
  }, [])

  const getListOfAllBooks = (_id: string) => {
    axios.get(IP_ADDRESS + '/books?id=' + _id).then((response) => {
      const data = response.data
      form.setFieldsValue({
        title: data[0].title,
        location: data[0].location,
        firstRegDate: data[0].firstRegDate,
        rentable: data[0].rentable,
        status: data[0].status,
        lender: data[0].lender,
        startRentDate: data[0].startRentDate,
        countRentals: data[0].countRentals,
        tags: data[0].tags,
        path: data[0].path,
        originFileName: data[0].originFileName,
        id: data[0].id,
      })

      setTags([...data[0].tags])
      setFileList([{ uid: data[0].id, name: data[0].originFileName, status: 'done', url: data[0].path }])
    })
  }

  const [tags, setTags] = useState<string[]>([])
  const [inputValue, setInputValue] = useState<string>('')

  const forMap = (tag: string) => {
    const tagElem = (
      <Tag
        closable
        onClose={(e) => {
          e.preventDefault()
          handleClose(tag)
        }}
        color="purple"
      >
        {'@' + tag}
      </Tag>
    )
    return (
      <span key={tag} style={{ display: 'inline-block' }}>
        {tagElem}
      </span>
    )
  }

  const tagChild = tags.map(forMap)

  const handleClose = (removedTag: string) => {
    const newTags = tags.filter((tag) => tag !== removedTag)
    setTags(newTags)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputConfirm = () => {
    if (inputValue && tags.indexOf(inputValue) === -1) {
      setTags([...tags, inputValue])
    }
    setInputValue('')
  }

  const [file, setFile] = useState<any>()
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const validateFormData = (formData: any) => {
    let result = true
    if (!file) result = false
    if (!tags || tags.length === 0) result = false
    return result
  }

  const onFinish = (formData: any) => {
    const nowTime = moment().format('YYYY/MM/DD')
    const pathName = moment().format('YYYYMMDDHHmmss')
    if (isModify) {
      const prevFormData = form.getFieldsValue([...formCols])
      prevFormData.title = formData.title
      prevFormData.location = formData.location
      prevFormData.tags = tags
      if (file) {
        const rename = pathName + '_' + file.name
        const renameFile = changeFileName(file.originFileObj, rename)
        prevFormData.originFileName = file.name
        prevFormData.path = '/uploads/' + rename
        axios.put(IP_ADDRESS + '/books/' + prevFormData.id, prevFormData).then((response) => {
          handleUpload(response.data, renameFile)
        })
      } else {
        axios.put(IP_ADDRESS + '/books/' + prevFormData.id, prevFormData).then((response) => {
          isSpinning(true)
          Router.push(
            {
              pathname: '/libone/list',
              query: { text: prevFormData.title },
            },
            '/libone/list'
          )
        })
      }
    } else {
      if (validateFormData(formData)) {
        const rename = pathName + '_' + file.name
        formData.firstRegDate = nowTime
        formData.rentable = 'N'
        formData.status = 'normal'
        formData.lender = ''
        formData.startRentDate = ''
        formData.countRentals = 0
        formData.tags = tags
        formData.path = '/uploads/' + rename
        formData.originFileName = file.name

        const renameFile = changeFileName(file.originFileObj, rename)
        axios.post(IP_ADDRESS + '/books/', formData).then((response) => {
          handleUpload(response.data, renameFile)
        })
      } else {
        message.error('필수 항목을 확인해 주세요.')
      }
    }
  }

  const changeFileName = (file: any, newName: string) => {
    const renamedFile = new File([file], newName, { type: file.type })
    return renamedFile
  }

  const handleFileList = (info: UploadChangeParam<UploadFile<UploadProps>>) => {
    if (info.file.status !== 'removed') {
      setFile(info.file)
      setFileList([info.file])
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setFileList([])
  }

  const handleUpload = (res: any, renameFile: any) => {
    const formData = new FormData()
    const config = {
      headers: { 'content-type': 'multipart/form-data' },
    }
    formData.append('file', renameFile)

    axios
      .post('/api/upload', formData, config)
      .then((res) => {
        message.success('upload successfully.')
      })
      .catch((err) => {
        message.error('upload failed.')
      })
      .finally(() => {
        isSpinning(true)
        Router.push(
          {
            pathname: '/libone/list',
            query: { text: res.title },
          },
          '/libone/list'
        )
      })
  }

  const onFinishFailed = (errorInfo: any) => {
    message.error('필수 항목을 입력해 주세요.')
  }

  const handleSpinEvent = () => {
    isSpinning(true)
  }

  useEffect(() => {
    const URLSearch = new URLSearchParams(location.search)
    const _id = URLSearch.get('id')
    isSpinning(false)
  }, [])

  return (
    <div
      style={{
        height: 'calc(100vh - 106px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '56px',
      }}
    >
      <Box sx={{ flexGrow: 1, height: '100%', width: '100%' }}>
        <Box sx={{ my: 3 }} style={{ width: '100%', padding: '0 5%' }}>
          <div
            style={{
              height: '100%',
              background: 'white',
            }}
            className="form-box"
          >
            <Form
              className="form-inform"
              layout="vertical"
              form={form}
              initialValues={{ remember: false }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
              style={{ maxWidth: 600 }}
            >
              <Form.Item label="도서명" name="title" rules={[{ required: true, message: '도서명을 입력해 주세요!' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="위치" name="location" rules={[{ required: true, message: '위치 정보를 입력해 주세요!' }]}>
                <Input />
              </Form.Item>
              <div style={{ marginBottom: '12px' }}>
                <div className="ant-col ant-form-item-label css-dev-only-do-not-override-mxhywb">
                  <label htmlFor="tags" className="ant-form-item-required custom-ant-form-item-required" title="태그">
                    태그
                  </label>
                </div>
                <Input
                  className="tags-input"
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onPressEnter={handleInputConfirm}
                />
                {tagChild}
              </div>
              <div>
                <div className="ant-col ant-form-item-label css-dev-only-do-not-override-mxhywb">
                  <label
                    htmlFor="tags"
                    className="ant-form-item-required custom-ant-form-item-required"
                    title="태그"
                    style={{ marginRight: '20px' }}
                  >
                    표지 이미지
                  </label>
                  <Upload
                    fileList={fileList}
                    listType="picture"
                    className="upload-list-inline"
                    maxCount={1}
                    onChange={(info) => handleFileList(info)}
                    onRemove={handleRemoveFile}
                  >
                    <Button icon={<UploadOutlined />}>Upload (Max: 1)</Button>
                  </Upload>
                </div>
              </div>

              <Space className="btn-space" align="start" style={{ marginTop: '20px', width: '100%' }}>
                <Link key={'home'} href={'/'} prefetch={false} legacyBehavior>
                  <Button>메인</Button>
                </Link>
                <Form.Item style={{ textAlign: 'right' }}>
                  <Popconfirm
                    placement="bottomRight"
                    title={isModify ? '수정 하시겠습니까?' : '등록 하시겠습니까?'}
                    onConfirm={() => form.submit()}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="primary">{isModify ? '수정' : '등록'}</Button>
                  </Popconfirm>
                </Form.Item>
              </Space>
            </Form>
            <FloatButtonComp isSpinning={handleSpinEvent} />
          </div>
        </Box>
      </Box>
    </div>
  )
}
