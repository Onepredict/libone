import nextConnect from 'next-connect'
import multer from 'multer'
import path from 'path'
import dayjs from 'dayjs'
import fs from 'fs'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
    if (fs.existsSync('/app/public/uploads/' + file.originalname)) {
      fs.unlink('/app/public/uploads/' + file.originalname, (err) => {
        if (err) throw err
        console.log('File is deleted.')
        cb(null, `${file.originalname}`)
      })
    } else {
      cb(null, `${file.originalname}`)
    }
  },
})

const fileFilter = (req, file, callback) => {
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
  var fileType = path.extname(file.originalname)
  if (fileType !== '.jpg' && fileType !== '.jpeg' && fileType !== '.png') {
    return callback(new Error('이미지만 업로드하세요'))
  }
  callback(null, true)
}

const limits = {
  fieldNameSize: 200, //필드명 사이즈 최대값
  filedSize: 1024 * 1024, // 필드 사이즈 값 설정 (기본값 1MB)
  fields: 2, // 파일 형식이 아닌 필드의 최대 개수 (기본 값 무제한)
  fileSize: 16777216, //multipart 형식 폼에서 최대 파일 사이즈(bytes) "16MB 설정" (기본 값 무제한)
  files: 1, //multipart 형식 폼에서 파일 필드 최대 개수 (기본 값 무제한)
}

const app = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Sorry something Happened! ${error.message}` })
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` })
  },
})

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: limits })
app.post(upload.single('file'), function (req, res) {
  res.json(req.file)
})

export default app

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
}
