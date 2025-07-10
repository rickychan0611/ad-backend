export interface Context {
  user?: {
    id: number;
    role: string;
  } | undefined;
  prisma: any;
} 