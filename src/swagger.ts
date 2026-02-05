import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DevSync Paperboy API',
      version: '1.0.0',
      description: 'API for managing scheduled posts in DevSync Paperboy CMS',
    },
    servers: [
      {
        url: '/api',
        description: 'Current server (Relative)',
      },
      {
        url: 'http://localhost:3010/api',
        description: 'Development server',
      },
      {
        url: 'https://paperboy.boletoazap.dev.br/api',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            text: { type: 'string' },
            image_url: { type: 'string' },
            scheduled_at: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['DRAFT', 'SCHEDULED', 'QUEUED', 'SENT', 'FAILED', 'CANCELED'] },
            channels: { type: 'string' },
            last_error: { type: 'string' },
          },
        },
        CreatePostInput: {
          type: 'object',
          required: ['text'],
          properties: {
            title: { type: 'string' },
            text: { type: 'string' },
            image_url: { type: 'string' },
            scheduled_at: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['DRAFT', 'SCHEDULED'] },
            channels: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
