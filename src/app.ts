import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import path from 'path'
import { postsRouter } from './routes/posts'
import { imagesRouter } from './routes/images'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger'

export const app = express()

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}))
app.use(express.json())
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/posts', postsRouter)
app.use('/api/images', imagesRouter)
app.use('/api/images', express.static(path.join(process.cwd(), 'uploads')))

// Swagger Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/', express.static(path.join(process.cwd(), 'public')))
