import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

import { extractFilenameFromUrl } from '../utils'

const prisma = new PrismaClient()
export const postsRouter = Router()

const channelsSchema = z.array(z.string()).min(1).default(['WHATSAPP'])
const Statuses = ['DRAFT', 'SCHEDULED', 'QUEUED', 'SENT', 'FAILED', 'CANCELED'] as const
type Status = typeof Statuses[number]

// Zod Schemas for Swagger
/**
 * @swagger
 * components:
 *   schemas:
 *     CreatePostInput:
 *       type: object
 *       required: [text]
 *       properties:
 *         title:
 *           type: string
 *         text:
 *           type: string
 *         image_url:
 *           type: string
 *         scheduled_at:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [DRAFT, SCHEDULED]
 *         channels:
 *           type: array
 *           items:
 *             type: string
 *         timezone:
 *           type: string
 *     UpdatePostInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         text:
 *           type: string
 *         status:
 *           type: string
 *           enum: [DRAFT, SCHEDULED, CANCELED]
 *         scheduled_at:
 *           type: string
 *           format: date-time
 *     UpdateStatusInput:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [QUEUED, SENT, FAILED]
 *         provider_message_id:
 *           type: string
 *         last_error:
 *           type: string
 */

const createPostSchema = z.object({
  title: z.string().min(1).optional(),
  text: z.string().min(1),
  image_url: z.string().url().optional(),
  scheduled_at: z.string().datetime().optional(),
  timezone: z.string().default(process.env.DEFAULT_TIMEZONE || 'America/Sao_Paulo'),
  status: z.enum(Statuses).default('DRAFT'),
  channels: channelsSchema.optional()
})

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  image_url: z.string().url().optional().nullable(),
  scheduled_at: z.string().datetime().optional().nullable(),
  timezone: z.string().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'CANCELED']).optional(),
  channels: channelsSchema.optional()
})

const statusUpdateSchema = z.object({
  status: z.enum(['QUEUED', 'SENT', 'FAILED']),
  provider_message_id: z.string().optional(),
  last_error: z.string().optional()
})

function nowUTC() {
  return new Date()
}

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostInput'
 *     responses:
 *       201:
 *         description: Post created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 */
postsRouter.post('/', async (req, res) => {
  try {
    const input = createPostSchema.parse(req.body)
    let status: Status = input.status
    if (status === 'DRAFT' && input.scheduled_at) {
      status = 'SCHEDULED'
    }
    const created = await prisma.post.create({
      data: {
        title: input.title,
        text: input.text,
        image_url: input.image_url ?? undefined,
        scheduled_at: input.scheduled_at ? new Date(input.scheduled_at) : undefined,
        timezone: input.timezone,
        status,
        channels: (input.channels ?? ['WHATSAPP']).join(',')
      }
    })
    res.status(201).json(created)
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'invalid_input', details: err.issues })
    }
    console.error('Error creating post:', err)
    res.status(500).json({ error: 'internal_error', details: String(err?.message || err) })
  }
})

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: List all posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of posts
 */
postsRouter.get('/', async (req, res) => {
  try {
    const { status } = req.query
    const where: any = { is_deleted: false }
    if (status && typeof status === 'string') {
      if (!Statuses.includes(status as Status)) {
        return res.status(400).json({ error: 'invalid_status' })
      }
      where.status = status
    }
    const posts = await prisma.post.findMany({
      where,
      orderBy: { scheduled_at: 'asc' }
    })
    const normalized = posts.map((p: any) => ({
      ...p,
      channels: typeof p.channels === 'string' ? (p.channels as string).split(',').filter(Boolean) : p.channels
    }))
    res.json(normalized)
  } catch (err: any) {
    console.error('Error listing posts:', err)
    res.status(500).json({ error: 'internal_error', details: String(err?.message || err) })
  }
})

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 */
postsRouter.get('/:id', async (req, res) => {
  try {
    const post = await prisma.post.findFirst({
      where: { id: req.params.id, is_deleted: false }
    })
    if (!post) return res.status(404).json({ error: 'not_found' })
    const normalized = {
      ...post,
      channels: typeof post.channels === 'string' ? (post.channels as string).split(',').filter(Boolean) : post.channels
    }
    res.json(normalized)
  } catch (err: any) {
    console.error('Error getting post:', err)
    res.status(500).json({ error: 'internal_error', details: String(err?.message || err) })
  }
})

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePostInput'
 *     responses:
 *       200:
 *         description: Post updated
 */
