import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app'

describe('Posts API', () => {
  let createdPostId: string

  it('should create a new post', async () => {
    const postData = {
      text: 'Integration Test Post'
    }

    const response = await request(app)
      .post('/api/posts')
      .send(postData)

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('id')
    expect(response.body.text).toBe(postData.text)
    expect(response.body.status).toBe('DRAFT')

    createdPostId = response.body.id
  })

  it('should list posts', async () => {
    const response = await request(app).get('/api/posts')
    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    const found = response.body.find((p: any) => p.id === createdPostId)
    expect(found).toBeTruthy()
  })

  it('should update the post', async () => {
    const updateData = {
      text: 'Updated Integration Test Post'
    }

    const response = await request(app)
      .put(`/api/posts/${createdPostId}`)
      .send(updateData)

    expect(response.status).toBe(200)
    expect(response.body.text).toBe(updateData.text)
  })

  it('should delete the post', async () => {
    const response = await request(app).delete(`/api/posts/${createdPostId}`)
    expect(response.status).toBe(200)
    expect(response.body.is_deleted).toBe(true)
  })

  it('should return 404 for deleted post', async () => {
    const response = await request(app).get(`/api/posts/${createdPostId}`)
    expect(response.status).toBe(404)
  })
})
