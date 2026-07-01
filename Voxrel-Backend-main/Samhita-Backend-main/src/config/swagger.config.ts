import swaggerJSDoc, { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management Backend API',
      version: '1.0.0',
      description:
        'A high-performance, role-based backend API for a task management platform built with Node.js, Express, TypeScript, and MongoDB.',
      contact: {
        name: 'API Support',
        email: 'support@taskmanagement.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? 'https://your-api-domain.com'
            : `http://localhost:${process.env.PORT || 3000}`,
        description:
          process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT Bearer token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'name', 'role', 'status'],
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId',
              example: '64f1a2b3c4d5e6f7g8h9i0j1',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              description: 'Full name of the user',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'FREELANCER'],
              description: 'User role in the system',
              example: 'FREELANCER',
            },
            status: {
              type: 'string',
              enum: ['PENDING_VERIFICATION', 'ACTIVE', 'BANNED'],
              description: 'Current status of the user account',
              example: 'ACTIVE',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last account update timestamp',
            },
          },
        },
        Task: {
          type: 'object',
          required: ['title', 'price', 'language'],
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId',
              example: '64f1a2b3c4d5e6f7g8h9i0j1',
            },
            title: {
              type: 'string',
              description: 'Task title',
              example: 'Transcribe Audio File',
            },
            description: {
              type: 'string',
              description: 'Detailed task description',
              example: 'Transcribe a 30-minute interview audio file from Hindi to English',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Task priority level',
              example: 'HIGH',
            },
            status: {
              type: 'string',
              enum: ['OPEN', 'PENDING_APPROVAL', 'ASSIGNED', 'SUBMITTED', 'IN_REVIEW', 'COMPLETED'],
              description: 'Current task status',
              example: 'OPEN',
            },
            assignedTo: {
              type: 'string',
              description: 'ID of the assigned freelancer',
              example: '64f1a2b3c4d5e6f7g8h9i0j1',
            },
            audioFileUrl: {
              type: 'string',
              description: 'URL to the audio file to be transcribed',
              example: 'https://cdn.example.com/audio/interview-001.mp3',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last task update timestamp',
            },
          },
        },
        Profile: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Reference to the user',
              example: '64f1a2b3c4d5e6f7g8h9i0j1',
            },
            bio: {
              type: 'string',
              description: 'User bio/description',
              example: 'Professional transcriptionist with 5+ years of experience',
            },
            languages: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Languages the freelancer can work with',
              example: ['english', 'hindi', 'spanish'],
            },
            country: {
              type: 'string',
              description: 'Country of residence',
              example: 'India',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
              example: true,
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              example: 200,
            },
            message: {
              type: 'string',
              description: 'Response message',
              example: 'Operation completed successfully',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            statusCode: {
              type: 'integer',
              example: 400,
            },
            message: {
              type: 'string',
              example: 'Bad Request',
            },
            error: {
              type: 'string',
              example: 'Detailed error message',
            },
          },
        },
        Review: {
          type: 'object',
          required: ['taskId', 'reviewerId', 'status'],
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId',
              example: '64f1a2b3c4d5e6f7g8h9i0j1',
            },
            taskId: {
              type: 'string',
              description: 'Reference to the task being reviewed',
              example: '64f1a2b3c4d5e6f7g8h9i0j2',
            },
            reviewerId: {
              type: 'string',
              description: 'Reference to the freelancer doing the review',
              example: '64f1a2b3c4d5e6f7g8h9i0j3',
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Rating given to the work',
              example: 4,
            },
            feedback: {
              type: 'string',
              description: 'Detailed feedback on the work',
              example: 'Good transcription quality with minor improvements needed',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'COMPLETED'],
              description: 'Current status of the review',
              example: 'COMPLETED',
            },
            assignedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the review was assigned',
            },
            submittedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the review was submitted',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Review creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last review update timestamp',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.ts', './controllers/*.ts', './validations/*.ts'], // Updated paths to new flat structure
};

export const swaggerSpec = swaggerJSDoc(options);
