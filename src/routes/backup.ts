import { Router } from 'express'
import archiver from 'archiver'
import AdmZip from 'adm-zip'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { prisma } from '../lib/prisma'

export const backupRouter = Router()
const upload = multer({ dest: 'temp_restore/' })

// Backup
backupRouter.get('/', async (req, res) => {
  try {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`

    res.attachment(filename)

    archive.pipe(res)

    // Add Database
    const dbPath = path.join(process.cwd(), 'devsync_paperboy.db')
    if (fs.existsSync(dbPath)) {
      archive.file(dbPath, { name: 'devsync_paperboy.db' })
    }

    // Add Uploads
    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads')
    }

    await archive.finalize()
  } catch (err) {
    console.error('Backup error:', err)
    res.status(500).json({ error: 'backup_failed' })
  }
})

// Restore
backupRouter.post('/restore', upload.single('backup'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' })

  try {
    console.log('Starting restore process...')
    
    // 1. Disconnect Prisma to release DB lock
    await prisma.$disconnect()
    console.log('Prisma disconnected.')

    // 2. Extract Zip
    const zip = new AdmZip(req.file.path)
    const overwrite = true
    
    console.log('Extracting zip...')
    zip.extractAllTo(process.cwd(), overwrite)
    console.log('Extraction complete.')

    // 3. Clean up temp file
    fs.unlinkSync(req.file.path)
    
    // 4. Force reconnection check (simple query)
    await prisma.$connect()
    console.log('Prisma reconnected.')

    res.json({ message: 'Restore successful.' })
  } catch (err: any) {
    console.error('Restore error:', err)
    res.status(500).json({ error: 'restore_failed', details: err.message })
  }
})
