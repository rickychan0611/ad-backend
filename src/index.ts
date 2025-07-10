import express, { Application, Request } from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import dotenv from 'dotenv';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
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
    await server.start();
    server.applyMiddleware({ app: app as any });

    const PORT: number = parseInt(process.env['PORT'] || '4000', 10);
    
    app.listen(PORT, () => {
      console.log(`🚀 GraphQL running at http://localhost:${PORT}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
