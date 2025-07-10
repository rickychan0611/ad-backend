import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Context } from './types';

const JWT_SECRET = process.env['JWT_SECRET'] || 'youdonotknow';

export const authResolvers = {
  register: async (_: any, { email, password, fullName, role }: { email: string; password: string; fullName: string; role: string }, context: Context) => {
    const existingUser = await context.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await context.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role,
        balance: 0,
      },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
  },

  login: async (_: any, { email, password }: { email: string; password: string }, context: Context) => {
    const user = await context.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
  },
}; 