postsRouter.put('/:id', async (req, res) => {
  try {
    const input = updatePostSchema.parse(req.body)
    const existing = await prisma.post.findUnique({ where: { id: req.params.id } })
    if (!existing || existing.is_deleted) return res.status(404).json({ error: 'not_found' })

    const data: any = {
      title: input.title ?? existing.title,
      text: input.text ?? existing.text,
      image_url: input.image_url === null ? null : input.image_url ?? existing.image_url ?? undefined,
      scheduled_at: input.scheduled_at === null ? null : (input.scheduled_at ? new Date(input.scheduled_at) : existing.scheduled_at),
      timezone: input.timezone ?? existing.timezone,
      channels: input.channels ? input.channels.join(',') : existing.channels
    }

    if (input.status) {
      data.status = input.status
      if (input.status === 'SCHEDULED') {
        data.queued_at = null
        data.sent_at = null
        data.failed_at = null
        data.last_error = null
      }
    }

    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data
    })
    res.json(updated)
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'invalid_input', details: err.issues })
    }
    console.error('Error updating post:', err)
    res.status(500).json({ error: 'internal_error', details: String(err?.message || err) })
  }
})

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Soft delete a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Post deleted
 */
postsRouter.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.post.findUnique({ where: { id: req.params.id } })
    if (!existing || existing.is_deleted) return res.status(404).json({ error: 'not_found' })

    // Delete image file if exists
    if (existing.image_url) {
      try {
        const filename = extractFilenameFromUrl(existing.image_url)
        if (filename) {
          const filePath = path.join(process.cwd(), 'uploads', filename)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        }
      } catch (e) {
        console.error('Failed to delete image file:', e)
      }
    }

    const deleted = await prisma.post.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    })
    res.json(deleted)
  } catch (err: any) {
    console.error('Error deleting post:', err)
    res.status(500).json({ error: 'internal_error', details: String(err?.message || err) })
  }
})

/**
 * @swagger
 * /posts/ready/list:
 *   get:
 *     summary: Get posts ready to be sent
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of ready posts
 */
postsRouter.get('/ready/list', async (_req, res) => {
  try {
    const now = nowUTC()
    const posts = await prisma.post.findMany({
      where: {
        is_deleted: false,
        status: 'SCHEDULED',
        OR: [
          { scheduled_at: null },
          { scheduled_at: { lte: now } }
        ]
      },
      orderBy: { scheduled_at: 'asc' }
    })
    const normalized = posts.map((p: any) => ({
      ...p,
      channels: typeof p.channels === 'string' ? (p.channels as string).split(',').filter(Boolean) : p.channels
    }))
    res.json(normalized)
  } catch (err: any) {
    res.status(500).json({ error: 'internal_error', details: String(err?.message || err) })
  }
})

/**
 * @swagger
 * /posts/{id}/status:
 *   put:
 *     summary: Update post status (external system)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatusInput'
 *     responses:
 *       200:
 *         description: Status updated
 */
postsRouter.put('/:id/status', async (req, res) => {
  try {
    const input = statusUpdateSchema.parse(req.body)
    const post = await prisma.post.findUnique({ where: { id: req.params.id } })
    if (!post || post.is_deleted) return res.status(404).json({ error: 'not_found' })

    const data: any = {
      status: input.status,
      provider_message_id: input.provider_message_id ?? post.provider_message_id
    }

    const now = nowUTC()
    if (input.status === 'QUEUED') {
      data.queued_at = now
    } else if (input.status === 'SENT') {
      data.sent_at = now
    } else if (input.status === 'FAILED') {
      data.failed_at = now
      if (input.last_error) data.last_error = input.last_error
    }

    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data
    })
    res.json(updated)
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'invalid_input', details: err.issues })
    }
    res.status(500).json({ error: 'internal_error', details: String(err?.message || err) })
  }
})

/**
 * @swagger
 * /posts/{id}/retry:
 *   post:
 *     summary: Retry a failed post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post rescheduled
 */
postsRouter.post('/:id/retry', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } })
    if (!post || post.is_deleted) return res.status(404).json({ error: 'not_found' })
    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        status: 'SCHEDULED',
        queued_at: null,
        sent_at: null,
        failed_at: null,
        last_error: null
      }
    })
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: 'internal_error', details: String(err?.message || err) })
  }
})
