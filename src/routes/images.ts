import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now()
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${ts}-${safe}`)
  }
})
const upload = multer({ storage })

export const imagesRouter = Router()

imagesRouter.post('/', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' })
  const urlPath = `/api/images/${req.file.filename}`
  res.status(201).json({ path: urlPath, filename: req.file.filename })
})
