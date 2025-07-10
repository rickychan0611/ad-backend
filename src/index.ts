import express, { Application, Request } from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import dotenv from 'dotenv';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './schema/resolvers.js';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

dotenv.config();

const prisma = new PrismaClient();
const app: Application = express();

const JWT_SECRET = process.env['JWT_SECRET'] || 'youdonotknow';

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GraphQL context type
interface GraphQLContext {
  user?: {
    id: number;
    role: string;
  } | undefined;
  prisma: PrismaClient;
}

const getUserFromToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }: { req: Request }): GraphQLContext => {
    const auth = req.headers.authorization;
    let user = null;

    console.log('🔍 Request:', req.body?.query?.substring(0, 30) + '...');
    console.log('🔍 Auth header:', auth ? 'Present' : 'Missing');

    if (auth) {
      const token = auth.replace('Bearer ', '');
      user = getUserFromToken(token);
      console.log('🔍 User from token:', user);
    }

    return { 
      user: user || undefined,
      prisma 
    };
  },
});

const startServer = async (): Promise<void> => {
  try {
    console.log('🔧 Starting server initialization...');
    
    // Test database connection
    console.log('🔧 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    console.log('🔧 Starting Apollo Server...');
    await server.start();
    server.applyMiddleware({ app: app as any });
    console.log('✅ Apollo Server started successfully');

    const PORT: number = parseInt(process.env['PORT'] || '4000', 10);
    console.log(`🔧 Starting HTTP server on port ${PORT}...`);
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`🚀 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
      console.log(`🚀 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    });
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
